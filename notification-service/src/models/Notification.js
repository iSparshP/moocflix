const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/dbConfig');

const Notification = sequelize.define(
    'Notification',
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.STRING,
            allowNull: false,
            index: true,
        },
        type: {
            type: DataTypes.ENUM,
            values: ['EMAIL', 'PUSH', 'SMS'],
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM,
            values: ['PENDING', 'SENT', 'FAILED'],
            defaultValue: 'PENDING',
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        metadata: {
            type: DataTypes.JSONB,
            defaultValue: {},
        },
        retryCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        lastRetryAt: {
            type: DataTypes.DATE,
        },
        error: {
            type: DataTypes.TEXT,
        },
    },
    {
        timestamps: true,
        indexes: [
            {
                fields: ['userId', 'status', 'createdAt'],
                name: 'notifications_user_status_date',
            },
            {
                fields: ['type', 'status', 'createdAt'],
                name: 'notifications_type_status_date',
            },
        ],
    }
);

// Add FCM token management
const DeviceToken = sequelize.define('DeviceToken', {
    userId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    platform: {
        type: DataTypes.ENUM('ios', 'android', 'web'),
        allowNull: false,
    },
});

module.exports = Notification;
