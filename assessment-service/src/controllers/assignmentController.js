// src/controllers/assignmentController.js
const { BaseController } = require('./baseController');
const {
    saveAssignment,
    submitAssignmentAnswers,
    fetchAssignmentResult,
    gradeAssignmentSubmission,
    fetchAssignments,
    updateAssignment,
    removeAssignment,
} = require('../services/assignmentService');
const {
    notifyAssignmentSubmissionCompleted,
    notifyAssignmentGradingCompleted,
    notifyStudents,
} = require('../services/notificationService');
const { validateCourseId } = require('../services/courseService');

class AssignmentController extends BaseController {
    static async createAssignment(req, res) {
        await this.handleRequest(req, res, async (req) => {
            const { courseId } = req.params;
            const assignmentData = req.body;

            await validateCourseId(courseId);
            const assignmentId = await saveAssignment(courseId, assignmentData);
            await notifyStudents(courseId, assignmentId);

            return {
                message: 'Assignment created successfully',
                assignmentId,
            };
        });
    }

    static async submitAssignment(req, res) {
        await this.handleRequest(req, res, async (req) => {
            const { assignmentId } = req.params;
            const submissionData = req.body;

            const submissionId = await submitAssignmentAnswers(
                assignmentId,
                submissionData
            );

            await notifyAssignmentSubmissionCompleted(
                req.params.courseId,
                assignmentId,
                submissionId
            );

            return {
                message: 'Assignment submitted successfully',
                submissionId,
            };
        });
    }

    static async getAssignmentResult(req, res) {
        await this.handleRequest(req, res, async (req) => {
            const { assignmentId } = req.params;
            return await fetchAssignmentResult(assignmentId);
        });
    }

    static async gradeAssignment(req, res) {
        await this.handleRequest(req, res, async (req) => {
            const { assignmentId } = req.params;
            const { submissionId, grade } = req.body;

            await gradeAssignmentSubmission(assignmentId, submissionId, grade);
            await notifyAssignmentGradingCompleted(assignmentId, submissionId);

            return { message: 'Assignment graded successfully' };
        });
    }

    static async getAssignments(req, res) {
        await this.handleRequest(req, res, async (req) => {
            const { courseId } = req.params;
            await validateCourseId(courseId);
            return await fetchAssignments(courseId);
        });
    }

    static async updateAssignment(req, res) {
        await this.handleRequest(req, res, async (req) => {
            const { courseId, assignmentId } = req.params;
            const assignmentData = req.body;

            await validateCourseId(courseId);
            await updateAssignment(courseId, assignmentId, assignmentData);

            return { message: 'Assignment updated successfully' };
        });
    }

    static async deleteAssignment(req, res) {
        await this.handleRequest(req, res, async (req) => {
            const { courseId, assignmentId } = req.params;

            await validateCourseId(courseId);
            await removeAssignment(courseId, assignmentId);

            return { message: 'Assignment deleted successfully' };
        });
    }
}

// Export individual handler methods
module.exports = {
    createAssignment:
        AssignmentController.createAssignment.bind(AssignmentController),
    submitAssignment:
        AssignmentController.submitAssignment.bind(AssignmentController),
    getAssignmentResult:
        AssignmentController.getAssignmentResult.bind(AssignmentController),
    gradeAssignment:
        AssignmentController.gradeAssignment.bind(AssignmentController),
    getAssignments:
        AssignmentController.getAssignments.bind(AssignmentController),
    updateAssignment:
        AssignmentController.updateAssignment.bind(AssignmentController),
    deleteAssignment:
        AssignmentController.deleteAssignment.bind(AssignmentController),
    AssignmentController, // Keep the class export as well
};
