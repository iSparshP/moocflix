const Course = require('../models/course');
const kafka = require('../utils/kafka');
const logger = require('../utils/logger');
const { ValidationError } = require('../utils/errors');
const { validateKafkaMessage } = require('../utils/kafkaValidator');

module.exports = {
    async handleTranscodingCompleted(message) {
        try {
            validateKafkaMessage('transcodingCompleted', message);

            let retries = 3;
            while (retries > 0) {
                try {
                    const course = await Course.findById(message.courseId);
                    if (!course) {
                        throw new ValidationError(
                            `Course not found: ${message.courseId}`
                        );
                    }

                    const module = course.modules.id(message.moduleId);
                    if (!module) {
                        throw new ValidationError(
                            `Module not found: ${message.moduleId}`
                        );
                    }

                    // Update module with transcoded video URL and metadata
                    module.videoUrl = message.transcodedUrl;
                    module.videoMetadata = {
                        duration: message.duration,
                        format: message.format,
                        quality: message.quality,
                        size: message.size,
                        updatedAt: new Date(),
                    };
                    module.transcodingStatus = 'completed';

                    await course.save();

                    // Send video processing completed event
                    await kafka.sendMessage('Video-Processing-Completed', {
                        courseId: course._id,
                        moduleId: module._id,
                        videoUrl: message.transcodedUrl,
                        metadata: module.videoMetadata,
                        completedAt: new Date(),
                    });

                    logger.info('Video transcoding completed', {
                        courseId: message.courseId,
                        moduleId: message.moduleId,
                        videoUrl: message.transcodedUrl,
                        timestamp: new Date(),
                    });

                    break;
                } catch (error) {
                    retries--;
                    logger.error('Error handling transcoding completion:', {
                        error: error.message,
                        remainingRetries: retries,
                        moduleData: message,
                        stack: error.stack,
                    });

                    if (retries === 0) {
                        await kafka.sendMessage('Video-Processing-Failed', {
                            courseId: message.courseId,
                            moduleId: message.moduleId,
                            error: error.message,
                            failedAt: new Date(),
                        });
                    } else {
                        await new Promise((resolve) =>
                            setTimeout(resolve, 1000)
                        );
                    }
                }
            }
        } catch (error) {
            logger.error('Validation error in transcoding handler:', {
                error: error.message,
                moduleData: message,
                stack: error.stack,
            });
            throw error;
        }
    },
};
