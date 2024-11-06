const Redis = require('redis');
const RedisStore = require('rate-limit-redis');

const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
};

const redisClient = Redis.createClient(redisConfig);

redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
    console.log('Connected to Redis');
});

module.exports = {
    redisClient,
    RedisStore,
    redisConfig,
};
