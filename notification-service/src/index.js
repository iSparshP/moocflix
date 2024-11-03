require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const notificationRoutes = require('./routes/notificationRoutes');
const kafkaConsumer = require('./subscribers/kafkaConsumer');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middlewares/errorHandler');
const { sequelize } = require('./models/Notification');
const { requestCounter } = require('./middlewares/metrics');
const requestLogger = require('./middlewares/requestLogger');

const app = express();
const port = process.env.PORT || 3000;
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);
app.use(bodyParser.json());
app.use(requestLogger);
app.use((req, res, next) => {
    res.on('finish', () => {
        requestCounter.inc({
            type: req.path,
            status: res.statusCode,
        });
    });
    next();
});
app.use('/api/v1/notifications', notificationRoutes);

// Add error handling middleware last
app.use(errorHandler);

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Application specific logging, throwing an error, or other logic here
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Application specific logging, throwing an error, or other logic here
    process.exit(1);
});

await sequelize.authenticate();
console.log('Database connection established successfully.');

app.listen(port, () => {
    console.log(`Notification service running on port ${port}`);
    kafkaConsumer.start();
});
