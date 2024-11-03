// src/middlewares/errorHandler.js
const { logger } = require('../config/logger');
const { BaseError } = require('../utils/errors');

const errorHandler = (err, req, res, next) => {
    logger.error('Error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
    });

    if (err instanceof BaseError) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    }

    res.status(500).json({
        status: 'error',
        message: 'Internal server error',
    });
};

module.exports = errorHandler;
