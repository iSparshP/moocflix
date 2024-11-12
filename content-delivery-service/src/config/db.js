const { Sequelize } = require('sequelize');
const Redis = require('ioredis');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// Helper to read cert files
const readCertFile = (filename) => {
    try {
        return fs.readFileSync(
            path.join(__dirname, '../certs', filename),
            'utf-8'
        );
    } catch (error) {
        console.warn(
            `Warning: Could not read certificate file ${filename}:`,
            error.message
        );
        return null;
    }
};

// Database configuration
const dbConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '25060'),
    ssl: {
        rejectUnauthorized: true,
        ca: readCertFile('pgdb.crt'),
    },
};

class DatabaseManager {
    constructor() {
        this.sequelize = new Sequelize(
            dbConfig.database,
            dbConfig.user,
            dbConfig.password,
            {
                host: dbConfig.host,
                port: dbConfig.port,
                dialect: 'postgres',
                dialectOptions: {
                    ssl: dbConfig.ssl,
                },
                pool: {
                    max: 5,
                    min: 0,
                    acquire: 30000,
                    idle: 10000,
                },
                logging: false,
            }
        );

        this.redisClient = new Redis(process.env.REDIS_URL, {
            tls: {
                rejectUnauthorized: false,
            },
        });
    }

    async initialize() {
        try {
            await this.sequelize.authenticate();
            logger.info('Database connection established successfully');

            // Test Redis connection
            await this.redisClient.ping();
            logger.info('Redis connection established successfully');
        } catch (error) {
            logger.error('Unable to connect to databases:', error);
            throw error;
        }
    }

    async close() {
        try {
            await this.sequelize.close();
            await this.redisClient.quit();
            logger.info('Database connections closed');
        } catch (error) {
            logger.error('Error closing database connections:', error);
            throw error;
        }
    }
}

// Export a singleton instance
const dbManager = new DatabaseManager();
module.exports = {
    dbManager,
    sequelize: dbManager.sequelize,
    redisClient: dbManager.redisClient,
};
