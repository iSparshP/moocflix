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
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/create', authMiddleware, createCourseController.createCourse);
router.put(
    '/:courseId/update',
    authMiddleware,
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
    createCourseModuleController.createCourseModule
);
router.put(
    '/:courseId/modules/:moduleId/update',
    authMiddleware,
    updateCourseModuleController.updateCourseModule
);
router.delete(
    '/:courseId/modules/:moduleId/delete',
    authMiddleware,
    deleteCourseModuleController.deleteCourseModule
);

module.exports = router;
