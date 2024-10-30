const express = require('express');
const connectDB = require('../config/config.js');
const userRoutes = require('./routes/userRoutes.js');
const profileRoutes = require('./routes/profileRoutes.js');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { connectProducer, connectConsumer } = require('../config/kafka');
const { errorHandler } = require('./middlewares/errorHandler');
const winston = require('winston');
const { startConsumer } = require('./services/kafkaConsumer');

const app = express();
connectDB();

// Security middlewares
app.use(helmet());
app.use(cors({ origin: 'https://moocflix.tech' }));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Logging
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
    ],
});
if (process.env.NODE_ENV !== 'production') {
    logger.add(
        new winston.transports.Console({
            format: winston.format.simple(),
        })
    );
}
app.use(
    morgan('combined', {
        stream: { write: (message) => logger.info(message.trim()) },
    })
);

app.use(express.json());

app.use('/api/v1/users', userRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const initializeKafka = async () => {
    try {
        await connectProducer();
        await startConsumer();
        console.log('Kafka producer and consumer initialized');
    } catch (error) {
        console.error('Failed to initialize Kafka:', error);
        process.exit(1);
    }
};

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await initializeKafka();
});
