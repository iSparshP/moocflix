const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const HealthCheck = sequelize.define('HealthCheck', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    service: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('healthy', 'unhealthy'),
        allowNull: false,
    },
    lastChecked: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    details: {
        type: DataTypes.JSONB,
        allowNull: true,
    },
});

module.exports = HealthCheck;
