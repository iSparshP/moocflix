const errorHandler = (err, req, res, next) => {
    console.error('Error:', {
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
    });

    // Handle specific error types
    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({
            status: 'error',
            message: 'Validation error',
            errors: err.errors.map((e) => e.message),
        });
    }

    if (err.name === 'KafkaJSError') {
        return res.status(503).json({
            status: 'error',
            message: 'Messaging service unavailable',
            error: err.message,
        });
    }

    // Default error response
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
};

module.exports = errorHandler;
