module.exports = (req, res, next) => {
    const { userId, title, body, token, email, subject, preferences } =
        req.body;

    if (req.path === '/api/v1/notifications/sendPush') {
        // Validate push notification request
        if (!userId || !title || !body || !token) {
            return res
                .status(400)
                .json({
                    message: 'Missing required fields for push notification',
                });
        }
    } else if (req.path === '/api/v1/notifications/sendEmail') {
        // Validate email notification request
        if (!userId || !email || !subject || !body) {
            return res
                .status(400)
                .json({
                    message: 'Missing required fields for email notification',
                });
        }
    } else if (req.path === '/api/v1/notifications/preferences') {
        // Validate preferences update request
        if (!userId || !preferences) {
            return res
                .status(400)
                .json({
                    message: 'Missing required fields for preferences update',
                });
        }
    } else {
        // Validate other requests
        const { topic, messages } = req.body;
        if (!topic) {
            return res.status(400).json({ message: 'Topic is required' });
        }

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({
                message: 'Messages array is required and cannot be empty',
            });
        }

        for (const message of messages) {
            if (!message.value) {
                return res
                    .status(400)
                    .json({ message: 'Each message must have a value' });
            }

            try {
                JSON.parse(message.value);
            } catch (error) {
                return res.status(400).json({
                    message: 'Each message value must be a valid JSON string',
                });
            }
        }
    }

    next();
};
