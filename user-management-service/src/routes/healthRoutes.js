const express = require('express');
const router = express.Router();
const {
    checkMongoHealth,
    checkRedisHealth,
    checkKafkaHealth,
} = require('../utils/healthChecks');

router.get('/health', async (req, res) => {
    const mongoStatus = await checkMongoHealth();
    const redisStatus = await checkRedisHealth();
    const kafkaStatus = await checkKafkaHealth();

    const isHealthy =
        mongoStatus === 'healthy' &&
        redisStatus === 'healthy' &&
        kafkaStatus === 'healthy';

    res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
            mongodb: mongoStatus,
            redis: redisStatus,
            kafka: kafkaStatus,
        },
    });
});

module.exports = router;
