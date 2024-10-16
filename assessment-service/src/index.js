// src/index.js
const express = require('express');
const mongoose = require('mongoose');
const quizRoutes = require('./routes/quizRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
require('dotenv').config();

const app = express();
app.use(express.json());

app.use(quizRoutes);
app.use(assignmentRoutes);

mongoose.connect(process.env.MONGODB_URI);

const db = mongoose.connection;
db.on('error', (error) => {
    console.error('Error connecting to MongoDB:', error);
});
db.once('open', () => {
    console.log('Connected to MongoDB');
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
