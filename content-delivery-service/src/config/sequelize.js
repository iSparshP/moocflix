// src/config/sequelize.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false, // Disable logging; default: console.log
});

module.exports = sequelize;
