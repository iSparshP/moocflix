// src/services/notificationService.js
const BaseService = require('./baseService');
const { kafka } = require('../config/kafka');
const { logger } = require('../config/logger');

class NotificationService extends BaseService {
    static async sendKafkaMessage(topic, message) {
        return await this.handleServiceCall(async () => {
            const producer = kafka.producer();
            await producer.connect();
            await producer.send({
                topic,
                messages: [{ value: JSON.stringify(message) }],
            });
            await producer.disconnect();
            logger.info('Kafka message sent', { topic, ...message });
        }, `Failed to send message to topic: ${topic}`);
    }

    static async notifyStudents(courseId, assessmentId, type) {
        return await this.sendKafkaMessage('Assessment-Creation', {
            courseId,
            assessmentId,
            type,
        });
    }

    static async notifySubmissionCompleted(
        courseId,
        assessmentId,
        submissionId,
        type
    ) {
        return await this.sendKafkaMessage('Submission-Completed', {
            courseId,
            assessmentId,
            submissionId,
            type,
        });
    }

    static async notifyGradingCompleted(quizId, submissionId) {
        return await this.sendKafkaMessage('Grading-Completed', {
            quizId,
            submissionId,
        });
    }

    static async notifyAssignmentSubmissionCompleted(
        courseId,
        assignmentId,
        submissionId
    ) {
        return await this.sendKafkaMessage('Assignment-Submitted', {
            courseId,
            assignmentId,
            submissionId,
        });
    }

    static async notifyAssignmentGradingCompleted(assignmentId, submissionId) {
        return await this.sendKafkaMessage('Grading-Completed', {
            assignmentId,
            submissionId,
        });
    }
}

module.exports = NotificationService;
