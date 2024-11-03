// src/app.js
const express = require('express');
const courseRoutes = require('./routes/courseRoutes');
const healthRoutes = require('./routes/healthRoutes');

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/api/v1/courses', courseRoutes);
app.use('/', healthRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Uses port from environment variable or 3002
const port = process.env.PORT || 3002;

module.exports = app;
