const ffmpeg = require('fluent-ffmpeg');
const { sendMessage } = require('../config/kafka');
const logger = require('../utils/logger');
const { TranscodingError } = require('../middleware/errorHandler');
const { getProfile } = require('../constants/profiles');
const path = require('path');
const { paths } = require('../config/config');

class TranscodeService {
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
                        sendMessage('Transcoding-Progress', {
                            videoId,
                            progress: Math.floor(progress.percent),
                            profile,
                            timestamp: Date.now(),
                            stats: {
                                fps: progress.frames,
                                speed: progress.currentFps,
                                time: progress.timemark,
                            },
                        }).catch((err) =>
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
}

module.exports = new TranscodeService();
