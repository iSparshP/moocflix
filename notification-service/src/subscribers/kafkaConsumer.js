const { Kafka, logLevel } = require('kafkajs');
const notificationService = require('../services/notificationService');
const kafkaConfig = require('../../config/kafkaConfig');
const Notification = require('../models/Notification');
const retry = require('retry');

const kafka = new Kafka({
    ...kafkaConfig,
    logLevel: logLevel.INFO,
});

const consumer = kafka.consumer({
    groupId: 'notification-service',
    sessionTimeout: 30000,
    heartbeatInterval: 3000,
    maxWaitTimeInMs: 50,
    retry: {
        maxRetryTime: 30000,
        initialRetryTime: 300,
        factor: 0.2,
        multiplier: 2,
        retries: 10,
    },
});

// Keep track of all topics we want to subscribe to
const TOPICS = [
    'Assessment-Creation',
    'Submission-Completed',
    'Course-Creation',
    'Course-Update',
    'Course-Deletion',
    'Module-Creation',
    'Module-Update',
    'Module-Deletion',
    'User-Creation',
    'User-Update',
];

const handleKafkaMessage = async (topic, event) => {
    try {
        switch (topic) {
            case 'Assessment-Creation':
                await notificationService.sendPushNotification(event);
                break;
            case 'Submission-Completed':
                await notificationService.sendEmailNotification(event);
                break;
            case 'Course-Creation':
                await notificationService.sendCourseCreationNotification(event);
                break;
            case 'Course-Update':
                await notificationService.sendCourseUpdateNotification(event);
                break;
            case 'Course-Deletion':
                await notificationService.sendCourseDeletionNotification(event);
                break;
            case 'Module-Creation':
                await notificationService.sendModuleCreationNotification(event);
                break;
            case 'Module-Update':
                await notificationService.sendModuleUpdateNotification(event);
                break;
            case 'Module-Deletion':
                await notificationService.sendModuleDeletionNotification(event);
                break;
            case 'User-Creation':
                await notificationService.sendUserCreationNotification(event);
                break;
            case 'User-Update':
                await notificationService.sendUserUpdateNotification(event);
                break;
            default:
                console.warn(`Unhandled topic: ${topic}`);
                break;
        }
    } catch (error) {
        console.error('Error processing Kafka message:', {
            topic,
            error: error.message,
            timestamp: new Date().toISOString(),
        });

        await Notification.create({
            userId: event.userId,
            type: topic,
            message: JSON.stringify(event),
            status: 'failed',
            error: error.message,
            retryCount: 0,
            lastRetryAt: new Date(),
        });
    }
};

let isShuttingDown = false;

const gracefulShutdown = async () => {
    try {
        isShuttingDown = true;
        console.log('Shutting down Kafka consumer...');
        await consumer.disconnect();
        console.log('Kafka consumer disconnected successfully');
    } catch (error) {
        console.error('Error during Kafka consumer shutdown:', error);
    }
};

exports.start = async () => {
    try {
        const operation = retry.operation({
            retries: 5,
            factor: 2,
            minTimeout: 1000,
            maxTimeout: 60000,
        });

        operation.attempt(async (currentAttempt) => {
            try {
                await consumer.connect();
                console.log('Connected to DigitalOcean Kafka with SSL');

                // Subscribe to all topics
                for (const topic of TOPICS) {
                    await consumer.subscribe({
                        topic,
                        fromBeginning: false, // Change to true if you want to process all historical messages
                    });
                    console.log(`Subscribed to topic: ${topic}`);
                }

                await consumer.run({
                    autoCommit: true,
                    autoCommitInterval: 5000,
                    autoCommitThreshold: 100,
                    eachMessage: async ({ topic, partition, message }) => {
                        if (isShuttingDown) return;

                        try {
                            console.log(
                                `Processing message from topic: ${topic}`,
                                {
                                    partition,
                                    offset: message.offset,
                                    timestamp: message.timestamp,
                                }
                            );

                            const event = JSON.parse(message.value.toString());
                            await handleKafkaMessage(topic, event);
                        } catch (error) {
                            console.error('Kafka message processing error:', {
                                topic,
                                partition,
                                offset: message.offset,
                                error: error.message,
                                timestamp: new Date().toISOString(),
                            });
                        }
                    },
                });

                // Setup graceful shutdown
                process.on('SIGTERM', gracefulShutdown);
                process.on('SIGINT', gracefulShutdown);
            } catch (error) {
                console.error(
                    `Failed to connect to Kafka (attempt ${currentAttempt}):`,
                    {
                        error: error.message,
                        stack: error.stack,
                        timestamp: new Date().toISOString(),
                    }
                );

                if (error.message.includes('SSL')) {
                    console.error('SSL Connection Error:', error.message);
                }

                if (operation.retry(error)) {
                    return;
                }
                throw error;
            }
        });
    } catch (error) {
        console.error('Fatal error starting Kafka consumer:', error);
        process.exit(1);
    }
};

exports.isConnected = async () => {
    try {
        const admin = kafka.admin();
        await admin.connect();
        await admin.listTopics();
        await admin.disconnect();
        return true;
    } catch (error) {
        console.error('Kafka connection check failed:', error);
        return false;
    }
};
