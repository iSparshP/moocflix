const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
    title: String,
    content: String,
    // Add other fields as necessary
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
    ], // Array of student IDs
    // Add other fields as necessary
});

const Course = mongoose.model('Course', courseSchema);
module.exports = Course;
