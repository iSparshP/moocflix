// src/index.js
const app = require('./app');
const { kafka } = require('./utils/kafka');
const connectToMongoDB = require('../config/mongodb');
require('dotenv').config();

// Connect to MongoDB
connectToMongoDB();

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
const gracefulShutdown = async () => {
    console.log('Initiating graceful shutdown...');

    try {
        await kafka.producer().disconnect();
        await kafka.consumer().disconnect();
        console.log('Kafka disconnected');
    } catch (err) {
        console.error('Error disconnecting Kafka:', err);
    }

    try {
        await mongoose.connection.close();
        console.log('MongoDB disconnected');
    } catch (err) {
        console.error('Error disconnecting MongoDB:', err);
    }

    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
