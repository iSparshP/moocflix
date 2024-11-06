const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Simple database configuration
const dbConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '25060'),
    ssl: {
        rejectUnauthorized: false,
        ca: fs
            .readFileSync(path.join(__dirname, '../certs/postgresql.crt'))
            .toString(),
    },
};

// Create sequelize instance
const sequelize = new Sequelize(
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
        logging: false,
    }
);

// Simple connection test
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection successful');
        return true;
    } catch (err) {
        console.error('Database connection failed:', err.message);
        return false;
    }
};

module.exports = { sequelize, testConnection };
