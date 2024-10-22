const notificationService = require('../services/notificationService');

exports.sendPushNotification = async (req, res) => {
    try {
        const result = await notificationService.sendPushNotification(req.body);
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

exports.updatePreferences = async (req, res) => {
    try {
        const result = await notificationService.updatePreferences(req.body);
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

exports.sendEmailNotification = async (req, res) => {
    try {
        const result = await notificationService.sendEmailNotification(
            req.body
        );
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

exports.getNotificationHistory = async (req, res) => {
    try {
        const result = await notificationService.getNotificationHistory(
            req.query.userId
        );
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send(error.message);
    }
};
