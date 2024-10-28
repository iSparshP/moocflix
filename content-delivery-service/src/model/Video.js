// src/models/Video.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Video = sequelize.define('Video', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    url: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    // Add other fields as necessary
});

module.exports = Video;
