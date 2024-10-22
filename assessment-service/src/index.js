// assessment-service/src/index.js
const express = require('express');
const connectDB = require('../configure/mongodb');
const quizRoutes = require('./routes/quizRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const { consumeMessages } = require('./utils/kafka');
const errorHandler = require('./middlewares/errorHandler');
const authenticate = require('./middlewares/authenticate');
require('dotenv').config();

const app = express();
app.use(express.json());

// Use authentication middleware for all routes
app.use(authenticate);

app.use(quizRoutes);
app.use(assignmentRoutes);

// Error handling middleware
app.use(errorHandler);

// Connect to MongoDB
connectDB();

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

const handleMessage = (topic, message) => {
    switch (topic) {
        case 'User-Creation':
            // Handle user creation logic
            break;
        case 'User-Update':
            // Handle user update logic
            break;
        case 'Course-Creation':
            // Handle course creation logic
            break;
        case 'Course-Update':
            // Handle course update logic
            break;
        case 'Course-Deletion':
            // Handle course deletion logic
            break;
        case 'Student-Enrolled':
            // Handle student enrollment logic
            break;
        case 'Transcoding-Completed':
            // Handle transcoding completed logic
            break;
        case 'AssignmentSubmitted':
            // Handle assignment submission completed logic
            // Notify instructor
            break;
        default:
            console.log(`Unhandled topic: ${topic}`);
    }
};

consumeMessages(
    [
        'User-Creation',
        'User-Update',
        'Course-Creation',
        'Course-Update',
        'Course-Deletion',
        'Student-Enrolled',
        'Transcoding-Completed',
        'AssignmentSubmitted',
    ],
    handleMessage
);
