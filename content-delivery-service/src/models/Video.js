const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

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
    transcoded_urls: {
        type: DataTypes.JSONB,
        allowNull: true,
    },
    course_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    uploaded_by: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('pending', 'transcoding', 'completed', 'failed'),
        defaultValue: 'pending',
    },
    transcoding_job_id: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    transcoding_progress: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    duration: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    error_message: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
    },
    thumbnail_url: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    thumbnail_timestamps: {
        type: DataTypes.ARRAY(DataTypes.FLOAT),
        defaultValue: [],
    },
});

module.exports = Video;
