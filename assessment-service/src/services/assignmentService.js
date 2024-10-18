// src/services/assignmentService.js
const { Assignment } = require('../models/assignmentModel');
const { AssignmentSubmission } = require('../models/assignmentSubmissionModel');

exports.saveAssignment = async (courseId, assignmentData) => {
    const assignment = new Assignment({ ...assignmentData, courseId });
    await assignment.save();
    return assignment._id;
};

exports.submitAssignmentAnswers = async (assignmentId, submissionData) => {
    const submission = new AssignmentSubmission({
        ...submissionData,
        assignmentId,
    });
    await submission.save();
    return submission._id;
};

exports.fetchAssignmentResult = async (assignmentId) => {
    return await AssignmentSubmission.findOne({ assignmentId });
};

exports.gradeAssignmentSubmission = async (
    assignmentId,
    submissionId,
    grade
) => {
    await AssignmentSubmission.updateOne(
        { assignmentId, _id: submissionId },
        { $set: { grade } }
    );
};
