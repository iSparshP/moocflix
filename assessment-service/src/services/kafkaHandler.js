const { sendMessage, consumeMessages } = require('../utils/kafka');
const AssessmentService = require('./assessmentService');

const handleIncomingMessage = async (topic, message) => {
    switch (topic) {
        case 'User-Creation':
            // Handle user creation logic
            break;
        case 'User-Update':
            // Handle user update logic
            break;
        case 'Course-Creation':
            // Handle course creation logic
            break;
        case 'Course-Update':
            // Handle course update logic
            break;
        case 'Course-Deletion':
            // Handle course deletion logic
            break;
        case 'Student-Enrolled':
            // Handle student enrollment logic
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
            'Course-Creation',
            'Course-Update',
            'Course-Deletion',
            'Student-Enrolled',
            'Transcoding-Completed',
        ],
        handleIncomingMessage
    );
};

const sendAssessmentCreatedEvent = async (assessmentId, assessmentData) => {
    await sendMessage('Assessment-Creation', { assessmentId, assessmentData });
};

const sendSubmissionCompletedEvent = async (
    submissionId,
    studentId,
    assessmentId
) => {
    await sendMessage('Submission-Completed', {
        submissionId,
        studentId,
        assessmentId,
    });
};

const sendGradingCompletedEvent = async (submissionId, grade) => {
    await sendMessage('Grading-Completed', { submissionId, grade });
};

module.exports = {
    initializeKafkaConsumer,
    sendAssessmentCreatedEvent,
    sendSubmissionCompletedEvent,
    sendGradingCompletedEvent,
};
