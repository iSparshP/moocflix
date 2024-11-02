const { ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

const validateRequest = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const errors = error.details.map((detail) => detail.message);
            logger.warn('Validation error:', { errors, path: req.path });

            throw new ValidationError(
                'Invalid request data: ' + errors.join(', ')
            );
        }

        // Replace request data with validated data
        req[property] = value;
        next();
    };
};

module.exports = validateRequest;
