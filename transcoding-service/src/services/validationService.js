// src/services/validationService.js
const fs = require('fs').promises;
const path = require('path');
const Joi = require('joi');
const { ValidationError } = require('../middleware/errorHandler');
const { TRANSCODING_PROFILES } = require('../constants/profiles');
const { paths } = require('../config/env');

class ValidationService {
    // Allowed video formats
    static ALLOWED_FORMATS = ['mp4', 'mov', 'avi', 'mkv'];

    // Max file size (10GB)
    static MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024;

    async validateVideoFile(videoId) {
        const inputPath = path.join(paths.input, `${videoId}.mp4`);

        try {
            // Check if file exists
            const stats = await fs.stat(inputPath);

            // Validate file size
            if (stats.size > ValidationService.MAX_FILE_SIZE) {
                throw new ValidationError(
                    `File size exceeds maximum allowed (${ValidationService.MAX_FILE_SIZE} bytes)`
                );
            }

            // Validate file extension
            const ext = path.extname(inputPath).toLowerCase().slice(1);
            if (!ValidationService.ALLOWED_FORMATS.includes(ext)) {
                throw new ValidationError(
                    `Invalid file format. Allowed formats: ${ValidationService.ALLOWED_FORMATS.join(
                        ', '
                    )}`
                );
            }

            return true;
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            throw new ValidationError(
                `Invalid or missing video file: ${error.message}`
            );
        }
    }

    validateJobParameters({ videoId, profile, priority }) {
        // Validate videoId
        if (!videoId || typeof videoId !== 'string' || videoId.length < 1) {
            throw new ValidationError('Invalid or missing videoId');
        }

        // Validate profile
        if (profile && !TRANSCODING_PROFILES[profile]) {
            throw new ValidationError(
                `Invalid profile. Available profiles: ${Object.keys(
                    TRANSCODING_PROFILES
                ).join(', ')}`
            );
        }

        // Validate priority
        if (priority && !['high', 'normal', 'low'].includes(priority)) {
            throw new ValidationError(
                'Invalid priority. Must be one of: high, normal, low'
            );
        }

        return true;
    }

    validateResourceRequirements(profile) {
        const selectedProfile = TRANSCODING_PROFILES[profile || 'default'];

        // Calculate estimated resource requirements
        const estimatedResources = {
            cpu: selectedProfile.resolution === '1080p' ? 2 : 1,
            memory: selectedProfile.resolution === '1080p' ? 2048 : 1024,
        };

        return estimatedResources;
    }

    validateJobRequest(data) {
        // Validate schema
        const schema = Joi.object({
            videoId: Joi.string().required(),
            profile: Joi.string().valid('low', 'default', 'high'),
            priority: Joi.string().valid('low', 'normal', 'high'),
            metadata: Joi.object({
                courseId: Joi.string(),
                duration: Joi.number(),
                format: Joi.string(),
            }),
        });

        const { error } = schema.validate(data);
        if (error) throw new ValidationError(error.message);

        return true;
    }
}

const validator = new ValidationService();
module.exports = validator;
