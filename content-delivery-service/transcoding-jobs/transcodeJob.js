const { Kafka } = require('kafkajs');
const AWS = require('aws-sdk');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { Video } = require('../src/models/Video');
const sequelize = require('../src/config/sequelize');

// Initialize Kafka
const kafka = new Kafka({
    clientId: 'transcoding-service',
    brokers: [process.env.KAFKA_BROKER],
});

const consumer = kafka.consumer({ groupId: 'transcoding-group' });
const producer = kafka.producer();

// Initialize S3
const s3 = new AWS.S3();

const transcodeVideo = async (videoUrl) => {
    const tempPath = `/tmp/${path.basename(videoUrl)}`;
    const transcodedPath = `/tmp/${path.basename(videoUrl)}-transcoded.mp4`;

    try {
        // Download video from S3
        const videoStream = s3
            .getObject({ Bucket: process.env.S3_BUCKET, Key: videoUrl })
            .createReadStream();

        // Transcode video using FFmpeg
        await new Promise((resolve, reject) => {
            ffmpeg(videoStream)
                .outputOptions('-c:v libx264', '-preset fast', '-crf 22')
                .save(transcodedPath)
                .on('end', resolve)
                .on('error', reject);
        });

        // Upload transcoded video back to S3
        const transcodedStream = fs.createReadStream(transcodedPath);
        const transcodedKey = `transcoded/${path.basename(videoUrl)}`;

        await s3
            .upload({
                Bucket: process.env.S3_BUCKET,
                Key: transcodedKey,
                Body: transcodedStream,
                ContentType: 'video/mp4',
            })
            .promise();

        return transcodedKey;
    } catch (error) {
        console.error(`Error transcoding video ${videoUrl}:`, error);
        throw error;
    } finally {
        // Cleanup temp files
        try {
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
            if (fs.existsSync(transcodedPath)) fs.unlinkSync(transcodedPath);
        } catch (err) {
            console.error('Error cleaning up temp files:', err);
        }
    }
};

const handleMessage = async (message) => {
    let videoId;
    try {
        const data = JSON.parse(message.value.toString());
        videoId = data.videoId;

        // Get video details from database
        const video = await Video.findByPk(videoId);
        if (!video) throw new Error(`Video not found: ${videoId}`);

        // Update status to transcoding
        await video.update({ status: 'transcoding' });

        // Transcode video
        const transcodedKey = await transcodeVideo(video.s3_url);

        // Send completion message
        await producer.send({
            topic: 'Transcoding-Completed',
            messages: [
                {
                    value: JSON.stringify({
                        videoId,
                        transcodedUrl: transcodedKey,
                    }),
                },
            ],
        });

        // Update video status to completed
        await video.update({
            status: 'completed',
            transcoded_url: transcodedKey,
        });
    } catch (error) {
        console.error('Transcoding failed:', error);

        // Update video status to failed
        if (videoId) {
            await Video.update(
                {
                    status: 'failed',
                    error_message: error.message,
                },
                { where: { id: videoId } }
            );
        }

        // Send failure message
        await producer.send({
            topic: 'Transcoding-Failed',
            messages: [
                {
                    value: JSON.stringify({
                        videoId,
                        error: error.message,
                    }),
                },
            ],
        });
    }
};

const shutdown = async () => {
    try {
        console.log('Shutting down transcoding service...');
        await consumer.disconnect();
        await producer.disconnect();
        await sequelize.close();
        console.log('Graceful shutdown completed');
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
};

const run = async () => {
    try {
        // Connect to Kafka
        await consumer.connect();
        await producer.connect();

        // Subscribe to transcoding requests
        await consumer.subscribe({
            topic: 'Transcoding-Request',
            fromBeginning: false,
        });

        // Process messages
        await consumer.run({
            eachMessage: async ({ message }) => {
                await handleMessage(message);
            },
        });

        // Handle graceful shutdown
        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);

        console.log('Transcoding service is running...');
    } catch (error) {
        console.error('Failed to start transcoding service:', error);
        process.exit(1);
    }
};

// Start the service
if (require.main === module) {
    run().catch(console.error);
}

module.exports = { transcodeVideo, handleMessage }; // Export for testing
