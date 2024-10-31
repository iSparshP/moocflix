// src/middleware/validateVideo.js
const validator = require('../services/validationService');

const validateVideoRequest = async (req, res, next) => {
    try {
        const { videoId, profile, priority } = req.body;

        // Validate parameters
        validator.validateJobParameters({ videoId, profile, priority });

        // Validate video file
        await validator.validateVideoFile(videoId);

        // Add resource requirements to request
        req.resourceRequirements =
            validator.validateResourceRequirements(profile);

        next();
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        next(error);
    }
};

module.exports = validateVideoRequest;
