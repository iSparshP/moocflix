const express = require('express');
const router = express.Router();
const validateVideoRequest = require('../middleware/validateVideo');
const resourceManager = require('../services/resourceManager');
const queue = require('../services/queueService');
const logger = require('../utils/logger');

router.post('/', validateVideoRequest, async (req, res, next) => {
    try {
        const { videoId, profile, priority } = req.body;
        const resourceRequirements = req.resourceRequirements;

        // Allocate resources
        await resourceManager.allocateResources(videoId, resourceRequirements);

        // Add to queue
        const metrics = await queue.addJob({ videoId, profile }, priority);

        res.status(202).json({
            message: 'Transcoding job queued successfully',
            jobId: videoId,
            metrics,
        });
    } catch (error) {
        next(error);
    }
});

router.get('/:jobId/status', async (req, res, next) => {
    try {
        const { jobId } = req.params;
        const status = queue.getJobStatus(jobId);

        if (!status) {
            return res.status(404).json({ error: 'Job not found' });
        }

        res.json(status);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
