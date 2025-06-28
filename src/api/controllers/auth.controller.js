import bcrypt from "bcrypt";
import { AuthService } from "../../services/auth.service.js";
import User from "../../models/user.model.js";
const authService = new AuthService();

export class AuthController {
    async register(req, res) {
        try{
            const { email , password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ message: 'Email and password are required' });
            }
            const user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({ message: 'User already exists' });
            }
            const hashPassword = await bcrypt.hash(password, 10);
            const newUser = new User({
                email,
                password: hashPassword,
            });
            await newUser.save();

            const { accessToken, refreshToken } = authService.generateTokens(newUser);
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',      
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                sameSite: 'lax', 
            });
            res.status(201).json({ message: 'User registered successfully', accessToken });

        }catch( error ){
            console.error(error);
            res.status(500).json({ message: 'Internal server error! Try again later.' });
        }
    }


    async login(req, res) {
        try {
            const { email, password } = req.body;
            const user = await User.findOne({ email });
            if (!user)
                return res.status(400).json({ message: 'User not found' });
            if (!await bcrypt.compare(password, user.password))
                return res.status(400).json({ message: 'Incorrect password' });

            const { accessToken, refreshToken } = authService.generateTokens(user);

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            res.status(200).json({
                message: 'Login successful',
                accessToken,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal server error! Try again later.' });
        }
    }

    async logout(req, res) {
        try {
            res.clearCookie('refreshToken');
            res.status(200).json({ message: 'Logged out successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal server error! Try again later.' });
        }
    }



    async refreshAccessToken(req, res) {
        try {
            const { refreshToken } = req.cookies;
            if (!refreshToken) {
                return res.status(401).json({ message: 'Refresh token is missing' });
            }

            let user;
            try {
                user = authService.verifyRefreshToken(refreshToken);
                if (!user) {
                    return res.status(403).json({ message: 'Invalid or expired refresh token' });
                }

                const accessToken = authService.refreshAccessToken(user);
            } catch (error) {
                console.error('Refresh token verification failed:', error);
                return res.status(403).json({ message: 'Invalid or expired refresh token' });
            }

            const newAccessToken = authService.generateAccessToken(user);
            res.json({ accessToken: newAccessToken });
        }catch( error ){
            console.error(error);
            res.status(500).json({ message: 'Internal server error! Try again later.' });
        }
    }
}