const AnalyticsService = {
    trackViewership: async (videoId, userId, duration) => {
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
    },

    generateInsights: async (videoId) => {
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
    },
};
