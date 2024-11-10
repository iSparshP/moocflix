const { ValidationError } = require('./errors');

class ValidationHelper {
    static validateMongoId(id) {
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            throw new ValidationError('Invalid ID format');
        }
    }

    static validateRequiredFields(obj, fields) {
        fields.forEach((field) => {
            if (!obj[field]) {
                throw new ValidationError(`${field} is required`);
            }
        });
    }

    static validateEnum(value, allowedValues, fieldName) {
        if (!allowedValues.includes(value)) {
            throw new ValidationError(
                `Invalid ${fieldName}. Allowed values: ${allowedValues.join(
                    ', '
                )}`
            );
        }
    }

    static validateDateRange(startDate, endDate) {
        if (new Date(startDate) >= new Date(endDate)) {
            throw new ValidationError('Start date must be before end date');
        }
    }
}

module.exports = ValidationHelper;
