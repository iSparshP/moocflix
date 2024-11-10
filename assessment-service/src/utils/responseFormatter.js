class ResponseFormatter {
    static success(data, message = 'Success') {
        return {
            status: 'success',
            data,
            message,
        };
    }

    static error(message, code = 'INTERNAL_ERROR', status = 500) {
        return {
            status: 'error',
            error: {
                message,
                code,
            },
            statusCode: status,
        };
    }

    static paginate(data, page, limit, total) {
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
