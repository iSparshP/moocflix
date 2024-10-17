const Course = require('../models/course');
const axios = require('axios');
const kafka = require('../utils/kafka');

module.exports = async (courseId, studentId) => {
    // Validate student
    const userResponse = await axios.get(
        `${process.env.USER_MANAGEMENT_SERVICE_URL}/validate`,
        {
            headers: { Authorization: `Bearer ${studentId}` },
        }
    );

    if (!userResponse.data.valid || userResponse.data.role !== 'student') {
        throw new Error('Unauthorized: Invalid student');
    }

    // Find and enroll student in course
    const course = await Course.findById(courseId);
    if (!course) {
        throw new Error('Course not found');
    }

    if (course.students.includes(studentId)) {
        throw new Error('Student already enrolled');
    }

    course.students.push(studentId);
    await course.save();

    // Send Kafka message
    kafka.sendMessage('Student-Enrolled', { courseId: course._id, studentId });

    return course;
};
