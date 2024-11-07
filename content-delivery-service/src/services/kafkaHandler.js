// src/services/kafkaHandler.js
const { consumeMessages } = require('../utils/kafka');
const Video = require('../models/Video');
const { redisClient } = require('../config/db');

const handleIncomingMessage = async (topic, message) => {
    try {
        if (!redisClient.isReady) {
            await redisClient.connect();
        }

        switch (topic) {
            case 'Student-Enrolled':
                const { courseId, studentId } = message;
                if (!courseId || !studentId) {
                    throw new Error('Invalid enrollment message format');
                }

                const videos = await Video.findAll({
                    where: {
                        course_id: courseId,
                        status: 'completed',
                    },
                    attributes: ['id', 's3_url', 'transcoded_url'],
                });

                await redisClient.setEx(
                    `student:${studentId}:course:${courseId}:videos`,
                    3600,
                    JSON.stringify(videos)
                );
                break;

            case 'Transcoding-Completed':
                const { videoId, transcodedUrl } = message;
                if (!videoId || !transcodedUrl) {
                    throw new Error('Invalid transcoding completion message');
                }

                await Video.update(
                    {
                        transcoded_url: transcodedUrl,
                        status: 'completed',
                    },
                    { where: { id: videoId } }
                );

                // Invalidate cache
                await redisClient.del(`video:${videoId}`);
                break;

            case 'Transcoding-Progress':
                await Video.update(
                    {
                        transcoding_progress: message.progress,
                        status: 'transcoding',
                    },
                    { where: { id: message.videoId } }
                );
                break;

            case 'Transcoding-Failed':
                await Video.update(
                    {
                        status: 'failed',
                        error_message: message.error.message,
                        transcoding_progress: 0,
                        metadata: {
                            error: message.error,
                            failedAt: new Date(message.timestamp),
                        },
                    },
                    { where: { id: message.videoId } }
                );
                break;

            default:
                console.warn(`Unhandled topic: ${topic}`);
        }
    } catch (error) {
        console.error(
            `Error handling Kafka message for topic ${topic}:`,
            error
        );
        // Add monitoring/alerting here
    }
};

const initializeKafkaConsumer = async () => {
    const maxRetries = 3;
    let retries = 0;

    while (retries < maxRetries) {
        try {
            await consumeMessages(
                [
                    'Student-Enrolled',
                    'Transcoding-Completed',
                    'Transcoding-Progress',
                    'Transcoding-Failed',
                ],
                handleIncomingMessage
            );
            console.log('Kafka consumer initialized successfully');
            return;
        } catch (error) {
            retries++;
            console.error(
                `Failed to initialize Kafka consumer (attempt ${retries}/${maxRetries}):`,
                error
            );
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
    }
    throw new Error('Failed to initialize Kafka consumer after max retries');
};

// Export with error handling
exports.initializeKafkaConsumer = async () => {
    try {
        await initializeKafkaConsumer();
    } catch (error) {
        console.error('Fatal error in Kafka consumer:', error);
        process.exit(1);
    }
};
