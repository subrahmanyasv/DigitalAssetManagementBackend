import bcrypt from "bcrypt";
import { AuthService } from "../../services/auth.service.js";
import { TransactionService } from "../../services/transaction.service.js";
import { ErrorHandler } from "../../utils/errorHandler.js";
import User from "../../models/user.model.js";

const authService = new AuthService();

export class AuthController {
    async register(req, res) {
        try {
            const { email, password } = req.body;
            
            // Validate input
            if (!email || !password) {
                return res.status(400).json({ message: 'Email and password are required' });
            }

            // Execute registration within transaction
            const result = await TransactionService.executeTransaction(async (session) => {
                // Check if user already exists
                const existingUser = await User.findOne({ email }).session(session);
                if (existingUser) {
                    throw ErrorHandler.createError('User already exists', 400);
                }

                // Hash password
                const hashPassword = await bcrypt.hash(password, 10);

                // Create new user
                const newUser = new User({
                    email,
                    password: hashPassword,
                });

                // Save user with session
                await newUser.save({ session });

                // Generate tokens
                const { accessToken, refreshToken } = await authService.generateTokens({email, hashPassword});

                return {
                    user: newUser,
                    accessToken,
                    refreshToken
                };
            });

            // Set cookie and send response (outside transaction)
            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',      
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                sameSite: 'lax', 
            });

            res.status(201).json({ 
                message: 'User registered successfully', 
                accessToken: result.accessToken 
            });

        } catch (error) {
            return ErrorHandler.handleDatabaseError(error, res, 'Registration');
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;

            // Execute login within transaction
            const result = await TransactionService.executeTransaction(async (session) => {
                // Find user with session
                const user = await User.findOne({ email }).session(session);
                if (!user) {
                    throw ErrorHandler.createError('User not found', 400);
                }

                // Verify password
                const isPasswordValid = await bcrypt.compare(password, user.password);
                if (!isPasswordValid) {
                    throw ErrorHandler.createError('Incorrect password', 400);
                }

                // Generate tokens
                const { accessToken, refreshToken } = await authService.generateTokens({email: user.email , password: user.password});

                return {
                    user,
                    accessToken,
                    refreshToken
                };
            });

            // Set cookie and send response (outside transaction)
            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            res.status(200).json({
                message: 'Login successful',
                accessToken: result.accessToken,
            });

        } catch (error) {
            return ErrorHandler.handleDatabaseError(error, res, 'Login');
        }
    }

    async logout(req, res) {
        try {
            const refreshToken = req.headers.cookie.split("=")[1];

            if (!refreshToken) {
                throw ErrorHandler.createError('Invalid refresh token format', 401);
            }

            let userEmail = null;

            // Get user email from refresh token if available
            if (refreshToken) {
                const decoded = await authService.verifyRefreshToken(refreshToken);
                if (decoded) {
                    userEmail = decoded.email;
                    console.log(userEmail);
                }
            }

            if (!userEmail) {
                throw ErrorHandler.createError('Invalid or expired refresh token - user not found', 401);
            }

            // Execute logout within transaction
            await TransactionService.executeTransaction(async (session) => {
                // Invalidate refresh token in Redis
                if (userEmail) {
                    await authService.invalidateRefreshToken(userEmail);
                }
                
                res.clearCookie('refreshToken');
                return { success: true };
            });

            res.status(200).json({ message: 'Logged out successfully' });

        } catch (error) {
            return ErrorHandler.handleDatabaseError(error, res, 'Logout');
        }
    }

    async refreshAccessToken(req, res) {
        try {
            const { refreshToken } = req.cookies;
            if (!refreshToken) {
                return res.status(401).json({ message: 'Refresh token is missing' });
            }

            // Execute token refresh within transaction
            const result = await TransactionService.executeTransaction(async (session) => {
                // Verify and refresh tokens using Redis validation
                const tokens = await authService.refreshTokens(refreshToken);
                if (!tokens) {
                    throw ErrorHandler.createError('Invalid or expired refresh token', 403);
                }

                return tokens;
            });

            // Set new refresh token cookie
            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            res.json({ accessToken: result.accessToken });

        } catch (error) {
            return ErrorHandler.handleDatabaseError(error, res, 'Token refresh');
        }
    }
}