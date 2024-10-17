const Course = require('../models/course');
const axios = require('axios');
const kafka = require('../utils/kafka');

module.exports = async (courseId, moduleId, moduleData, instructorId) => {
    // Validate instructor
    const userResponse = await axios.get(
        `${process.env.USER_MANAGEMENT_SERVICE_URL}/validate`,
        {
            headers: { Authorization: `Bearer ${instructorId}` },
        }
    );

    if (!userResponse.data.valid || userResponse.data.role !== 'instructor') {
        throw new Error('Unauthorized');
    }

    // Find course and update module
    const course = await Course.findById(courseId);
    if (!course) {
        throw new Error('Course not found');
    }

    const module = course.modules.id(moduleId);
    if (!module) {
        throw new Error('Module not found');
    }

    Object.assign(module, moduleData);
    await course.save();

    // Send Kafka message
    kafka.sendMessage('Module-Update', {
        courseId: course._id,
        moduleId,
        moduleData,
    });

    return module;
};
