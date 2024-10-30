const { sendMessage, consumeMessages } = require('../utils/kafka');
const assessmentHandler = require('../handlers/assessmentHandler');
const gradingHandler = require('../handlers/gradingHandler');
const submissionHandler = require('../handlers/submissionHandler');
const userHandler = require('../handlers/userHandler');
const moduleHandler = require('../handlers/moduleHandler');

const handleIncomingMessage = async (topic, message) => {
    try {
        switch (topic) {
            case 'User-Creation':
                await userHandler.handleUserCreation(message);
                break;
            case 'User-Update':
                await userHandler.handleUserUpdate(message);
                break;
            case 'Assessment-Creation':
                await assessmentHandler.handleAssessmentCreation(message);
                break;
            case 'Submission-Completed':
                await submissionHandler.handleSubmissionCompleted(message);
                break;
            case 'Grading-Completed':
                await gradingHandler.handleGradingCompleted(message);
                break;
            case 'Transcoding-Completed':
                await moduleHandler.handleTranscodingCompleted(message);
                break;
            default:
                console.log(`Unhandled topic: ${topic}`);
        }
    } catch (error) {
        console.error(
            `Error handling kafka message for topic ${topic}:`,
            error
        );
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

const sendCourseUpdatedEvent = async (courseId, courseData) => {
    await sendMessage('Course-Update', { courseId, courseData });
};

const sendCourseDeletedEvent = async (courseId) => {
    await sendMessage('Course-Deletion', { courseId });
};

const sendModuleCreatedEvent = async (courseId, moduleData) => {
    await sendMessage('Module-Creation', { courseId, moduleData });
};

const sendModuleUpdatedEvent = async (courseId, moduleId, moduleData) => {
    await sendMessage('Module-Update', { courseId, moduleId, moduleData });
};

const sendModuleDeletedEvent = async (courseId, moduleId) => {
    await sendMessage('Module-Deletion', { courseId, moduleId });
};

module.exports = {
    initializeKafkaConsumer,
    sendCourseCreatedEvent,
    sendCourseUpdatedEvent,
    sendCourseDeletedEvent,
    sendModuleCreatedEvent,
    sendModuleUpdatedEvent,
    sendModuleDeletedEvent,
};
