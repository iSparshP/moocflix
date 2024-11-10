// src/services/courseService.js
const axios = require('axios');
const { ServiceError, NotFoundError } = require('../utils/errors');
const { logger } = require('../config/logger');
const BaseService = require('./baseService');

class CourseService extends BaseService {
    static async validateCourseId(courseId) {
        return await this.handleServiceCall(async () => {
            try {
                const response = await axios.get(
                    `${process.env.COURSE_SERVICE_URL}/api/v1/courses/${courseId}`,
                    { timeout: 5000 }
                );
                return response.status === 200;
            } catch (error) {
                if (error.response?.status === 404) {
                    throw new NotFoundError('Course not found');
                }
                throw new ServiceError(
                    'Course',
                    error.response?.data?.message || 'Failed to validate course'
                );
            }
        }, 'Failed to validate course');
    }
}

module.exports = CourseService;
