const Course = require('../models/course');
const axios = require('axios');
const kafka = require('../utils/kafka');
const config = require('../../config/config');

module.exports = async (courseId, courseData, instructorId) => {
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

    // Find and update course
    const course = await Course.findOneAndUpdate(
        { _id: courseId, instructor: instructorId },
        courseData,
        { new: true }
    );

    if (!course) {
        throw new Error('Course not found or unauthorized');
    }

    // Send Kafka message
    kafka.sendMessage('Course-Update', { courseId: course._id, courseData });

    return course;
};
