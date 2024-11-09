const ffmpeg = require('fluent-ffmpeg');
const kafkaClient = require('./kafka/kafkaClient');
const s3Service = require('./s3Service');
const logger = require('../utils/logger');
const { TranscodingError } = require('../middleware/errorHandler');
const { getProfile } = require('../constants/profiles');
const path = require('path');
const { paths } = require('../config/environment');
const config = require('../config/environment');

class TranscodeService {
    async processVideoJob(message) {
        const { videoId, profile = 'default', s3Key } = message;
        logger.info(`Starting video processing job`, {
            videoId,
            profile,
            s3Key,
        });

        try {
            // 1. Download video from S3
            const inputPath = await s3Service.downloadVideo(videoId);
            logger.info(`Video downloaded successfully`, {
                videoId,
                inputPath,
            });

            // 2. Transcode the video
            const outputPath = await this.transcodeVideo(
                videoId,
                profile,
                (progress) => {
                    this.sendProgressUpdate(videoId, progress, profile);
                }
            );
            logger.info(`Video transcoded successfully`, {
                videoId,
                outputPath,
            });

            // 3. Upload transcoded video back to S3
            const s3Location = await s3Service.uploadVideo(videoId, profile);
            logger.info(`Video uploaded to S3`, { videoId, s3Location });

            // 4. Send completion notification via Kafka
            await kafkaClient.sendMessage(config.kafka.topics.completed, {
                videoId,
                profile,
                status: 'completed',
                s3Location,
                timestamp: Date.now(),
                metadata: {
                    originalKey: s3Key,
                    transcodedKey: s3Location,
                },
            });

            // 5. Cleanup local files
            await s3Service.cleanup(videoId);

            return s3Location;
        } catch (error) {
            logger.error(`Video processing failed`, { videoId, error });

            // Send failure notification via Kafka
            await kafkaClient.sendMessage(config.kafka.topics.failed, {
                videoId,
                profile,
                status: 'failed',
                error: error.message,
                timestamp: Date.now(),
            });

            // Ensure cleanup on failure
            await s3Service.cleanup(videoId);

            throw new TranscodingError(
                `Failed to process video: ${error.message}`,
                videoId,
                { profile }
            );
        }
    }

    async transcodeVideo(videoId, profile = 'default', progressCallback) {
        const inputPath = path.join(paths.input, `${videoId}.mp4`);
        const outputPath = path.join(paths.output, `${videoId}_${profile}.mp4`);

        try {
            const profileSettings = getProfile(profile);

            return new Promise((resolve, reject) => {
                ffmpeg(inputPath)
                    .videoBitrate(profileSettings.videoBitrate)
                    .audioBitrate(profileSettings.audioBitrate)
                    .size(`?x${profileSettings.resolution.replace('p', '')}`)
                    .on('start', () => {
                        logger.info(
                            `Starting transcoding for video ${videoId}`,
                            {
                                profile,
                                settings: profileSettings,
                            }
                        );
                    })
                    .on('progress', (progress) => {
                        if (progressCallback) {
                            progressCallback(Math.floor(progress.percent));
                        }

                        // Send progress updates via Kafka with more metadata
                        kafkaClient
                            .sendMessage('Transcoding-Progress', {
                                videoId,
                                progress: Math.floor(progress.percent),
                                profile,
                                timestamp: Date.now(),
                                stats: {
                                    fps: progress.frames,
                                    speed: progress.currentFps,
                                    time: progress.timemark,
                                },
                            })
                            .catch((err) =>
                                logger.error('Failed to send progress update', {
                                    error: err,
                                    videoId,
                                })
                            );
                    })
                    .on('end', () => {
                        logger.info(
                            `Transcoding completed for video ${videoId}`,
                            { profile }
                        );
                        resolve(outputPath);
                    })
                    .on('error', (err) => {
                        logger.error(
                            `Transcoding failed for video ${videoId}`,
                            {
                                error: err,
                                profile,
                                inputPath,
                            }
                        );
                        reject(
                            new TranscodingError(
                                `Transcoding failed: ${err.message}`,
                                videoId,
                                { profile, inputPath }
                            )
                        );
                    })
                    .save(outputPath);
            });
        } catch (error) {
            logger.error(`Error in transcodeVideo for ${videoId}:`, error);
            throw new TranscodingError(
                `Failed to transcode video: ${error.message}`,
                videoId,
                { profile }
            );
        }
    }

    async sendProgressUpdate(videoId, progress, profile) {
        try {
            await kafkaClient.sendMessage(config.kafka.topics.progress, {
                videoId,
                progress: Math.floor(progress),
                profile,
                timestamp: Date.now(),
                status: 'processing',
            });
        } catch (error) {
            logger.error('Failed to send progress update', { error, videoId });
        }
    }
}

module.exports = new TranscodeService();
