// src/services/validationService.js
const fs = require('fs').promises;
const path = require('path');
const Joi = require('joi');
const { ValidationError } = require('../middleware/errorHandler');
const { TRANSCODING_PROFILES } = require('../constants/profiles');
const { paths } = require('../config/env');
const BaseService = require('./baseService');

class ValidationService extends BaseService {
    constructor() {
        super();
        this.initializeSchemas();
    }

    async init() {
        await super.init();
        // Initialize validation rules
        await this.loadCustomValidations();
    }

    async validateJob(data) {
        const isValid = await super.validateJob(data);
        this.emit('validation:complete', { jobId: data.videoId, isValid });
        return isValid;
    }

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

    validateResourceRequirements(profile) {
        const selectedProfile = TRANSCODING_PROFILES[profile || 'default'];

        // Calculate estimated resource requirements
        const estimatedResources = {
            cpu: selectedProfile.resolution === '1080p' ? 2 : 1,
            memory: selectedProfile.resolution === '1080p' ? 2048 : 1024,
        };

        return estimatedResources;
    }

    // Add method to validate output file
    async validateOutputFile(videoId) {
        const outputPath = path.join(paths.output, `${videoId}-transcoded.mp4`);
        try {
            const stats = await fs.stat(outputPath);
            if (stats.size === 0) {
                throw new ValidationError('Output file is empty');
            }
            return true;
        } catch (error) {
            throw new ValidationError(
                `Output file validation failed: ${error.message}`
            );
        }
    }
}

const validator = new ValidationService();
module.exports = validator;
