const logger = require('./logger');

const handleKafkaError = (error) => {
    logger.error('Kafka error occurred', {
        error: error.message,
        type: error.type,
        broker: error.broker,
    });

    switch (error.type) {
        case 'AUTHENTICATION_FAILURE':
            logger.error('Kafka authentication failed. Check credentials.');
            break;
        case 'CONNECTION_ERROR':
            logger.error('Failed to connect to Kafka broker.');
            break;
        case 'REQUEST_TIMEOUT':
            logger.error('Kafka request timed out.');
            break;
        default:
            logger.error('Unknown Kafka error occurred.');
    }
};

module.exports = handleKafkaError;
