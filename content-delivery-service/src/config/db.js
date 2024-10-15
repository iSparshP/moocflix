const { Pool } = require('pg');
const redis = require('redis');

// PostgreSQL connection setup
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
    console.log('Connected to the PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
    process.exit(-1);
});

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

module.exports = { pool, redisClient };
