const { Kafka } = require('kafkajs');
const notificationService = require('../services/notificationService');
const kafkaConfig = require('../../config/kafkaConfig');

const kafka = new Kafka(kafkaConfig);
const consumer = kafka.consumer({ groupId: 'notification-service' });

exports.start = async () => {
    await consumer.connect();
    await consumer.subscribe({
        topic: 'Assessment-Creation',
        fromBeginning: true,
    });
    await consumer.subscribe({
        topic: 'Submission-Completed',
        fromBeginning: true,
    });
    await consumer.subscribe({
        topic: 'Course-Creation',
        fromBeginning: true,
    });
    await consumer.subscribe({
        topic: 'Course-Update',
        fromBeginning: true,
    });
    await consumer.subscribe({
        topic: 'Course-Deletion',
        fromBeginning: true,
    });
    await consumer.subscribe({
        topic: 'Module-Creation',
        fromBeginning: true,
    });
    await consumer.subscribe({
        topic: 'Module-Update',
        fromBeginning: true,
    });
    await consumer.subscribe({
        topic: 'Module-Deletion',
        fromBeginning: true,
    });
    await consumer.subscribe({
        topic: 'User-Creation',
        fromBeginning: true,
    });
    await consumer.subscribe({
        topic: 'User-Update',
        fromBeginning: true,
    });
    // Subscribe to other topics...

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const event = JSON.parse(message.value.toString());
            switch (topic) {
                case 'Assessment-Creation':
                    await notificationService.sendPushNotification(event);
                    break;
                case 'Submission-Completed':
                    await notificationService.sendEmailNotification(event);
                    break;
                case 'Course-Creation':
                    await notificationService.sendCourseCreationNotification(
                        event
                    );
                    break;
                case 'Course-Update':
                    await notificationService.sendCourseUpdateNotification(
                        event
                    );
                    break;
                case 'Course-Deletion':
                    await notificationService.sendCourseDeletionNotification(
                        event
                    );
                    break;
                case 'Module-Creation':
                    await notificationService.sendModuleCreationNotification(
                        event
                    );
                    break;
                case 'Module-Update':
                    await notificationService.sendModuleUpdateNotification(
                        event
                    );
                    break;
                case 'Module-Deletion':
                    await notificationService.sendModuleDeletionNotification(
                        event
                    );
                    break;
                case 'User-Creation':
                    await notificationService.sendUserCreationNotification(
                        event
                    );
                    break;
                case 'User-Update':
                    await notificationService.sendUserUpdateNotification(event);
                    break;
                // Handle other topics...
            }
        },
    });
};
