const Course = require('../models/course');
const axios = require('axios');
const kafka = require('../utils/kafka');
const config = require('../../config/config');
const logger = require('../utils/logger');

module.exports = async (courseId, moduleId, moduleData, instructorId) => {
    try {
        // Validate instructor
        const userResponse = await axios.get(
            `${config.userManagementServiceURL}/validate`,
            {
                headers: { Authorization: `Bearer ${instructorId}` },
            }
        );

        if (
            !userResponse.data.valid ||
            userResponse.data.role !== 'instructor'
        ) {
            logger.error('Unauthorized module update attempt:', {
                courseId,
                moduleId,
                instructorId,
            });
            throw new Error('Unauthorized');
        }

        // Find course and update module
        const course = await Course.findById(courseId);
        if (!course) {
            logger.error('Course not found for module update:', { courseId });
            throw new Error('Course not found');
        }

        // Verify instructor ownership
        if (course.instructor.toString() !== instructorId) {
            logger.error('Instructor not authorized for this course:', {
                courseId,
                instructorId,
            });
            throw new Error('Unauthorized: Not course instructor');
        }

        const module = course.modules.id(moduleId);
        if (!module) {
            logger.error('Module not found:', { courseId, moduleId });
            throw new Error('Module not found');
        }

        Object.assign(module, moduleData);
        await course.save();

        // Send Kafka message
        await kafka.sendMessage('Module-Update', {
            courseId: course._id,
            moduleId,
            moduleData,
            updatedAt: new Date(),
        });

        logger.info('Course module updated successfully', {
            courseId,
            moduleId,
            updatedBy: instructorId,
        });

        return module;
    } catch (error) {
        logger.error('Error updating course module:', {
            courseId,
            moduleId,
            error: error.message,
            stack: error.stack,
        });
        throw error;
    }
};
