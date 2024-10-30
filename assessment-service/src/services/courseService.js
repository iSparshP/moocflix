// src/services/courseService.js
const { ServiceError, NotFoundError } = require('../utils/errors');

exports.validateCourseId = async (courseId) => {
    try {
        const response = await axios.get(
            `${process.env.COURSE_SERVICE_URL}/api/v1/courses/${courseId}`
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
};
