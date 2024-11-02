const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');
const { TRANSCODING_PROFILES } = require('../constants/profiles');
const { paths } = require('../config/env');
const {
    TranscodingError,
    ValidationError,
} = require('../middleware/errorHandler');

exports.transcodeVideo = async (videoId, profile = 'default') => {
    logger.info(`Starting video transcoding`, { videoId, profile });

    if (!videoId) {
        throw new ValidationError('Video ID is required');
    }

    const selectedProfile =
        TRANSCODING_PROFILES[profile] || TRANSCODING_PROFILES.default;
    const inputPath = path.join(paths.input, `${videoId}.mp4`);
    const outputPath = path.join(paths.output, `${videoId}-${profile}.mp4`);

    // Verify input file exists
    if (!fs.existsSync(inputPath)) {
        throw new ValidationError(
            `Input file not found for video ID: ${videoId}`
        );
    }

    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .output(outputPath)
            .videoCodec('libx264')
            .size(selectedProfile.resolution)
            .videoBitrate(selectedProfile.videoBitrate)
            .audioBitrate(selectedProfile.audioBitrate)
            .on('progress', (progress) => {
                logger.debug('Transcoding progress', { videoId, progress });
            })
            .on('end', () => {
                logger.info(`Transcoding completed`, { videoId, profile });
                resolve(outputPath);
            })
            .on('error', (err) => {
                logger.error(`Transcoding failed`, {
                    videoId,
                    error: err.message,
                });
                reject(
                    new TranscodingError(
                        `Transcoding failed: ${err.message}`,
                        videoId
                    )
                );
            })
            .run();
    });
};
