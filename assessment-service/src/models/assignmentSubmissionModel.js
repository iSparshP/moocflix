// src/models/assignmentSubmissionModel.js
const mongoose = require('mongoose');

const assignmentSubmissionSchema = new mongoose.Schema({
    assignmentId: String,
    studentId: String,
    submissionUrl: String,
    submittedAt: { type: Date, default: Date.now },
    grade: Number,
});

const AssignmentSubmission = mongoose.model(
    'AssignmentSubmission',
    assignmentSubmissionSchema
);

module.exports = { AssignmentSubmission };
