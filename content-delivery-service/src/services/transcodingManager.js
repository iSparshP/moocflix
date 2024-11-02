const {
    transcodeVideo,
    handleMessage,
} = require('../../transcoding-jobs/transcodeJob');
const { Kafka } = require('kafkajs');
const config = require('../config/config');

class TranscodingManager {
    constructor() {
        this.kafka = new Kafka({
            clientId: config.kafka.clientId,
            brokers: config.kafka.brokers,
        });

        this.consumer = this.kafka.consumer({ groupId: 'transcoding-group' });
        this.producer = this.kafka.producer();
    }

    async start() {
        try {
            await this.consumer.connect();
            await this.producer.connect();

            await this.consumer.subscribe({
                topic: 'Transcoding-Request',
                fromBeginning: false,
            });

            await this.consumer.run({
                eachMessage: async ({ message }) => {
                    await handleMessage(message);
                },
            });

            console.log('Transcoding manager started successfully');
        } catch (error) {
            console.error('Failed to start transcoding manager:', error);
            throw error;
        }
    }

    async stop() {
        try {
            await this.consumer.disconnect();
            await this.producer.disconnect();
            console.log('Transcoding manager stopped successfully');
        } catch (error) {
            console.error('Error stopping transcoding manager:', error);
            throw error;
        }
    }

    async requestTranscoding(videoId) {
        return await transcodeVideo(videoId);
    }
}

module.exports = new TranscodingManager();
