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

const router = express.Router();

// Course routes
router.post('/', createCourseController.createCourse);
router.get('/', listCoursesController.listCourses);
router.get('/:courseId', getCourseController.getCourse);
router.put('/:courseId', updateCourseController.updateCourse);
router.delete('/:courseId', deleteCourseController.deleteCourse);

// Module routes
router.get('/:courseId/modules', getCourseModulesController.getCourseModules);
router.post(
    '/:courseId/modules',
    createCourseModuleController.createCourseModule
);
router.put(
    '/:courseId/modules/:moduleId',
    updateCourseModuleController.updateCourseModule
);
router.delete(
    '/:courseId/modules/:moduleId',
    deleteCourseModuleController.deleteCourseModule
);

// Enrollment routes
router.post('/:courseId/enroll', enrollStudentController.enrollStudent);
router.get(
    '/:courseId/students',
    listCourseStudentsController.listCourseStudents
);

module.exports = router;
