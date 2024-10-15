MoocFlix: A mooc streaming platform
user-management-service is going to be a microservice which is going to carry out these tasks:
1. Quiz/Assignment Handling: Manage creation and submission of quizzes and assignments.
2. Auto-Grading: Implement automated grading for quizzes with objective answers and integrate manual grading for subjective assignments().

the structure is going to look like this:
/assessment-service
│
├── /src
│   ├── /controllers         # Handle HTTP requests (create quiz, grade assignment)
│   ├── /models              # Define quiz, assignment models
│   ├── /services            # Logic for grading, assignment submission
│   ├── /routes              # Define routes (e.g., /assignments, /quizzes)
│   └── /middlewares         # Validation and permission checks
│
├── /config                  # Environment configurations
├── /tests                   # Unit tests for assessment logic
├── package.json             # Dependencies
└── Dockerfile               # Docker setup



these are going to be the routes:
POST   /api/v1/assessments/:courseId/quiz/create      // Instructor creates a quiz
GET    /api/v1/assessments/:courseId/quizzes          // List all quizzes in a course
POST   /api/v1/assessments/:quizId/submit             // Student submits a quiz
GET    /api/v1/assessments/:quizId/result             // Fetch quiz result (student)
POST   /api/v1/assessments/:quizId/grade              // Instructor grades a quiz
POST   /api/v1/assignments/:courseId/create           // Create an assignment
POST   /api/v1/assignments/:assignmentId/submit       // Submit an assignment
GET    /api/v1/assignments/:assignmentId/result       // Fetch assignment grade




process:
Assessment & Grading Service
Request: For submitting a quiz (POST /api/assessments/:quizId/submit), the API Gateway routes the request to the Assessment Service.
Routing: The request is forwarded to POST /api/v1/assessments/:quizId/submit, and the service processes the quiz answers.
Response: The quiz submission response is sent back via the Gateway.

