const BaseError = require('./BaseError');

class AuthenticationError extends BaseError {
    constructor(message = 'Authentication failed') {
        super(message, 401);
        this.name = 'AuthenticationError';
    }
}

module.exports = AuthenticationError;
