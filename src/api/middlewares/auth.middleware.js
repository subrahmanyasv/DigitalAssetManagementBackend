// Middleware to authenticate all routes
import jwt from 'jsonwebtoken';
const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET || 'defaultAccessTokenSecret';

export function authenticate(req, res, next) {
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