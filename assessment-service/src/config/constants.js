const API_PREFIX = '/api/v1/assessments';

const ROUTES = {
    QUIZ: {
        CREATE: `${API_PREFIX}/:courseId/quiz/create`,
        LIST: `${API_PREFIX}/:courseId/quizzes`,
        SUBMIT: `${API_PREFIX}/:courseId/quiz/:quizId/submit`,
        RESULTS: `${API_PREFIX}/:courseId/quiz/:quizId/results`,
        SUBMISSIONS: `${API_PREFIX}/:courseId/quiz/:quizId/submissions`,
        SUBMISSION_DETAIL: `${API_PREFIX}/:courseId/quiz/:quizId/submission/:submissionId`,
        BASE: `${API_PREFIX}/:courseId/quiz/:quizId`,
        GRADE: `${API_PREFIX}/:courseId/quiz/:quizId/grade`,
    },
    ASSIGNMENT: {
        CREATE: `${API_PREFIX}/:courseId/assignment/create`,
        SUBMIT: `${API_PREFIX}/:courseId/assignment/:assignmentId/submit`,
        RESULT: `${API_PREFIX}/:courseId/assignment/:assignmentId/result`,
        GRADE: `${API_PREFIX}/:courseId/assignment/:assignmentId/grade`,
    },
};

const HEALTH_ENDPOINTS = {
    BASIC: '/health',
    DETAILED: '/health/detailed',
};

module.exports = {
    API_PREFIX,
    ROUTES,
    HEALTH_ENDPOINTS,
};
