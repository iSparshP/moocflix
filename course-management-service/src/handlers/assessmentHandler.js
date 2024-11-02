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

                    if (existingSubmission) {
                        existingSubmission.status =
                            message.status || 'submitted';
                        existingSubmission.submittedAt = new Date();
                        existingSubmission.attemptCount =
                            (existingSubmission.attemptCount || 0) + 1;
                        if (message.metadata) {
                            existingSubmission.metadata = message.metadata;
                        }
                    } else {
                        assessment.submissions.push({
                            studentId: message.studentId,
                            submittedAt: new Date(),
                            status: message.status || 'submitted',
                            attemptCount: 1,
                            metadata: message.metadata || {},
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

                    logger.info('Submission processed successfully', {
                        courseId: message.courseId,
                        moduleId: message.moduleId,
                        assessmentId: message.assessmentId,
                        studentId: message.studentId,
                        status: 'recorded',
                    });

                    break;
                } catch (error) {
                    retries--;
                    logger.error('Error processing submission:', {
                        error: error.message,
                        remainingRetries: retries,
                        submissionData: message,
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
