const express = require('express');
const createCourseController = require('../controllers/createCourseController');
const updateCourseController = require('../controllers/updateCourseController');
const getCourseController = require('../controllers/getCourseController');
const deleteCourseController = require('../controllers/deleteCourseController');
const listCoursesController = require('../controllers/listCoursesController');
const enrollStudentController = require('../controllers/enrollStudentController');
const getCourseModulesController = require('../controllers/getCourseModulesController');
const listCourseStudentsController = require('../controllers/listCourseStudentsController');
const createCourseModuleController = require('../controllers/createCourseModuleController');
const updateCourseModuleController = require('../controllers/updateCourseModuleController');
const deleteCourseModuleController = require('../controllers/deleteCourseModuleController');
const createAssessmentController = require('../controllers/createAssessmentController');
const updateAssessmentController = require('../controllers/updateAssessmentController');
const submitAssessmentController = require('../controllers/submitAssessmentController');
const getAssessmentGradesController = require('../controllers/getAssessmentGradesController');
const authMiddleware = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validateRequest');
const { errorHandler } = require('../middlewares/errorMiddleware');

const router = express.Router();

// Course routes
router.post(
    '/create',
    authMiddleware,
    validateRequest.validateSchema('createCourse'),
    createCourseController.createCourse
);

router.put(
    '/:courseId/update',
    authMiddleware,
    validateRequest.validateSchema('updateCourse'),
    updateCourseController.updateCourse
);

router.get('/:courseId', authMiddleware, getCourseController.getCourse);

router.delete(
    '/:courseId',
    authMiddleware,
    deleteCourseController.deleteCourse
);

router.get('/', authMiddleware, listCoursesController.listCourses);

router.post(
    '/:courseId/enroll',
    authMiddleware,
    enrollStudentController.enrollStudent
);

// Module routes
router.get(
    '/:courseId/modules',
    authMiddleware,
    getCourseModulesController.getCourseModules
);

router.get(
    '/:courseId/students',
    authMiddleware,
    listCourseStudentsController.listCourseStudents
);

router.post(
    '/:courseId/modules/create',
    authMiddleware,
    validateRequest.validateSchema('createModule'),
    createCourseModuleController.createCourseModule
);

router.put(
    '/:courseId/modules/:moduleId/update',
    authMiddleware,
    validateRequest.validateSchema('updateModule'),
    updateCourseModuleController.updateCourseModule
);

router.delete(
    '/:courseId/modules/:moduleId/delete',
    authMiddleware,
    deleteCourseModuleController.deleteCourseModule
);

// Assessment routes
router.post(
    '/:courseId/modules/:moduleId/assessments/create',
    authMiddleware,
    validateRequest.validateSchema('createAssessment'),
    createAssessmentController.createAssessment
);

router.put(
    '/:courseId/modules/:moduleId/assessments/:assessmentId/update',
    authMiddleware,
    validateRequest.validateSchema('updateAssessment'),
    updateAssessmentController.updateAssessment
);

router.post(
    '/:courseId/modules/:moduleId/assessments/:assessmentId/submit',
    authMiddleware,
    validateRequest.validateSchema('submitAssessment'),
    submitAssessmentController.submitAssessment
);

router.get(
    '/:courseId/modules/:moduleId/assessments/:assessmentId/grades',
    authMiddleware,
    getAssessmentGradesController.getGrades
);

// Apply error handler
router.use(errorHandler);

module.exports = router;
