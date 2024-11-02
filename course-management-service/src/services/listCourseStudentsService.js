const Course = require('../models/course');
const logger = require('../utils/logger');

module.exports = async (courseId) => {
    try {
        const course = await Course.findById(courseId)
            .select('students')
            .populate('students', 'name email'); // Populate basic student info

        if (!course) {
            logger.error('Course not found when listing students:', {
                courseId,
                timestamp: new Date(),
            });
            throw new Error('Course not found');
        }

        logger.info('Successfully retrieved course students', {
            courseId,
            studentCount: course.students.length,
        });

        return course.students;
    } catch (error) {
        logger.error('Error retrieving course students:', {
            courseId,
            error: error.message,
            stack: error.stack,
        });
        throw error;
    }
};
