// src/services/assignmentService.js
const BaseService = require('./baseService');
const { Assignment } = require('../models/assignmentModel');
const { AssignmentSubmission } = require('../models/assignmentSubmissionModel');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { logger } = require('../config/logger');

class AssignmentService extends BaseService {
    static async saveAssignment(courseId, assignmentData) {
        return await this.handleServiceCall(async () => {
            const assignment = new Assignment({ ...assignmentData, courseId });
            await assignment.save();
            logger.info('Assignment created', {
                courseId,
                assignmentId: assignment._id,
            });
            return assignment._id;
        }, 'Failed to create assignment');
    }

    static async fetchAssignments(courseId) {
        return await this.handleServiceCall(async () => {
            const assignments = await Assignment.find({ courseId });
            if (!assignments.length) {
                throw new NotFoundError('No assignments found for this course');
            }
            return assignments;
        }, 'Failed to fetch assignments');
    }

    static async submitAssignmentAnswers(assignmentId, submissionData) {
        return await this.handleServiceCall(async () => {
            const assignment = await Assignment.findById(assignmentId);
            if (!assignment) {
                throw new NotFoundError('Assignment not found');
            }

            const submission = new AssignmentSubmission({
                ...submissionData,
                assignmentId,
            });
            await submission.save();
            logger.info('Assignment submitted', {
                assignmentId,
                submissionId: submission._id,
            });
            return submission._id;
        }, 'Failed to submit assignment');
    }

    static async fetchAssignmentResult(assignmentId, studentId) {
        return await this.handleServiceCall(async () => {
            const submission = await AssignmentSubmission.findOne({
                assignmentId,
                studentId,
            });
            if (!submission) {
                throw new NotFoundError('Submission not found');
            }
            return submission;
        }, 'Failed to fetch assignment result');
    }

    static async gradeAssignmentSubmission(
        assignmentId,
        submissionId,
        grade,
        gradedBy
    ) {
        return await this.handleServiceCall(async () => {
            const submission = await AssignmentSubmission.findById(
                submissionId
            );
            if (!submission) {
                throw new NotFoundError('Submission not found');
            }
            if (submission.assignmentId !== assignmentId) {
                throw new ValidationError(
                    'Submission does not match assignment ID'
                );
            }

            submission.grade = grade;
            submission.gradedBy = gradedBy;
            submission.gradedAt = new Date();
            submission.status = 'graded';
            await submission.save();

            logger.info('Assignment graded', {
                assignmentId,
                submissionId,
                grade,
            });
            return submission;
        }, 'Failed to grade assignment');
    }

    static async updateAssignment(courseId, assignmentId, updateData) {
        return await this.handleServiceCall(async () => {
            const assignment = await Assignment.findOneAndUpdate(
                { _id: assignmentId, courseId },
                { $set: updateData },
                { new: true }
            );
            if (!assignment) {
                throw new NotFoundError('Assignment not found');
            }
            logger.info('Assignment updated', { courseId, assignmentId });
            return assignment;
        }, 'Failed to update assignment');
    }

    static async deleteAssignment(courseId, assignmentId) {
        return await this.handleServiceCall(async () => {
            const result = await Assignment.deleteOne({
                _id: assignmentId,
                courseId,
            });
            if (result.deletedCount === 0) {
                throw new NotFoundError('Assignment not found');
            }
            logger.info('Assignment deleted', { courseId, assignmentId });
            return true;
        }, 'Failed to delete assignment');
    }
}

module.exports = AssignmentService;
