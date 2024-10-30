// src/middlewares/errorHandler.js
const { BaseError } = require('../utils/errors');

const errorHandler = (err, req, res, next) => {
    console.error(err);

    // Operational, trusted error: send message to client
    if (err instanceof BaseError) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            errors: err.errors,
            code: err.name,
        });
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map((error) => error.message);
        return res.status(400).json({
            status: 'fail',
            message: 'Invalid input data',
            errors,
            code: 'ValidationError',
        });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        return res.status(409).json({
            status: 'fail',
            message: 'Duplicate field value',
            field: Object.keys(err.keyValue)[0],
            code: 'DuplicateError',
        });
    }

    // Default to 500 server error
    res.status(500).json({
        status: 'error',
        message:
            process.env.NODE_ENV === 'development'
                ? err.message
                : 'Internal server error',
        code: 'InternalError',
    });
};

module.exports = errorHandler;
