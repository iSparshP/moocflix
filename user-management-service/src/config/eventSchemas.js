const Joi = require('joi');

const schemas = {
    'User-Creation': Joi.object({
        userId: Joi.string().required(),
        email: Joi.string().email().required(),
        role: Joi.string().valid('student', 'instructor', 'admin').required(),
        timestamp: Joi.date().iso().required(),
    }),

    'User-Update': Joi.object({
        userId: Joi.string().required(),
        email: Joi.string().email().required(),
        role: Joi.string().valid('student', 'instructor', 'admin').required(), // Add role validation
        timestamp: Joi.date().iso().required(), // Add timestamp validation
    }),
};

module.exports = schemas;
