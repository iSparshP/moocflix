// course-management-service/src/services/createCourseService.js
const Course = require('../models/course');
const axios = require('axios');
const kafka = require('../utils/kafka');
const config = require('../../config/config');

module.exports = async (courseData, instructorId) => {
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

    // Create course
    const course = new Course({ ...courseData, instructor: instructorId });
    await course.save();

    // Send Kafka message
    kafka.sendMessage('Course-Creation', { courseId: course._id, courseData });

    return course;
};
