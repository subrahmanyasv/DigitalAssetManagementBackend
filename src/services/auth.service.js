import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET || 'defaultAccessTokenSecret';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET || 'defaultRefreshTokenSecret';


/**
    AuthService class for handling JWT token generation and verification.
    Provides methods to generate access and refresh tokens, and to verify them.
    NOTE: In varification methods, it only verifies the token's expiry and signature.
    It does not check if the token is revoked or blacklisted, or its validated user.
**/
export class AuthService{
    generateTokens(payload){
        const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
        const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

        return { accessToken, refreshToken };
    }


    //Verifies the access token.
    //If valid(unexpired), returns decoded payload, otherwise returns null
    authenticate(req, res, next){
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
            req.user = decoded;
            next();
          } catch (error) {
            console.error('Access token verification failed:', error);
            if (error.name === 'TokenExpiredError') {
              return res.status(401).json({ message: 'Access token expired' });
            } else {
              return res.status(403).json({ message: 'Invalid access token' });
            }
          }
    }

    verifyRefreshToken(token) {
        try {
            return jwt.verify(token, REFRESH_TOKEN_SECRET);
        } catch (error) {
            console.error('Refresh token verification failed:', error);
            return null; 
        }
    }

    generateAccessToken(payload) {
        return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    }
}

const authService = new AuthService();
export const authenticate = authService.authenticate.bind(authService);
