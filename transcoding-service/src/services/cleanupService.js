// src/services/cleanupService.js
const fs = require('fs').promises;
const path = require('path');
const { paths } = require('../config/environment');
const logger = require('../utils/logger');
const BaseService = require('./baseService');

class CleanupService extends BaseService {
    async cleanupTranscodedFile(videoId) {
        try {
            const inputPath = path.join(paths.input, `${videoId}.mp4`);
            await fs.unlink(inputPath);
            logger.info(`Cleaned up input file for video ID: ${videoId}`);
        } catch (error) {
            logger.error(`Error cleaning up input file for ${videoId}:`, error);
        }
    }

    async cleanupStaleFiles() {
        try {
            const files = await fs.readdir(paths.input);
            for (const file of files) {
                const filePath = path.join(paths.input, file);
                await fs.unlink(filePath);
            }
            logger.info('Cleanup completed successfully');
        } catch (error) {
            logger.error('Cleanup failed', { error });
            throw error;
        }
    }
}

module.exports = new CleanupService();
