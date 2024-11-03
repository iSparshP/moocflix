class ResponseFormatter {
    static success(data = null, message = 'Success') {
        return {
            status: 'success',
            message,
            data,
        };
    }

    static error(message = 'Error occurred', errors = null) {
        return {
            status: 'error',
            message,
            errors,
        };
    }

    static paginated(data, page, limit, total) {
        return {
            status: 'success',
            data,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }
}

module.exports = ResponseFormatter;
