// src/utils/errors.js
class BaseError extends Error {
    constructor(message, statusCode = 500, status = 'error') {
        super(message);
        this.statusCode = statusCode;
        this.status = status;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

class ServiceError extends BaseError {
    constructor(service, message) {
        super(`${service} Service Error: ${message}`, 503);
        this.name = 'ServiceError';
    }
}

class NotFoundError extends BaseError {
    constructor(message) {
        super(message, 404, 'fail');
        this.name = 'NotFoundError';
    }
}

class ValidationError extends BaseError {
    constructor(message) {
        super(message, 400, 'fail');
        this.name = 'ValidationError';
    }
}

module.exports = {
    BaseError,
    ServiceError,
    NotFoundError,
    ValidationError,
};
