// src/services/enrollmentService.js
const kafka = require('../utils/kafka');

exports.publishEnrollmentEvent = async (studentId, courseId) => {
    try {
        await kafka.sendMessage('Student-Enrolled', {
            studentId,
            courseId,
            timestamp: new Date().toISOString(),
            eventType: 'enrollment',
        });
        console.log(
            `Published enrollment event for student ${studentId} in course ${courseId}`
        );
        return true;
    } catch (error) {
        console.error('Failed to publish enrollment event:', error);
        throw error;
    }
};
