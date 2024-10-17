const Course = require('../models/course');
const axios = require('axios');
const kafka = require('../utils/kafka');

module.exports = async (courseId, moduleId, instructorId) => {
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

    // Find course and delete module
    const course = await Course.findById(courseId);
    if (!course) {
        throw new Error('Course not found');
    }

    const module = course.modules.id(moduleId);
    if (!module) {
        throw new Error('Module not found');
    }

    module.remove();
    await course.save();

    // Send Kafka message
    kafka.sendMessage('Module-Deletion', { courseId: course._id, moduleId });

    return;
};
