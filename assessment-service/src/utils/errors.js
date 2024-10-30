// src/utils/errors.js
class BaseError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends BaseError {
    constructor(message) {
        super(message, 400);
        this.name = 'ValidationError';
    }
}

class NotFoundError extends BaseError {
    constructor(resource) {
        super(`${resource} not found`, 404);
        this.name = 'NotFoundError';
    }
}

class AuthorizationError extends BaseError {
    constructor(message = 'Unauthorized access') {
        super(message, 401);
        this.name = 'AuthorizationError';
    }
}

class DuplicateError extends BaseError {
    constructor(resource) {
        super(`${resource} already exists`, 409);
        this.name = 'DuplicateError';
    }
}

class ServiceError extends BaseError {
    constructor(service, message) {
        super(`${service} service error: ${message}`, 503);
        this.name = 'ServiceError';
    }
}

module.exports = {
    ValidationError,
    NotFoundError,
    AuthorizationError,
    DuplicateError,
    ServiceError,
};
