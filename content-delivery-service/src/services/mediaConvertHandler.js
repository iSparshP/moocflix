const AWS = require('aws-sdk');
const Video = require('../models/Video');
const logger = require('../utils/logger');
const config = require('../config/config');
const cacheService = require('./cacheService');

class MediaConvertHandler {
    constructor() {
        this.mediaConvert = new AWS.MediaConvert({
            region: config.aws.region,
            endpoint: config.aws.mediaConvertEndpoint,
        });
    }

    async handleJobStatusChange(event) {
        try {
            const jobId = event.detail.jobId;
            const status = event.detail.status;

            const video = await Video.findOne({
                where: { transcoding_job_id: jobId },
            });

            if (!video) {
                logger.error(`No video found for MediaConvert job ${jobId}`);
                return;
            }

            switch (status) {
                case 'COMPLETE':
                    await this.handleJobComplete(video, event.detail);
                    break;
                case 'ERROR':
                    await this.handleJobError(video, event.detail);
                    break;
                case 'PROGRESSING':
                    await this.handleJobProgress(video, event.detail);
                    break;
                default:
                    logger.info(`Unhandled MediaConvert job status: ${status}`);
            }
        } catch (error) {
            logger.error('Error handling MediaConvert status change:', error);
        }
    }

    async handleJobComplete(video, detail) {
        try {
            const outputDetails = {
                hls_url: `transcoded/${video.id}/hls/master.m3u8`,
                mp4_url: `transcoded/${video.id}/mp4/mp4-1080p.mp4`,
                duration:
                    detail.outputGroupDetails[0].outputDetails[0].durationInMs /
                    1000,
                available_qualities: ['480p', '720p', '1080p'],
            };

            const thumbnailOutput = detail.outputGroupDetails.find(
                (group) => group.outputGroupName === 'Thumbnails'
            );

            let thumbnailUrl = null;
            let thumbnailTimestamps = [];

            if (thumbnailOutput && thumbnailOutput.outputDetails) {
                thumbnailUrl = `thumbnails/${video.id}/thumbnail.jpg`;
                thumbnailTimestamps = thumbnailOutput.outputDetails.map(
                    (detail) => detail.videoDetails.mediaTime
                );
            }

            await video.update({
                status: 'completed',
                transcoded_urls: outputDetails,
                duration: outputDetails.duration,
                thumbnail_url: thumbnailUrl,
                thumbnail_timestamps: thumbnailTimestamps,
            });

            const cacheKey = cacheService.generateVideoKey(video.id);
            await cacheService.set(cacheKey, {
                id: video.id,
                status: 'completed',
                progress: 100,
                metadata: video.metadata,
                transcoded_urls: outputDetails,
                duration: outputDetails.duration,
                thumbnails: {
                    url: thumbnailUrl,
                    timestamps: thumbnailTimestamps,
                },
            });

            logger.info(
                `Transcoding and thumbnail generation completed for video ${video.id}`
            );
        } catch (error) {
            logger.error(
                `Error handling job completion for video ${video.id}:`,
                error
            );
            throw error;
        }
    }

    async handleJobError(video, detail) {
        try {
            await video.update({
                status: 'failed',
                error_message: detail.errorMessage || 'Transcoding failed',
            });

            const cacheKey = cacheService.generateVideoKey(video.id);
            const cachedData = await cacheService.get(cacheKey);
            if (cachedData) {
                cachedData.status = 'failed';
                cachedData.error = detail.errorMessage || 'Transcoding failed';
                await cacheService.set(cacheKey, cachedData);
            }

            logger.error(
                `Transcoding failed for video ${video.id}:`,
                detail.errorMessage
            );
        } catch (error) {
            logger.error(
                `Error handling job failure for video ${video.id}:`,
                error
            );
            throw error;
        }
    }

    async handleJobProgress(video, detail) {
        try {
            const progress = detail.jobProgress?.jobPercentComplete || 0;
            await video.update({
                transcoding_progress: progress,
            });

            const cacheKey = cacheService.generateVideoKey(video.id);
            const cachedData = await cacheService.get(cacheKey);
            if (cachedData) {
                cachedData.progress = progress;
                await cacheService.set(cacheKey, cachedData);
            }

            logger.info(
                `Transcoding progress for video ${video.id}: ${progress}%`
            );
        } catch (error) {
            logger.error(
                `Error handling job progress for video ${video.id}:`,
                error
            );
            throw error;
        }
    }
}

module.exports = new MediaConvertHandler();
