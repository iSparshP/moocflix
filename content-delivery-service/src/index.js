// src/index.js
require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const contentRoutes = require('./routes/contentRoutes.js');
const { sequelize, redisClient } = require('./config/db');
const { initializeKafkaConsumer } = require('./services/kafkaHandler');

const initializeApp = async () => {
    try {
        // Connect to Redis
        await redisClient.connect();

        // Sync database
        await sequelize.sync({ force: false });

        // Initialize Kafka consumer
        await initializeKafkaConsumer();

        // Setup Express middleware
        app.use(express.json());
        app.use('/api/v1/content', contentRoutes);

        // Start server
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    } catch (error) {
        console.error('Failed to initialize application:', error);
        process.exit(1);
    }
};

// Global error handler
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

initializeApp();
