const Course = require('../models/course');
const kafka = require('../utils/kafka');
const logger = require('../utils/logger');
const { ValidationError } = require('../utils/errors');
const { validateKafkaMessage } = require('../utils/kafkaValidator');

module.exports = {
    async handleSubmissionCompleted(message) {
        try {
            validateKafkaMessage('submissionCompleted', message);

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

                    assessment.submissions = assessment.submissions || [];
                    const existingSubmission = assessment.submissions.find(
                        (s) =>
                            s.studentId.toString() ===
                            message.studentId.toString()
                    );

                    const submissionData = {
                        studentId: message.studentId,
                        submittedAt: new Date(),
                        status: message.status || 'submitted',
                        metadata: message.metadata || {},
                    };

                    if (existingSubmission) {
                        Object.assign(existingSubmission, submissionData);
                        existingSubmission.attemptCount =
                            (existingSubmission.attemptCount || 0) + 1;
                    } else {
                        assessment.submissions.push({
                            ...submissionData,
                            attemptCount: 1,
                        });
                    }

                    await course.save();

                    await kafka.sendMessage('Submission-Recorded', {
                        courseId: course._id,
                        moduleId: module._id,
                        assessmentId: assessment.assessmentId,
                        studentId: message.studentId,
                        submittedAt: new Date(),
                        status: 'recorded',
                    });

                    logger.info('Submission recorded successfully', {
                        courseId: message.courseId,
                        moduleId: message.moduleId,
                        assessmentId: message.assessmentId,
                        studentId: message.studentId,
                        timestamp: new Date(),
                    });

                    break;
                } catch (error) {
                    retries--;
                    logger.error('Error handling submission:', {
                        error: error.message,
                        remainingRetries: retries,
                        submissionData: message,
                        stack: error.stack,
                    });

                    if (retries === 0) {
                        await kafka.sendMessage('Submission-Failed', {
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
            logger.error('Validation error in submission handler:', {
                error: error.message,
                submissionData: message,
                stack: error.stack,
            });
            throw error;
        }
    },
};
