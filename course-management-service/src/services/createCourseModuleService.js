const Course = require('../models/course');
const axios = require('axios');
const kafka = require('../utils/kafka');

module.exports = async (courseId, moduleData, instructorId) => {
    // Validate instructor
    try {
        const userResponse = await axios.get(
            `${process.env.USER_MANAGEMENT_SERVICE_URL}/validate`,
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
