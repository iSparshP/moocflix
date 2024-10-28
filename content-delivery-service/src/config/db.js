const redis = require('redis');
const sequelize = require('./sequelize');

// Redis connection setup
const redisClient = redis.createClient({
    url: process.env.REDIS_URL,
});

redisClient.on('connect', () => {
    console.log('Connected to the Redis database');
});

redisClient.on('error', (err) => {
    console.error('Redis error', err);
});

redisClient.on('end', () => {
    console.log('Redis client disconnected');
});

module.exports = { sequelize, redisClient };
