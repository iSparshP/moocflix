const { logger } = require('../config/logger');
const mongoose = require('mongoose');
const { kafka } = require('../config/kafka');

const getBasicHealth = (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
    });
};

const getDetailedHealth = async (req, res) => {
    try {
        // Add your detailed health checks here
        const status = {
            service: 'assessment-service',
            status: 'OK',
            version: process.env.VERSION || '1.0.0',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
        };

        res.status(200).json(status);
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: error.message,
            timestamp: new Date().toISOString(),
        });
    }
};

module.exports = {
    getBasicHealth,
    getDetailedHealth,
};
