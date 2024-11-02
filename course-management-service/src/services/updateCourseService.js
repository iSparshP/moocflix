const Course = require('../models/course');
const axios = require('axios');
const kafka = require('../utils/kafka');
const config = require('../../config/config');
const logger = require('../utils/logger');

module.exports = async (courseId, courseData, instructorId) => {
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
            logger.error('Unauthorized course update attempt:', {
                courseId,
                instructorId,
            });
            throw new Error('Unauthorized');
        }

        // Find and update course
        const course = await Course.findOneAndUpdate(
            { _id: courseId, instructor: instructorId },
            { ...courseData, updatedAt: new Date() },
            { new: true }
        );

        if (!course) {
            logger.error('Course not found or unauthorized:', {
                courseId,
                instructorId,
            });
            throw new Error('Course not found or unauthorized');
        }

        // Send Kafka message
        await kafka.sendMessage('Course-Update', {
            courseId: course._id,
            courseData,
            updatedBy: instructorId,
            updatedAt: new Date(),
        });

        logger.info('Course updated successfully', {
            courseId: course._id,
            updatedBy: instructorId,
            timestamp: new Date(),
        });

        return course;
    } catch (error) {
        logger.error('Error updating course:', {
            courseId,
            instructorId,
            error: error.message,
            stack: error.stack,
        });
        throw error;
    }
};
