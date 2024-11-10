const jwt = require('jsonwebtoken');
const BaseError = require('../utils/errors/BaseError');
const { logger } = require('../config/logger');

const authenticate = (req, res, next) => {
    try {
        // Public paths that don't require authentication
        const publicPaths = ['/health', '/api-docs', '/favicon.ico'];
        if (publicPaths.some((path) => req.path.startsWith(path))) {
            return next();
        }

        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new BaseError('No token provided', 401, 'UNAUTHORIZED');
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Add user info to request
        req.user = decoded;

        // Add user ID to logger context
        logger.defaultMeta = {
            ...logger.defaultMeta,
            userId: decoded.id,
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            next(new BaseError('Invalid token', 401, 'INVALID_TOKEN'));
        } else if (error.name === 'TokenExpiredError') {
            next(new BaseError('Token expired', 401, 'TOKEN_EXPIRED'));
        } else {
            next(error);
        }
    }
};

module.exports = { authenticate };
