const jwt = require('jsonwebtoken');
const { BaseError } = require('../utils/errors');

const authenticate = (req, res, next) => {
    try {
        // Skip authentication for health check and swagger endpoints
        if (
            req.path.startsWith('/health') ||
            req.path.startsWith('/api-docs')
        ) {
            return next();
        }

        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new BaseError('No token provided', 401, 'fail');
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            next(new BaseError('Invalid token', 401, 'fail'));
        } else {
            next(error);
        }
    }
};

module.exports = authenticate;
