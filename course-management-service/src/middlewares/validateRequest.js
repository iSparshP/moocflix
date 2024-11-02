// src/middlewares/validateRequest.js
const Joi = require('joi');

const schemas = {
    createCourse: Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required(),
        modules: Joi.array().items(
            Joi.object({
                title: Joi.string().required(),
                content: Joi.string().required(),
                videoUrl: Joi.string().uri(),
                assessments: Joi.array().items(
                    Joi.object({
                        assessmentId: Joi.string().required(),
                        title: Joi.string().required(),
                        type: Joi.string().required(),
                    })
                ),
            })
        ),
    }),
    updateCourse: Joi.object({
        title: Joi.string(),
        description: Joi.string(),
        modules: Joi.array().items(
            Joi.object({
                title: Joi.string(),
                content: Joi.string(),
                videoUrl: Joi.string().uri(),
            })
        ),
    }),
    createModule: Joi.object({
        title: Joi.string().required(),
        content: Joi.string().required(),
        videoUrl: Joi.string().uri(),
    }),
    updateModule: Joi.object({
        title: Joi.string(),
        content: Joi.string(),
        videoUrl: Joi.string().uri(),
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
