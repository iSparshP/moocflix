const { sendMessage, consumeMessages } = require('../utils/kafka');
const CourseService = require('./courseService');

const handleIncomingMessage = async (topic, message) => {
    switch (topic) {
        case 'User-Creation':
            // Handle user creation logic
            break;
        case 'User-Update':
            // Handle user update logic
            break;
        case 'Assessment-Creation':
            // Handle assessment creation logic
            break;
        case 'Submission-Completed':
            // Handle submission completed logic
            break;
        case 'Grading-Completed':
            // Handle grading completed logic
            break;
        case 'Transcoding-Completed':
            // Handle transcoding completed logic
            break;
        default:
            console.log(`Unhandled topic: ${topic}`);
    }
};

const initializeKafkaConsumer = () => {
    consumeMessages(
        [
            'User-Creation',
            'User-Update',
            'Assessment-Creation',
            'Submission-Completed',
            'Grading-Completed',
            'Transcoding-Completed',
        ],
        handleIncomingMessage
    );
};

const sendCourseCreatedEvent = async (courseId, courseData) => {
    await sendMessage('Course-Creation', { courseId, courseData });
};

const sendStudentEnrolledEvent = async (courseId, studentId) => {
    await sendMessage('Student-Enrolled', { courseId, studentId });
};

const sendModuleUpdatedEvent = async (courseId, moduleId, moduleData) => {
    await sendMessage('Module-Updated', { courseId, moduleId, moduleData });
};

const sendModuleDeletedEvent = async (courseId, moduleId) => {
    await sendMessage('Module-Deleted', { courseId, moduleId });
};

module.exports = {
    initializeKafkaConsumer,
    sendCourseCreatedEvent,
    sendStudentEnrolledEvent,
    sendModuleUpdatedEvent,
    sendModuleDeletedEvent,
};
