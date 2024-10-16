// src/services/notificationService.js
const kafka = require('../../configure/kafka.js');

exports.notifyStudents = async (courseId, quizId) => {
    const message = {
        topic: 'Assessment-Creation',
        messages: [{ value: JSON.stringify({ courseId, quizId }) }],
    };
    await kafka.send(message);
};
