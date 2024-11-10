// src/models/assignmentModel.js
const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        dueDate: {
            type: Date,
            required: true,
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
        maxPoints: {
            type: Number,
            required: true,
            min: [0, 'Maximum points cannot be negative'],
        },
        status: {
            type: String,
            enum: ['draft', 'published', 'closed'],
            default: 'draft',
        },
        attachments: [
            {
                name: String,
                url: String,
                type: String,
            },
        ],
        submissionType: {
            type: String,
            enum: ['file', 'url', 'text'],
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
assignmentSchema.index({ courseId: 1, dueDate: 1 });
assignmentSchema.index({ courseId: 1, status: 1 });

const Assignment = mongoose.model('Assignment', assignmentSchema);

module.exports = { Assignment };
