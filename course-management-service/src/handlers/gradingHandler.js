const Course = require('../models/course');
const kafka = require('../utils/kafka');
const logger = require('../utils/logger');
const { ValidationError } = require('../utils/errors');
const { validateKafkaMessage } = require('../utils/kafkaValidator');

module.exports = {
    async handleGradingCompleted(message) {
        try {
            validateKafkaMessage('gradingCompleted', message);

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

                    const assessment = module.assessments?.find(
                        (a) => a.assessmentId === message.assessmentId
                    );
                    if (!assessment) {
                        throw new ValidationError(
                            `Assessment not found: ${message.assessmentId}`
                        );
                    }

                    assessment.grades = assessment.grades || [];
                    const existingGradeIndex = assessment.grades.findIndex(
                        (g) =>
                            g.studentId.toString() ===
                            message.studentId.toString()
                    );

                    const gradeData = {
                        studentId: message.studentId,
                        score: message.score,
                        feedback: message.feedback || '',
                        gradedAt: new Date(),
                        gradedBy: message.gradedBy,
                        attempts: message.attempts || 1,
                    };

                    if (existingGradeIndex >= 0) {
                        assessment.grades[existingGradeIndex] = {
                            ...assessment.grades[existingGradeIndex],
                            ...gradeData,
                            updatedAt: new Date(),
                        };
                    } else {
                        assessment.grades.push(gradeData);
                    }

                    await course.save();

                    await kafka.sendMessage('Grade-Recorded', {
                        courseId: course._id,
                        moduleId: module._id,
                        assessmentId: assessment.assessmentId,
                        studentId: message.studentId,
                        score: message.score,
                        gradedAt: new Date(),
                        gradedBy: message.gradedBy,
                    });

                    logger.info('Grading completed successfully', {
                        courseId: message.courseId,
                        moduleId: message.moduleId,
                        assessmentId: message.assessmentId,
                        studentId: message.studentId,
                        score: message.score,
                    });

                    break;
                } catch (error) {
                    retries--;
                    logger.error('Error handling grading completion:', {
                        error: error.message,
                        remainingRetries: retries,
                        gradingData: message,
                    });

                    if (retries === 0) {
                        await kafka.sendMessage('Grade-Failed', {
                            courseId: message.courseId,
                            moduleId: message.moduleId,
                            assessmentId: message.assessmentId,
                            studentId: message.studentId,
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
            logger.error('Validation error in grading handler:', {
                error: error.message,
                gradingData: message,
                stack: error.stack,
            });
            throw error;
        }
    },
};
