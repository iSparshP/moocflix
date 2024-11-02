// src/services/transcodeService.js
const config = require('../config/config');
const Video = require('../models/Video');
const kafka = require('../utils/kafka');
const logger = require('../utils/logger');
const { createBreaker } = require('../utils/circuitBreaker');

// Create circuit breaker for Kafka operations
const kafkaBreaker = createBreaker(
    'kafka-producer',
    async (message) => {
        return await kafka.producer.send(message);
    },
    {
        timeout: 2000,
        errorThresholdPercentage: 30,
    }
);

class TranscodeService {
    constructor() {
        this.producer = kafka.producer;
    }

    async requestTranscoding(videoId) {
        try {
            logger.info(`Requesting transcoding for video: ${videoId}`);

            await Video.update(
                { status: 'transcoding' },
                { where: { id: videoId } }
            );

            const message = {
                topic: config.kafka.topics.transcodeRequest,
                messages: [{ value: JSON.stringify({ videoId }) }],
            };

            await kafkaBreaker.fire(message);
            logger.info(`Transcoding request sent for video: ${videoId}`);
            return true;
        } catch (error) {
            logger.error(
                `Transcoding request failed for video ${videoId}:`,
                error
            );

            await Video.update(
                {
                    status: 'failed',
                    error_message: error.message,
                },
                { where: { id: videoId } }
            );
            throw error;
        }
    }

    async handleTranscodingComplete(videoId, transcodedUrl) {
        try {
            logger.info(
                `Handling transcoding completion for video: ${videoId}`
            );

            await Video.update(
                {
                    status: 'completed',
                    transcoded_url: transcodedUrl,
                },
                { where: { id: videoId } }
            );

            logger.info(`Video ${videoId} transcoding completed successfully`);
        } catch (error) {
            logger.error(
                `Failed to handle transcoding completion for video ${videoId}:`,
                error
            );
            throw error;
        }
    }
}

module.exports = new TranscodeService();
