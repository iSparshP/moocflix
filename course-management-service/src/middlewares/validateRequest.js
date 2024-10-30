// src/middlewares/validateRequest.js
const Joi = require('joi');

const schemas = {
    createCourse: Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required(),
        // Add other validations
    }),
    updateCourse: Joi.object({
        title: Joi.string(),
        description: Joi.string(),
        // Add other validations
    }),
};

module.exports = (schema) => {
    return (req, res, next) => {
        const { error } = schemas[schema].validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        next();
    };
};
