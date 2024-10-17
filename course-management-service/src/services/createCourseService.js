const Course = require('../models/course');
const axios = require('axios');
const kafka = require('../utils/kafka');

module.exports = async (courseData, instructorId) => {
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

    // Create course
    const course = new Course({ ...courseData, instructor: instructorId });
    await course.save();

    // Send Kafka message
    kafka.sendMessage('Course-Creation', { courseId: course._id, courseData });

    return course;
};
