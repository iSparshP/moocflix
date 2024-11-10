const { AppError } = require('../utils/errors');
const { logger } = require('../config/logger');
const ErrorHandler = require('../utils/errorHandler');

class BaseController {
    static async handleRequest(req, res, asyncFn) {
        try {
            const result = await asyncFn(req);
            ErrorHandler.handleResponse(res, {
                status: 200,
                data: result,
            });
        } catch (error) {
            logger.error('Controller error:', {
                error: error.message,
                stack: error.stack,
            });
            ErrorHandler.handleError(error, req, res);
        }
    }

    static created(res, data) {
        ErrorHandler.handleResponse(res, {
            status: 201,
            data,
            message: 'Resource created successfully',
        });
    }

    static success(res, data, message = 'Success') {
        ErrorHandler.handleResponse(res, {
            status: 200,
            data,
            message,
        });
    }

    static notFound(res, message = 'Resource not found') {
        ErrorHandler.handleResponse(res, {
            status: 404,
            error: message,
        });
    }

    static badRequest(res, message = 'Invalid request') {
        ErrorHandler.handleResponse(res, {
            status: 400,
            error: message,
        });
    }

    static unauthorized(res, message = 'Unauthorized') {
        ErrorHandler.handleResponse(res, {
            status: 401,
            error: message,
        });
    }

    static forbidden(res, message = 'Forbidden') {
        ErrorHandler.handleResponse(res, {
            status: 403,
            error: message,
        });
    }

    static noContent(res) {
        res.status(204).end();
    }
}

module.exports = { BaseController };
