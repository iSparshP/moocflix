// src/app.js
const express = require('express');
const courseRoutes = require('./routes/courseRoutes');
const healthRoutes = require('./routes/healthRoutes');
const { defaultLimiter } = require('./middlewares/rateLimiter');
const errorMiddleware = require('./middlewares/errorMiddleware');
const rateLimiter = require('./middlewares/rateLimiter');
const logger = require('./utils/logger');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(defaultLimiter);

// Request logging
app.use((req, res, next) => {
    logger.info(`Incoming ${req.method} request to ${req.path}`);
    next();
});

// Routes
app.use('/api/v1/courses', courseRoutes);
app.use('/health', healthRoutes);

// Error handling
app.use(errorMiddleware);

module.exports = app;
