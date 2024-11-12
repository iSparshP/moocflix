const jwt = require('jsonwebtoken');
const config = require('../config/config');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('No authentication token provided', 401);
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, config.jwt.secret);

        req.user = {
            id: decoded.id,
            role: decoded.role,
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            next(new AppError('Invalid authentication token', 401));
        } else if (error.name === 'TokenExpiredError') {
            next(new AppError('Authentication token has expired', 401));
        } else {
            next(error);
        }
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError(
                    'You do not have permission to perform this action',
                    403
                )
            );
        }
        next();
    };
};

module.exports = {
    authenticate,
    authorize,
};
