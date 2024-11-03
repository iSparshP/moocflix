const { logger } = require('../config/logger');

const sendResponse = (
    res,
    { status = 200, data = null, message = '', error = null }
) => {
    const response = {
        status: status < 400 ? 'success' : 'error',
        message,
        ...(data && { data }),
        ...(error && { error }),
    };

    res.status(status).json(response);
};

const handleError = (error, req, res, next) => {
    logger.error('Error occurred:', {
        error: error.message,
        stack: error.stack,
        path: req.path,
    });

    if (error.isOperational) {
        return sendResponse(res, {
            status: error.statusCode,
            message: error.message,
            error: error.name,
        });
    }

    sendResponse(res, {
        status: 500,
        message: 'Internal server error',
        error:
            process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
};

module.exports = {
    sendResponse,
    handleError,
};
