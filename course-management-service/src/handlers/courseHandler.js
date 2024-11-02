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

                        logger.info('Course recommendations created', {
                            userId: message.userId,
                            coursesCount: recommendedCourses.length,
                        });
                        break;
                    }
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

    async handleAssessmentCreation(message) {
        try {
            validateKafkaMessage('assessmentCreation', message);
            let retries = 3;
            while (retries > 0) {
                try {
                    const course = await Course.findById(message.courseId);
                    if (!course) {
                        throw new ValidationError(
                            `Course not found: ${message.courseId}`
                        );
                    }

                    const module = course.modules.id(message.moduleId);
                    if (!module) {
                        throw new ValidationError(
                            `Module not found: ${message.moduleId}`
                        );
                    }

                    module.assessments = module.assessments || [];
                    const existingIndex = module.assessments.findIndex(
                        (a) => a.assessmentId === message.assessmentId
                    );

                    if (existingIndex >= 0) {
                        Object.assign(
                            module.assessments[existingIndex],
                            message.assessmentData
                        );
                    } else {
                        module.assessments.push({
                            assessmentId: message.assessmentId,
                            ...message.assessmentData,
                            createdAt: new Date(),
                        });
                    }

                    await course.save();
                    await kafka.sendMessage('Assessment-Linked', {
                        courseId: course._id,
                        moduleId: module._id,
                        assessmentId: message.assessmentId,
                        timestamp: new Date(),
                    });

                    logger.info('Assessment linked to course', {
                        courseId: message.courseId,
                        moduleId: message.moduleId,
                        assessmentId: message.assessmentId,
                        timestamp: new Date(),
                    });
                    break;
                } catch (error) {
                    retries--;
                    logger.error('Error handling assessment creation:', {
                        error: error.message,
                        remainingRetries: retries,
                        assessmentId: message.assessmentId,
                        courseId: message.courseId,
                    });
                    if (retries === 0) {
                        await kafka.sendMessage('Assessment-Link-Failed', {
                            courseId: message.courseId,
                            moduleId: message.moduleId,
                            assessmentId: message.assessmentId,
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
            logger.error('Validation error in assessment creation handler:', {
                error: error.message,
                assessmentData: message,
                stack: error.stack,
            });
            throw error;
        }
    },
};
