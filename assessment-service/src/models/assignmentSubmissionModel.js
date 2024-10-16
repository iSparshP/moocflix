// src/models/assignmentSubmissionModel.js
const mongoose = require('mongoose');

const assignmentSubmissionSchema = new mongoose.Schema({
    assignmentId: String,
    studentId: String,
    answers: Array,
    submittedAt: { type: Date, default: Date.now },
});

const AssignmentSubmission = mongoose.model(
    'AssignmentSubmission',
    assignmentSubmissionSchema
);

module.exports = { AssignmentSubmission };
