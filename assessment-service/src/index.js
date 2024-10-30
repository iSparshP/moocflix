// src/index.js
const { initializeKafkaConsumer } = require('./services/kafkaHandler');
const express = require('express');
const connectDB = require('../config/mongodb');
const quizRoutes = require('./routes/quizRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const errorHandler = require('./middlewares/errorHandler');
const authenticate = require('./middlewares/authenticate');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
require('dotenv').config();

const app = express();
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(express.json());
app.use(authenticate);
app.use(quizRoutes);
app.use(assignmentRoutes);
app.use(errorHandler);

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'up',
        timestamp: new Date().toISOString(),
    });
});

connectDB();
app.listen(3000, () => console.log('Server is running on port 3000'));

// Initialize Kafka consumer
initializeKafkaConsumer();
