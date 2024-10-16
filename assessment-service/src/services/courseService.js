// src/services/courseService.js
const axios = require('axios');

exports.validateCourseId = async (courseId) => {
    try {
        const response = await axios.get(
            `http://course-management-service/api/v1/courses/${courseId}`
        );
        return response.status === 200;
    } catch (error) {
        return false;
    }
};
