// src/services/enrollmentService.js
const kafka = require('../utils/kafka');
const logger = require('../utils/logger');

class EnrollmentService {
    async publishEnrollmentEvent(studentId, courseId) {
        try {
            await kafka.sendMessage('Student-Enrolled', {
                studentId,
                courseId,
                timestamp: new Date().toISOString(),
                eventType: 'enrollment',
            });

            logger.info(
                `Published enrollment event for student ${studentId} in course ${courseId}`
            );
            return true;
        } catch (error) {
            logger.error('Failed to publish enrollment event:', error);
            throw error;
        }
    }
}

module.exports = new EnrollmentService();
