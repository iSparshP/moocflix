// src/middlewares/validateRequest.js
const { AppError } = require('../utils/errorUtils');
const logger = require('../utils/logger');

const validateRequest = (schema, options = {}) => {
    return (req, res, next) => {
        try {
            const validationOptions = {
                abortEarly: false,
                stripUnknown: true,
                presence: options.required ? 'required' : 'optional',
                ...options,
            };

            const { error, value } = schema.validate(
                req.body,
                validationOptions
            );

            if (error) {
                const details = error.details.map((d) => d.message).join(', ');

                logger.error('Request validation failed', {
                    path: req.path,
                    errors: details,
                    body: req.body,
                });

                throw new AppError(details, 400);
            }

            // Replace request body with sanitized data
            req.body = value;
            logger.debug('Request validation successful', { path: req.path });

            next();
        } catch (err) {
            if (err instanceof AppError) {
                return res.status(err.statusCode).json({
                    status: err.status,
                    message: err.message,
                });
            }
            next(err);
        }
    };
};

module.exports = { validateRequest };
