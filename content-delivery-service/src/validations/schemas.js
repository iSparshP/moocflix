const Joi = require('joi');

const schemas = {
    // Video upload validation
    uploadVideo: Joi.object({
        courseId: Joi.string().uuid().required(),
        title: Joi.string().min(3).max(255).required(),
        description: Joi.string().max(1000).optional(),
    }),

    // Video ID parameter validation
    videoId: Joi.object({
        videoId: Joi.string().uuid().required(),
    }),

    // Course ID parameter validation
    courseId: Joi.object({
        courseId: Joi.string().uuid().required(),
    }),

    // Enrollment validation
    enrollment: Joi.object({
        studentId: Joi.string().uuid().required(),
    }),

    // Transcoding request validation
    transcoding: Joi.object({
        format: Joi.string().valid('mp4', 'hls').default('mp4'),
        quality: Joi.string().valid('720p', '1080p', '480p').default('720p'),
    }),
};

module.exports = schemas;
