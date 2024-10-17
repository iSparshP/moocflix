const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
    title: String,
    content: String,
    // Add other fields as necessary
});

const courseSchema = new mongoose.Schema({
    name: String,
    description: String,
    instructor: String,
    modules: [moduleSchema],
    students: [String], // Array of student IDs
    // Add other fields as necessary
});

module.exports = mongoose.model('Course', courseSchema);
