// src/services/kafkaHandler.js
const BaseService = require('./baseService');
const { kafka } = require('../config/kafka');
const { logger } = require('../config/logger');
// const {
//     Quiz,
//     Assignment,
//     Submission,
//     AssignmentSubmission,
// } = require('../models');
const { Quiz } = require('../models/quizModel');
const { Assignment } = require('../models/assignmentModel');
const { Submission } = require('../models/submissionModel');
const { AssignmentSubmission } = require('../models/assignmentSubmissionModel');
const { validateUser } = require('./userService');
const { validateCourseId } = require('./courseService');

class KafkaHandler extends BaseService {
    static async handleIncomingMessage(topic, message) {
        return await this.handleServiceCall(async () => {
            const handlers = {
                'User-Creation': this.handleUserCreation,
                'User-Update': this.handleUserUpdate,
                'Course-Creation': this.handleCourseCreation,
                'Course-Update': this.handleCourseUpdate,
                'Course-Deletion': this.handleCourseDeletion,
                'Student-Enrolled': this.handleStudentEnrollment,
                'Assessment-Creation': this.handleAssessmentCreation,
                'Submission-Completed': this.handleSubmissionCompleted,
                'Grading-Completed': this.handleGradingCompleted,
                'Assignment-Submitted': this.handleAssignmentSubmission,
            };

            const handler = handlers[topic];
            if (!handler) {
                logger.info(`Unhandled topic: ${topic}`);
                return;
            }

            await handler(message);
        }, `Failed to handle message for topic: ${topic}`);
    }

    static async handleUserCreation(message) {
        const { userId, role } = message;
        if (role === 'instructor' || role === 'student') {
            logger.info(`New ${role} created with ID: ${userId}`);
        }
    }

    static async handleUserUpdate(message) {
        const { userId, updates } = message;
        const isValidUser = await validateUser(userId);
        if (isValidUser) {
            logger.info(`User ${userId} updated with:`, updates);
        }
    }

    static async handleCourseCreation(message) {
        const { courseId, instructorId } = message;
        const isValidInstructor = await validateUser(instructorId);
        if (isValidInstructor) {
            logger.info(
                `New course ${courseId} created by instructor ${instructorId}`
            );
        }
    }

    static async handleCourseUpdate(message) {
        const { courseId, updates } = message;
        const isValidCourse = await validateCourseId(courseId);
        if (isValidCourse) {
            logger.info(`Course ${courseId} updated with:`, updates);
        }
    }

    static async handleCourseDeletion(message) {
        const { courseId } = message;
        await Promise.all([
            Quiz.deleteMany({ courseId }),
            Assignment.deleteMany({ courseId }),
            Submission.deleteMany({ courseId }),
            AssignmentSubmission.deleteMany({ courseId }),
        ]);
        logger.info(`Course ${courseId} and all associated data deleted`);
    }

    static async handleStudentEnrollment(message) {
        const { courseId, studentId } = message;
        const [isValidCourse, isValidStudent] = await Promise.all([
            validateCourseId(courseId),
            validateUser(studentId),
        ]);

        if (isValidCourse && isValidStudent) {
            const quizzes = await Quiz.find({ courseId });
            const assignments = await Assignment.find({ courseId });
            await kafka.producer().send({
                topic: 'Assessment-Notification',
                messages: [
                    {
                        key: 'assessment-notification',
                        value: JSON.stringify({
                            studentId,
                            courseId,
                            quizzes,
                            assignments,
                        }),
                    },
                ],
            });
        }
    }

    static async handleAssessmentCreation(message) {
        const { courseId, assessmentId, type } = message;
        logger.info(
            `New ${type} created for course ${courseId} with ID ${assessmentId}`
        );
    }

    static async handleSubmissionCompleted(message) {
        const { courseId, assessmentId, submissionId, studentId } = message;
        logger.info(
            `New submission ${submissionId} received for assessment ${assessmentId}`
        );
    }

    static async handleGradingCompleted(message) {
        const { assessmentId, submissionId, grade } = message;
        logger.info(
            `Grading completed for submission ${submissionId} with grade ${grade}`
        );
    }

    static async handleTranscodingCompleted(message) {
        const { courseId, contentId, url } = message;
        logger.info(
            `Content ${contentId} for course ${courseId} transcoded. URL: ${url}`
        );
    }

    static async handleAssignmentSubmission(message) {
        const { courseId, assignmentId, submissionId, studentId } = message;
        await kafka.producer().send({
            topic: 'Instructor-Notification',
            messages: [
                {
                    key: 'instructor-notification',
                    value: JSON.stringify({
                        type: 'new_submission',
                        courseId,
                        assignmentId,
                        submissionId,
                        studentId,
                    }),
                },
            ],
        });
    }

    static async initializeKafkaConsumer() {
        return await this.handleServiceCall(async () => {
            const topics = [
                'User-Creation',
                'User-Update',
                'Course-Creation',
                'Course-Update',
                'Course-Deletion',
                'Student-Enrolled',
                'Assessment-Creation',
                'Submission-Completed',
                'Grading-Completed',
                'Assignment-Submitted',
            ];

            const consumer = kafka.consumer({
                groupId: process.env.KAFKA_GROUP_ID,
            });
            await consumer.connect();

            for (const topic of topics) {
                await consumer.subscribe({ topic });
            }

            await consumer.run({
                eachMessage: async ({ topic, message }) => {
                    await this.handleIncomingMessage(
                        topic,
                        JSON.parse(message.value.toString())
                    );
                },
            });

            logger.info('Kafka consumer initialized successfully');
            return consumer;
        }, 'Failed to initialize Kafka consumer');
    }
}

module.exports = KafkaHandler;
