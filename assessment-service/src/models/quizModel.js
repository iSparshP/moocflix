// src/models/quizModel.js
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    questionText: {
        type: String,
        required: true,
        trim: true,
    },
    options: {
        type: [String],
        validate: {
            validator: (v) => Array.isArray(v) && v.length >= 2,
            message: 'At least two options are required',
        },
    },
    correctAnswer: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return this.options.includes(v);
            },
            message: 'Correct answer must be one of the options',
        },
    },
    points: {
        type: Number,
        default: 1,
        min: [0, 'Points cannot be negative'],
    },
});

const quizSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        questions: {
            type: [questionSchema],
            validate: {
                validator: (v) => Array.isArray(v) && v.length > 0,
                message: 'At least one question is required',
            },
        },
        dueDate: {
            type: Date,
            validate: {
                validator: function (v) {
                    return v > new Date();
                },
                message: 'Due date must be in the future',
            },
        },
        courseId: {
            type: String,
            required: true,
            index: true,
        },
        duration: {
            type: Number,
            min: [1, 'Duration must be at least 1 minute'],
        },
        totalPoints: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ['draft', 'published', 'closed'],
            default: 'draft',
        },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    },
    {
        timestamps: true,
    }
);

// Indexes
quizSchema.index({ courseId: 1, dueDate: 1 });
quizSchema.index({ courseId: 1, status: 1 });

// Calculate total points before saving
quizSchema.pre('save', function (next) {
    this.totalPoints = this.questions.reduce((sum, q) => sum + q.points, 0);
    next();
});

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = { Quiz };
