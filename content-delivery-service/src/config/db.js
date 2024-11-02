const redis = require('redis');
const { Sequelize } = require('sequelize');
const config = require('./config');
const logger = require('../utils/logger');

class DatabaseManager {
    constructor() {
        this.sequelize = null;
        this.redisClient = null;
    }

    async initialize() {
        try {
            // Initialize Sequelize
            this.sequelize = new Sequelize(config.db.url, config.db.options);
            await this.sequelize.authenticate();
            logger.info('PostgreSQL connection established');

            // Initialize Redis
            this.redisClient = redis.createClient({
                url: config.redis.url,
            });

            this.redisClient.on('error', (err) => {
                logger.error('Redis error:', err);
            });

            await this.redisClient.connect();
            logger.info('Redis connection established');
        } catch (error) {
            logger.error('Failed to initialize database connections:', error);
            throw error;
        }
    }

    async close() {
        try {
            await this.sequelize?.close();
            await this.redisClient?.quit();
            logger.info('Database connections closed');
        } catch (error) {
            logger.error('Error closing database connections:', error);
            throw error;
        }
    }
}

const dbManager = new DatabaseManager();
module.exports = dbManager;
