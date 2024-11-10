// src/models/assignmentSubmissionModel.js
const mongoose = require('mongoose');

const assignmentSubmissionSchema = new mongoose.Schema(
    {
        assignmentId: {
            type: String,
            required: true,
            index: true,
        },
        studentId: {
            type: String,
            required: true,
            index: true,
        },
        submissionUrl: {
            type: String,
            validate: {
                validator: function (v) {
                    return this.submissionType === 'url'
                        ? /^https?:\/\/.+/.test(v)
                        : true;
                },
                message: 'Invalid URL format',
            },
        },
        submissionText: {
            type: String,
            validate: {
                validator: function (v) {
                    return this.submissionType === 'text' ? v.length > 0 : true;
                },
                message: 'Submission text cannot be empty',
            },
        },
        submissionType: {
            type: String,
            enum: ['file', 'url', 'text'],
            required: true,
        },
        submittedAt: {
            type: Date,
            default: Date.now,
        },
        grade: {
            type: Number,
            min: 0,
            max: 100,
        },
        status: {
            type: String,
            enum: ['submitted', 'graded', 'late', 'pending_review'],
            default: 'submitted',
        },
        feedback: String,
        gradedAt: Date,
        gradedBy: String,
        attachments: [
            {
                name: String,
                url: String,
                type: String,
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Compound indexes
assignmentSubmissionSchema.index(
    { assignmentId: 1, studentId: 1 },
    { unique: true }
);
assignmentSubmissionSchema.index({ studentId: 1, submittedAt: -1 });

const AssignmentSubmission = mongoose.model(
    'AssignmentSubmission',
    assignmentSubmissionSchema
);

module.exports = { AssignmentSubmission };
