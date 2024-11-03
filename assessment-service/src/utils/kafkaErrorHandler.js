const { send } = require('../config/kafka');
const logger = require('../config/logger');

const wrapKafkaHandler = (handler) => async (message) => {
    try {
        await handler(message);
    } catch (error) {
        logger.error('Kafka message handling error:', {
            error: error.message,
            message,
        });

        await send({
            topic: 'assessment-dlq',
            messages: [
                {
                    value: JSON.stringify({
                        originalMessage: message,
                        error: error.message,
                        timestamp: new Date().toISOString(),
                    }),
                },
            ],
        });
    }
};

module.exports = { wrapKafkaHandler };
