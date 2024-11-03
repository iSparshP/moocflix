const { Sequelize, DataTypes } = require('sequelize');
const dbConfig = require('../../config/dbConfig');

const sequelize = new Sequelize(dbConfig.url, dbConfig.options);

const Notification = sequelize.define(
    'Notification',
    {
        userId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        message: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        error: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        retryCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        lastRetryAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = Notification;
