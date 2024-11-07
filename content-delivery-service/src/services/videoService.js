const s3Service = require('./s3Service');
const { sendMessage } = require('../config/kafka');
const Video = require('../models/Video');
const logger = require('../utils/logger');
const { createBreaker } = require('../utils/circuitBreaker');

class VideoService {
    constructor() {
        // Create circuit breakers for external services
        this.s3Breaker = createBreaker('s3-operations');
        this.kafkaBreaker = createBreaker('kafka-operations');
    }

    async uploadVideo(file, courseId, userId) {
        try {
            // Upload to S3 with circuit breaker
            const s3Response = await this.s3Breaker.fire(() =>
                s3Service.uploadFile(file)
            );

            // Create video record with more metadata
            const video = await Video.create({
                filename: file.originalname,
                s3_url: s3Response.Location,
                course_id: courseId,
                uploaded_by: userId,
                status: 'pending',
                metadata: {
                    size: file.size,
                    mimetype: file.mimetype,
                    uploadedAt: new Date(),
                    originalName: file.originalname,
                },
            });

            // Request transcoding with multiple quality profiles
            await this.kafkaBreaker.fire(() =>
                sendMessage('Transcoding-Request', {
                    videoId: video.id,
                    s3_url: s3Response.Location,
                    profiles: ['1080p', '720p', '480p'],
                    priority: 'normal',
                    metadata: {
                        courseId,
                        filename: file.originalname,
                        userId,
                        requestedAt: new Date().toISOString(),
                    },
                })
            );

            return video;
        } catch (error) {
            logger.error('Video upload failed:', error);
            // Cleanup on failure
            if (s3Response?.Location) {
                await this.s3Breaker
                    .fire(() => s3Service.deleteFile(s3Response.Location))
                    .catch((err) => logger.error('Cleanup failed:', err));
            }
            throw error;
        }
    }

    async streamVideo(videoId, quality = '720p') {
        const video = await Video.findByPk(videoId);
        if (!video) {
            throw new Error('Video not found');
        }

        // Get signed URL for streaming
        const streamUrl = await s3Service.getSignedUrl(
            video.transcoded_url[quality] || video.s3_url
        );

        return {
            url: streamUrl,
            metadata: {
                duration: video.duration,
                quality,
                format: video.format,
            },
        };
    }
}

module.exports = new VideoService();
