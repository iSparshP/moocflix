class ErrorHandler {
    static async handleServiceOperation(operation, errorMessage) {
        try {
            return await operation();
        } catch (error) {
            throw new Error(`${errorMessage}: ${error.message}`);
        }
    }

    static handleValidationError(res, error) {
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors: error.array(),
        });
    }

    static handleServiceError(res, error) {
        const status = error.statusCode || 500;
        return res.status(status).json({
            status: 'error',
            message: error.message,
        });
    }
}

module.exports = ErrorHandler;
