const { sequelize } = require('../config/db');
const Video = require('../models/Video');
const VideoViewership = require('../models/VideoViewership');
const logger = require('../utils/logger');

class AnalyticsService {
    async trackViewership(videoId, userId, duration) {
        try {
            // Track video viewership
            const viewership = await VideoViewership.create({
                videoId,
                userId,
                duration,
                timestamp: new Date(),
            });

            // Update video stats
            await Video.increment('total_views', { where: { id: videoId } });

            return viewership;
        } catch (error) {
            logger.error('Error tracking viewership:', error);
            throw error;
        }
    }

    async generateInsights(videoId) {
        try {
            // Generate viewing insights
            const insights = await VideoViewership.findAll({
                where: { videoId },
                attributes: [
                    [sequelize.fn('COUNT', sequelize.col('id')), 'total_views'],
                    [
                        sequelize.fn('AVG', sequelize.col('duration')),
                        'avg_duration',
                    ],
                ],
            });

            return insights;
        } catch (error) {
            logger.error('Error generating insights:', error);
            throw error;
        }
    }
}

module.exports = new AnalyticsService();
