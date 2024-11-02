const Course = require('../models/course');
const kafka = require('../utils/kafka');
const logger = require('../utils/logger');
const { ValidationError } = require('../utils/errors');
const { validateKafkaMessage } = require('../utils/kafkaValidator');

module.exports = {
    async handleUserCreation(message) {
        try {
            validateKafkaMessage('userCreation', message);

            let retries = 3;
            while (retries > 0) {
                try {
                    if (message.role === 'student') {
                        // Generate course recommendations for new student
                        const recommendedCourses = await Course.find({
                            isPublished: true,
                            ...(message.preferences?.level && {
                                level: message.preferences.level,
                            }),
                            ...(message.preferences?.topics && {
                                topics: { $in: message.preferences.topics },
                            }),
                        })
                            .limit(5)
                            .select('title description level topics rating')
                            .lean();

                        await kafka.sendMessage('Recommendations-Created', {
                            userId: message.userId,
                            recommendations: recommendedCourses,
                            timestamp: new Date(),
                        });

                        logger.info(
                            'Generated recommendations for new student',
                            {
                                userId: message.userId,
                                courseCount: recommendedCourses.length,
                            }
                        );
                        return recommendedCourses;
                    }
                    break;
                } catch (error) {
                    retries--;
                    logger.error('Error handling user creation:', {
                        error: error.message,
                        remainingRetries: retries,
                        userId: message.userId,
                    });

                    if (retries === 0) {
                        await kafka.sendMessage('Recommendations-Failed', {
                            userId: message.userId,
                            error: error.message,
                            timestamp: new Date(),
                        });
                    } else {
                        await new Promise((resolve) =>
                            setTimeout(resolve, 1000)
                        );
                    }
                }
            }
        } catch (error) {
            logger.error('Validation error in user creation handler:', {
                error: error.message,
                userData: message,
                stack: error.stack,
            });
            throw error;
        }
    },

    async handleUserUpdate(message) {
        try {
            validateKafkaMessage('userUpdate', message);

            let retries = 3;
            while (retries > 0) {
                try {
                    if (message.role === 'instructor') {
                        const result = await Course.updateMany(
                            { instructor: message.userId },
                            {
                                $set: {
                                    'instructor.name': message.name,
                                    'instructor.email': message.email,
                                    updatedAt: new Date(),
                                },
                            }
                        );

                        await kafka.sendMessage('Instructor-Updated', {
                            userId: message.userId,
                            name: message.name,
                            email: message.email,
                            coursesUpdated: result.modifiedCount,
                            timestamp: new Date(),
                        });

                        logger.info('Updated instructor information', {
                            userId: message.userId,
                            coursesAffected: result.modifiedCount,
                            timestamp: new Date(),
                        });
                    }
                    break;
                } catch (error) {
                    retries--;
                    logger.error('Error handling user update:', {
                        error: error.message,
                        remainingRetries: retries,
                        userData: message,
                    });

                    if (retries === 0) {
                        await kafka.sendMessage('User-Update-Failed', {
                            userId: message.userId,
                            role: message.role,
                            error: error.message,
                            failedAt: new Date(),
                        });
                    } else {
                        await new Promise((resolve) =>
                            setTimeout(resolve, 1000)
                        );
                    }
                }
            }
        } catch (error) {
            logger.error('Validation error in user update handler:', {
                error: error.message,
                userData: message,
                stack: error.stack,
            });
            throw error;
        }
    },
};
