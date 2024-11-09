// src/healthCheck.js
const express = require('express');
const { errorHandler } = require('./middleware/errorHandler');
const healthRoutes = require('./routes/health');

const app = express();
const port = process.env.HEALTH_CHECK_PORT || 3005;

// Middleware
app.use(express.json());

// Routes
app.use('/', healthRoutes);

// Error handling
app.use(errorHandler);

app.listen(port, () => {
    console.log(`Health check service running on port ${port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Performing graceful shutdown...');
    app.close(() => {
        process.exit(0);
    });
});
