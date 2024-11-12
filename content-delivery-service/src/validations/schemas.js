const Joi = require('joi');

// Common validation patterns
const patterns = {
    uuid: Joi.string().uuid(),
    quality: Joi.string().valid('480p', '720p', '1080p'),
    format: Joi.string().valid('mp4', 'hls'),
};

// Video-related schemas
const videoSchemas = {
    upload: Joi.object({
        courseId: patterns.uuid.required(),
        title: Joi.string().min(3).max(255).required(),
        description: Joi.string().max(1000).optional(),
        quality: patterns.quality.default('720p'),
        format: patterns.format.default('mp4'),
    }),

    params: {
        videoId: Joi.object({
            videoId: patterns.uuid.required(),
        }),
    },

    query: {
        streaming: Joi.object({
            quality: patterns.quality.default('720p'),
            format: patterns.format.default('hls'),
        }),
    },

    transcoding: Joi.object({
        format: patterns.format.default('mp4'),
        quality: patterns.quality.default('720p'),
        generateThumbnails: Joi.boolean().default(true),
    }),
};

// Course-related schemas
const courseSchemas = {
    params: {
        courseId: Joi.object({
            courseId: patterns.uuid.required(),
        }),
    },
};

// Enrollment-related schemas
const enrollmentSchemas = {
    create: Joi.object({
        studentId: patterns.uuid.required(),
        courseId: patterns.uuid.required(),
    }),
};

// File validation schemas
const fileSchemas = {
    video: Joi.object({
        mimetype: Joi.string()
            .valid('video/mp4', 'video/mkv', 'video/avi')
            .required(),
        size: Joi.number()
            .max(100 * 1024 * 1024)
            .required(), // 100MB limit
    }),
};

module.exports = {
    video: videoSchemas,
    course: courseSchemas,
    enrollment: enrollmentSchemas,
    file: fileSchemas,
    patterns,
};
