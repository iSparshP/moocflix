const { BaseError } = require('../utils/errors');
const { logger } = require('../config/logger');

class BaseService {
    static async handleServiceCall(serviceCall, errorMessage) {
        try {
            return await serviceCall();
        } catch (error) {
            logger.error(errorMessage, {
                error: error.message,
                stack: error.stack,
                service: this.constructor.name,
            });
            throw error instanceof BaseError
                ? error
                : new BaseError(errorMessage, 500);
        }
    }

    static validateId(id, type) {
        if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
            throw new BaseError(`Invalid ${type} ID`, 400);
        }
    }

    static async validateExists(Model, id, type) {
        const doc = await Model.findById(id);
        if (!doc) {
            throw new BaseError(`${type} not found`, 404);
        }
        return doc;
    }
}

module.exports = BaseService;
