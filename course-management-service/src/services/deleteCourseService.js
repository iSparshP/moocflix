const Course = require('../models/course');
const axios = require('axios');
const kafka = require('../utils/kafka');
const config = require('../../config/config');

module.exports = async (courseId, instructorId) => {
    // Validate instructor
    const userResponse = await axios.get(
        `${config.userManagementServiceURL}/validate`,
        {
            headers: { Authorization: `Bearer ${instructorId}` },
        }
    );

    if (!userResponse.data.valid || userResponse.data.role !== 'instructor') {
        throw new Error('Unauthorized');
    }

    // Find and delete course
    const course = await Course.findOneAndDelete({
        _id: courseId,
        instructor: instructorId,
    });

    if (!course) {
        throw new Error('Course not found or unauthorized');
    }

    // Send Kafka message
    kafka.sendMessage('Course-Deletion', { courseId: course._id });

    return course;
};
