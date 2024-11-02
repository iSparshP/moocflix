// src/utils/errors.js
class AppError extends Error {
    constructor(message, statusCode, errorCode) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message) {
        super(message, 400, 'VALIDATION_ERROR');
    }
}

class AuthenticationError extends AppError {
    constructor(message = 'Unauthorized access') {
        super(message, 401, 'AUTHENTICATION_ERROR');
    }
}

class NotFoundError extends AppError {
    constructor(message) {
        super(message, 404, 'NOT_FOUND_ERROR');
    }
}

module.exports = {
    AppError,
    ValidationError,
    AuthenticationError,
    NotFoundError,
};
