const Course = require('../models/course');
const axios = require('axios');
const kafka = require('../utils/kafka');
const config = require('../../config/config');

module.exports = async (courseId, moduleData, instructorId) => {
    // Validate instructor
    try {
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
            throw new Error('Unauthorized');
        }
    } catch (error) {
        throw new Error('User validation failed');
    }

    // Find course and create module
    const course = await Course.findById(courseId);
    if (!course) {
        throw new Error('Course not found');
    }

    course.modules.push(moduleData);
    await course.save();

    // Send Kafka message
    kafka.sendMessage('Module-Creation', { courseId: course._id, moduleData });

    return course.modules[course.modules.length - 1];
};
