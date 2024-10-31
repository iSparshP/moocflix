const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const { TRANSCODING_PROFILES } = require('../constants/profiles');
const { paths } = require('../config/env');
const { TranscodingError } = require('../middleware/errorHandler');

exports.transcodeVideo = (videoId, profile = 'default') => {
    console.log(
        `Transcoding video with ID: ${videoId} using profile: ${profile}`
    );

    const selectedProfile =
        TRANSCODING_PROFILES[profile] || TRANSCODING_PROFILES.default;
    const inputPath = path.join(paths.input, `${videoId}.mp4`);
    const outputPath = path.join(paths.output, `${videoId}-${profile}.mp4`);

    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .output(outputPath)
            .videoCodec('libx264')
            .size(selectedProfile.resolution)
            .videoBitrate(selectedProfile.videoBitrate)
            .audioBitrate(selectedProfile.audioBitrate)
            .on('end', () => {
                console.log(`Transcoding completed for video ID: ${videoId}`);
                resolve(outputPath);
            })
            .on('error', (err) => {
                console.error(`Error transcoding video ID: ${videoId}`, err);
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
