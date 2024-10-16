// src/models/assignmentModel.js
const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
    title: String,
    description: String,
    dueDate: Date,
    courseId: String,
});

const Assignment = mongoose.model('Assignment', assignmentSchema);

module.exports = { Assignment };
