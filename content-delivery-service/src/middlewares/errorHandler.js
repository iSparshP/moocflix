const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    // Log error details
    logger.error('Error details:', {
        error: err.message,
        name: err.name,
        stack: err.stack,
        path: req.path,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query,
        user: req.user?.id,
    });

    // Handle Joi validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors: err.validationErrors,
        });
    }

    // Handle Sequelize validation errors
    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({
            status: 'error',
            message: 'Database validation failed',
            errors: err.errors.map((e) => e.message),
        });
    }

    // Handle Multer errors
    if (err.name === 'MulterError') {
        return res.status(400).json({
            status: 'error',
            message: 'File upload error',
            error: err.message,
        });
    }

    // Handle operational errors
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    }

    // Handle programming or unknown errors
    res.status(500).json({
        status: 'error',
        message: 'Internal server error',
    });
};

module.exports = errorHandler;
