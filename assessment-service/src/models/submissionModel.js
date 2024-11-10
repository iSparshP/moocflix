// src/models/submissionModel.js
const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
    {
        courseId: {
            type: String,
            required: true,
            index: true,
        },
        quizId: {
            type: String,
            required: true,
            index: true,
        },
        studentId: {
            type: String,
            required: true,
            index: true,
        },
        answers: [
            {
                questionId: {
                    type: String,
                    required: true,
                },
                answer: {
                    type: String,
                    required: true,
                },
                isCorrect: Boolean,
                points: {
                    type: Number,
                    min: 0,
                },
            },
        ],
        grade: {
            type: Number,
            min: 0,
            max: 100,
        },
        status: {
            type: String,
            enum: ['submitted', 'graded', 'pending_review'],
            default: 'submitted',
        },
        submittedAt: {
            type: Date,
            default: Date.now,
        },
        gradedAt: Date,
        gradedBy: String,
        feedback: String,
        totalPoints: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for common queries
submissionSchema.index(
    { courseId: 1, quizId: 1, studentId: 1 },
    { unique: true }
);
submissionSchema.index({ studentId: 1, submittedAt: -1 });

// Calculate total points
submissionSchema.pre('save', function (next) {
    if (this.answers) {
        this.totalPoints = this.answers.reduce(
            (sum, answer) => sum + (answer.points || 0),
            0
        );
    }
    next();
});

const Submission = mongoose.model('Submission', submissionSchema);

module.exports = { Submission };
