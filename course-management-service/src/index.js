const express = require('express');
const connectToMongoDB = require('../config/mongodb');
const courseRoutes = require('./routes/courseRoutes');
const config = require('../config/config');
require('dotenv').config();

const app = express();
app.use(express.json());

connectToMongoDB();

app.use('/api/v1/courses', courseRoutes);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
const gracefulShutdown = () => {
    console.log('Shutting down gracefully...');
    server.close(() => {
        console.log('Closed out remaining connections');
        mongoose.connection.close(false, () => {
            console.log('MongoDB connection closed');
            process.exit(0);
        });
    });

    // Force close server after 10 seconds
    setTimeout(() => {
        console.error('Forcing shutdown');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = app;
