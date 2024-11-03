const validateNotification = (req, res, next) => {
    const { userId, title, body, token, email, subject, preferences } =
        req.body;

    // Validate push notifications
    if (req.path === '/sendPush') {
        if (!userId || !title || !body || !token) {
            return res.status(400).json({
                status: 'error',
                message: 'Missing required fields for push notification',
                required: ['userId', 'title', 'body', 'token'],
            });
        }
    }

    // Validate email notifications
    if (req.path === '/sendEmail') {
        if (!userId || !email || !subject || !body) {
            return res.status(400).json({
                status: 'error',
                message: 'Missing required fields for email notification',
                required: ['userId', 'email', 'subject', 'body'],
            });
        }

        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid email format',
            });
        }
    }

    // Validate preference updates
    if (req.path === '/preferences') {
        if (!userId || !preferences) {
            return res.status(400).json({
                status: 'error',
                message: 'Missing required fields for preference update',
                required: ['userId', 'preferences'],
            });
        }

        if (typeof preferences !== 'object') {
            return res.status(400).json({
                status: 'error',
                message: 'Preferences must be an object',
            });
        }

        const validPreferences = ['email', 'push'];
        const hasInvalidPreference = Object.keys(preferences).some(
            (key) => !validPreferences.includes(key)
        );

        if (hasInvalidPreference) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid preference type',
                validTypes: validPreferences,
            });
        }
    }

    next();
};

module.exports = validateNotification;
