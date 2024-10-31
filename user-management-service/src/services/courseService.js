// src/services/courseService.js
const axios = require('axios');
const logger = require('../utils/logger');

class CourseService {
    constructor() {
        this.baseURL = process.env.COURSE_SERVICE_URL;
        this.axios = axios.create({
            baseURL: this.baseURL,
            timeout: 5000,
        });
    }

    async initializeEnrollment(userId) {
        try {
            const response = await this.axios.post('/enrollments/initialize', {
                userId,
                timestamp: new Date().toISOString(),
                status: 'pending',
            });
            logger.info('Enrollment initialized successfully', { userId });
            return response.data;
        } catch (error) {
            logger.error('Failed to initialize enrollment', {
                userId,
                error: error.message,
            });
            throw new Error(
                `Failed to initialize enrollment: ${error.message}`
            );
        }
    }

    async getEnrollmentStatus(userId) {
        try {
            const response = await this.axios.get(
                `/enrollments/${userId}/status`
            );
            logger.info('Enrollment status retrieved', { userId });
            return response.data;
        } catch (error) {
            logger.error('Failed to get enrollment status', {
                userId,
                error: error.message,
            });
            throw new Error(
                `Failed to get enrollment status: ${error.message}`
            );
        }
    }
}

module.exports = new CourseService();
