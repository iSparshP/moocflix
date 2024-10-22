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
                // Handle other topics...
            }
        },
    });
};
