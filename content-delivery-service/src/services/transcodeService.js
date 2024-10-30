// src/services/transcodeService.js
const kafka = require('../utils/kafka');
const Video = require('../models/Video');

exports.requestTranscoding = async (videoId) => {
    try {
        // Update status to transcoding
        await Video.update(
            { status: 'transcoding' },
            { where: { id: videoId } }
        );

        // Send transcoding request
        await kafka.sendMessage('Transcoding-Request', {
            videoId,
            timestamp: new Date().toISOString(),
        });

        return true;
    } catch (error) {
        // Revert status on failure
        await Video.update({ status: 'failed' }, { where: { id: videoId } });
        throw error;
    }
};
