# Course Management Service

## About the Service

The Course Management Service is a microservice for managing courses in the MoocFlix platform. It provides functionalities for creating, updating, and deleting courses and modules, enrolling students, and listing courses and students. The service uses MongoDB for data storage and Kafka for messaging.

## Routes

### Course Routes

- **POST /api/v1/courses/create**
  - Description: Create a new course.
  - Middleware: `authMiddleware`
  - Controller: `createCourseController.createCourse`

- **PUT /api/v1/courses/:courseId/update**
  - Description: Update an existing course.
  - Middleware: `authMiddleware`
  - Controller: `updateCourseController.updateCourse`

- **GET /api/v1/courses/:courseId**
  - Description: Get details of a specific course.
  - Middleware: `authMiddleware`
  - Controller: `getCourseController.getCourse`

- **DELETE /api/v1/courses/:courseId**
  - Description: Delete a specific course.
  - Middleware: `authMiddleware`
  - Controller: `deleteCourseController.deleteCourse`

- **GET /api/v1/courses**
  - Description: List all courses.
  - Middleware: `authMiddleware`
  - Controller: `listCoursesController.listCourses`

- **POST /api/v1/courses/:courseId/enroll**
  - Description: Enroll a student in a course.
  - Middleware: `authMiddleware`
  - Controller: `enrollStudentController.enrollStudent`

- **GET /api/v1/courses/:courseId/modules**
  - Description: Get all modules of a specific course.
  - Middleware: `authMiddleware`
  - Controller: `getCourseModulesController.getCourseModules`

- **GET /api/v1/courses/:courseId/students**
  - Description: List all students enrolled in a specific course.
  - Middleware: `authMiddleware`
  - Controller: `listCourseStudentsController.listCourseStudents`

- **POST /api/v1/courses/:courseId/modules/create**
  - Description: Create a new module in a course.
  - Middleware: `authMiddleware`
  - Controller: `createCourseModuleController.createCourseModule`

- **PUT /api/v1/courses/:courseId/modules/:moduleId/update**
  - Description: Update a specific module in a course.
  - Middleware: `authMiddleware`
  - Controller: `updateCourseModuleController.updateCourseModule`

- **DELETE /api/v1/courses/:courseId/modules/:moduleId/delete**
  - Description: Delete a specific module in a course.
  - Middleware: `authMiddleware`
  - Controller: `deleteCourseModuleController.deleteCourseModule`

## File Structure

```
course-management-service/
├── config/
│   └── config.js
├── src/
│   ├── controllers/
│   │   ├── createCourseController.js
│   │   ├── updateCourseController.js
│   │   ├── getCourseController.js
│   │   ├── deleteCourseController.js
│   │   ├── listCoursesController.js
│   │   ├── enrollStudentController.js
│   │   ├── getCourseModulesController.js
│   │   ├── listCourseStudentsController.js
│   │   ├── createCourseModuleController.js
│   │   ├── updateCourseModuleController.js
│   │   └── deleteCourseModuleController.js
│   ├── middlewares/
│   │   └── authMiddleware.js
│   ├── models/
│   │   └── course.js
│   ├── routes/
│   │   └── courseRoutes.js
│   ├── services/
│   │   ├── createCourseService.js
│   │   ├── updateCourseService.js
│   │   ├── getCourseService.js
│   │   ├── deleteCourseService.js
│   │   ├── listCoursesService.js
│   │   ├── enrollStudentService.js
│   │   ├── getCourseModulesService.js
│   │   ├── listCourseStudentsService.js
│   │   ├── createCourseModuleService.js
│   │   ├── updateCourseModuleService.js
│   │   └── deleteCourseModuleService.js
│   ├── utils/
│   │   └── kafka.js
│   └── index.js
├── .env
├── .gitignore
├── .prettierignore
├── .prettierrc
├── Dockerfile
├── package.json
└── README_Doc.md
```


## Kafka Producer and Consumer Architecture

### Kafka Producer

The service uses Kafka to send messages for various events such as course creation, course update, module creation, and module update. The Kafka producer is configured in the `kafka.js` utility file.

### Kafka Consumer

The service can also consume messages from Kafka topics to handle events from other microservices. The Kafka consumer is configured similarly to the producer.

## Environment Variables

Ensure the following environment variables are set in the `.env` file:
