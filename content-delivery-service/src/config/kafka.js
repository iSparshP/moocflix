const initializeKafkaConsumer = async () => {
    try {
        await consumer.connect();
        await consumer.subscribe({
            topics: [
                'Transcoding-Progress',
                'Transcoding-Completed',
                'Transcoding-Failed',
            ],
            fromBeginning: false,
        });

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    const data = JSON.parse(message.value.toString());
                    await handleIncomingMessage(topic, data);
                } catch (error) {
                    logger.error('Failed to process Kafka message:', error);
                }
            },
        });

        logger.info('Kafka consumer initialized successfully');
    } catch (error) {
        logger.error('Failed to initialize Kafka consumer:', error);
        throw error;
    }
};
