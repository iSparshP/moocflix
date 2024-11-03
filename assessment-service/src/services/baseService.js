const { BaseError } = require('../utils/errors');
const { logger } = require('../config/logger');

class BaseService {
    static async handleServiceCall(serviceCall, errorMessage) {
        try {
            return await serviceCall();
        } catch (error) {
            logger.error(errorMessage, { error: error.message });
            throw new BaseError(errorMessage, 500);
        }
    }

    static validateId(id, type) {
        if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
            throw new BaseError(`Invalid ${type} ID`, 400);
        }
    }
}

module.exports = BaseService;
