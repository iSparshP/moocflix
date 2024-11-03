const Notification = require('../models/Notification');
const smtpConfig = require('../../config/smtpConfig');
const pushNotificationConfig = require('../../config/pushNotificationConfig');
const mailgun = require('mailgun-js')(smtpConfig);
const admin = require('firebase-admin');
const retry = require('retry');

admin.initializeApp({
    credential: admin.credential.cert(pushNotificationConfig),
});

class NotificationError extends Error {
    constructor(message, status = 500, details = {}) {
        super(message);
        this.name = 'NotificationError';
        this.status = status;
        this.details = details;
    }
}

const createNotificationRecord = async (
    userId,
    type,
    message,
    status = 'sent',
    error = null
) => {
    return await Notification.create({
        userId,
        type,
        message,
        status,
        error,
        retryCount: 0,
        lastRetryAt: status === 'failed' ? new Date() : null,
    });
};

exports.sendPushNotification = async (data) => {
    try {
        const message = {
            notification: {
                title: data.title,
                body: data.body,
            },
            token: data.token,
        };

        await retry(
            async () => {
                try {
                    await admin.messaging().send(message);
                } catch (error) {
                    if (error.code === 'messaging/invalid-token') {
                        throw new NotificationError(
                            'Invalid device token',
                            400,
                            { token: data.token }
                        );
                    }
                    throw error;
                }
            },
            {
                retries: 5,
                onRetry: (err, attempt) => {
                    console.log(
                        `Retry attempt ${attempt} for push notification`,
                        err
                    );
                },
            }
        );

        await createNotificationRecord(data.userId, 'push', data.body);
        return { success: true };
    } catch (error) {
        throw new NotificationError(
            'Failed to send push notification',
            error.status || 500,
            { originalError: error.message }
        );
    }
};

exports.sendEmailNotification = async (data) => {
    try {
        const emailData = {
            from: smtpConfig.sender,
            to: data.email,
            subject: data.subject,
            text: data.body,
        };

        await retry(
            async () => {
                try {
                    await mailgun.messages().send(emailData);
                } catch (error) {
                    if (error.statusCode === 400) {
                        throw new NotificationError(
                            'Invalid email address',
                            400,
                            { email: data.email }
                        );
                    }
                    throw error;
                }
            },
            {
                retries: 5,
                onRetry: (err, attempt) => {
                    console.log(
                        `Retry attempt ${attempt} for email notification`,
                        err
                    );
                },
            }
        );

        await createNotificationRecord(data.userId, 'email', data.body);
        return { success: true };
    } catch (error) {
        throw new NotificationError(
            'Failed to send email notification',
            error.status || 500,
            { originalError: error.message }
        );
    }
};

// Course-related notifications
exports.sendCourseCreationNotification = async (event) => {
    const { courseName, enrolledStudents } = event;
    const message = `New course "${courseName}" has been created`;

    for (const student of enrolledStudents) {
        await this.sendEmailNotification({
            userId: student.userId,
            email: student.email,
            subject: 'New Course Available',
            body: message,
        });
    }
};

exports.sendCourseUpdateNotification = async (event) => {
    const { courseName, enrolledStudents, updateType } = event;
    const message = `Course "${courseName}" has been updated: ${updateType}`;

    for (const student of enrolledStudents) {
        await this.sendEmailNotification({
            userId: student.userId,
            email: student.email,
            subject: 'Course Updated',
            body: message,
        });
    }
};

exports.sendCourseDeletionNotification = async (event) => {
    const { courseName, enrolledStudents } = event;
    const message = `Course "${courseName}" has been deleted`;

    for (const student of enrolledStudents) {
        await this.sendEmailNotification({
            userId: student.userId,
            email: student.email,
            subject: 'Course Deleted',
            body: message,
        });
    }
};

// Module-related notifications
exports.sendModuleCreationNotification = async (event) => {
    const { courseName, moduleName, enrolledStudents } = event;
    const message = `New module "${moduleName}" has been added to course "${courseName}"`;

    for (const student of enrolledStudents) {
        await this.sendPushNotification({
            userId: student.userId,
            title: 'New Module Available',
            body: message,
            token: student.deviceToken,
        });
    }
};

exports.sendModuleUpdateNotification = async (event) => {
    const { courseName, moduleName, enrolledStudents } = event;
    const message = `Module "${moduleName}" in course "${courseName}" has been updated`;

    for (const student of enrolledStudents) {
        await this.sendPushNotification({
            userId: student.userId,
            title: 'Module Updated',
            body: message,
            token: student.deviceToken,
        });
    }
};

exports.sendModuleDeletionNotification = async (event) => {
    const { courseName, moduleName, enrolledStudents } = event;
    const message = `Module "${moduleName}" has been removed from course "${courseName}"`;

    for (const student of enrolledStudents) {
        await this.sendPushNotification({
            userId: student.userId,
            title: 'Module Removed',
            body: message,
            token: student.deviceToken,
        });
    }
};

// User-related notifications
exports.sendUserCreationNotification = async (event) => {
    const { userId, email, name } = event;
    const message = `Welcome to MoocFlix, ${name}! We're excited to have you on board.`;

    await this.sendEmailNotification({
        userId,
        email,
        subject: 'Welcome to MoocFlix',
        body: message,
    });
};

exports.sendUserUpdateNotification = async (event) => {
    const { userId, email, updateType } = event;
    const message = `Your account has been updated: ${updateType}`;

    await this.sendEmailNotification({
        userId,
        email,
        subject: 'Account Updated',
        body: message,
    });
};

exports.updatePreferences = async (data) => {
    try {
        // Implement preference update logic here
        await Notification.update(
            { preferences: data.preferences },
            { where: { userId: data.userId } }
        );
        return { success: true, message: 'Preferences updated successfully' };
    } catch (error) {
        throw new NotificationError('Failed to update preferences', 500, {
            originalError: error.message,
        });
    }
};

exports.getNotificationHistory = async (userId) => {
    try {
        const notifications = await Notification.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
        });
        return notifications;
    } catch (error) {
        throw new NotificationError(
            'Failed to fetch notification history',
            500,
            { originalError: error.message }
        );
    }
};
