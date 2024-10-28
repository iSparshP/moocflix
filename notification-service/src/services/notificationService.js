const Notification = require('../models/Notification');
const smtpConfig = require('../../config/smtpConfig');
const pushNotificationConfig = require('../../config/pushNotificationConfig');
const mailgun = require('mailgun-js')(smtpConfig);
const admin = require('firebase-admin');

admin.initializeApp({
    credential: admin.credential.cert(pushNotificationConfig),
});

exports.sendPushNotification = async (data) => {
    const message = {
        notification: {
            title: data.title,
            body: data.body,
        },
        token: data.token,
    };
    await retry(
        async () => {
            await admin.messaging().send(message);
        },
        {
            retries: 5,
            onRetry: (err, attempt) => {
                console.log(`Retry attempt ${attempt} for push notification`);
            },
        }
    );
    await Notification.create({
        userId: data.userId,
        type: 'push',
        message: data.body,
        status: 'sent',
    });
    return { success: true };
};

exports.updatePreferences = async (data) => {
    // Implement logic to update user preferences
    return { success: true };
};

exports.sendEmailNotification = async (data) => {
    const emailData = {
        from: smtpConfig.sender,
        to: data.email,
        subject: data.subject,
        text: data.body,
    };
    await retry(
        async () => {
            await mailgun.messages().send(emailData);
        },
        {
            retries: 5,
            onRetry: (err, attempt) => {
                console.log(`Retry attempt ${attempt} for email notification`);
            },
        }
    );
    await Notification.create({
        userId: data.userId,
        type: 'email',
        message: data.body,
        status: 'sent',
    });
    return { success: true };
};

exports.getNotificationHistory = async (userId) => {
    const notifications = await Notification.findAll({ where: { userId } });
    return notifications;
};
