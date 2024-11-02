const Course = require('../models/course');
const logger = require('../utils/logger');

module.exports = async (filters = { isPublished: true }) => {
    try {
        const courses = await Course.find(filters);
        logger.info('Courses retrieved successfully', {
            count: courses.length,
        });
        return courses;
    } catch (error) {
        logger.error('Error retrieving courses:', {
            error: error.message,
        });
        throw error;
    }
};
