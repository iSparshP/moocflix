const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
    assessmentId: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
    submissions: [
        {
            studentId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },
            submittedAt: Date,
            status: String,
            attemptCount: {
                type: Number,
                default: 1,
            },
            metadata: Object,
        },
    ],
    grades: [
        {
            studentId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },
            score: {
                type: Number,
                min: 0,
                max: 100,
            },
            feedback: String,
            gradedAt: Date,
            gradedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            attempts: {
                type: Number,
                default: 1,
            },
            updatedAt: Date,
        },
    ],
});

const moduleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    videoUrl: String,
    videoMetadata: {
        duration: Number,
        format: String,
        quality: String,
        size: Number,
        updatedAt: Date,
    },
    transcodingStatus: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending',
    },
    assessments: [assessmentSchema],
});

const videoSchema = new mongoose.Schema({
    title: String,
    url: String,
    // Add other fields as necessary
});

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    modules: [moduleSchema],
    videos: [videoSchema], // Array of video objects
    students: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
    isPublished: {
        type: Boolean,
        default: false,
    },
    level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
    },
    topics: [String],
    rating: {
        type: Number,
        min: 0,
        max: 5,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

const Course = mongoose.model('Course', courseSchema);
module.exports = Course;
