// src/models/Video.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Video = sequelize.define('Video', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    filename: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    s3_url: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    transcoded_url: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    course_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('pending', 'transcoding', 'completed', 'failed'),
        defaultValue: 'pending',
    },
});

module.exports = Video;
