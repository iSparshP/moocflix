const express = require('express');
const mongoose = require('mongoose');
const { kafka } = require('../../config/kafka');
const router = express.Router();

const checkKafkaConnection = async () => {
    try {
        const admin = kafka.admin();
        await admin.connect();
        await admin.disconnect();
        return true;
    } catch (error) {
        return false;
    }
};

router.get('/health', async (req, res) => {
    const status = {
        app: 'up',
        mongo: mongoose.connection.readyState === 1,
        kafka: await checkKafkaConnection(),
    };
    res.json(status);
});

module.exports = router;
