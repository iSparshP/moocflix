MoocFlix: A mooc streaming platform
assessment-service is going to be a microservice which is going to carry out these tasks:
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




# Assessment Service Routes

## 1. POST /api/v1/assessments/:courseId/quiz/create
**Description**: Instructor creates a new quiz for a specific course.

**Request Body**:
```json
{
  "title": "Midterm Quiz",
  "description": "Quiz on chapters 1-5",
  "questions": [
    { "questionId": "q1", "type": "multiple-choice", "choices": ["A", "B", "C", "D"], "correctAnswer": "A" },
    { "questionId": "q2", "type": "short-answer", "answer": "42" }
  ],
  "dueDate": "2024-11-15"
}
```

**Logic**:
- Validate the `courseId` via **Course Management Service**.
- Store quiz data in the database.
- Notify students via **Notification Service** about the new quiz.

**Response**:
```json
{
  "message": "Quiz created successfully",
  "quizId": "quiz-789"
}
```

---

## 2. GET /api/v1/assessments/:courseId/quizzes
**Description**: Retrieve all quizzes for a course.

**Logic**:
- Validate the course ID.
- Fetch quizzes from the database, cache results in Redis for quick future access.

**Response**:
```json
[
  { "quizId": "quiz-789", "title": "Midterm Quiz", "dueDate": "2024-11-15" },
  { "quizId": "quiz-123", "title": "Final Exam", "dueDate": "2024-12-15" }
]
```

---

## 3. POST /api/v1/assessments/:quizId/submit
**Description**: Student submits their responses for a quiz.

**Request Body**:
```json
{
  "userId": "student-123",
  "responses": [
    { "questionId": "q1", "answer": "A" },
    { "questionId": "q2", "answer": "42" }
  ]
}
```

**Logic**:
- Validate the student with **User Management Service**.
- Compare responses to correct answers in the database.
- Store results and send to Kafka to notify the **Notification Service**.

**Response**:
```json
{
  "message": "Submission successful",
  "score": 90
}
```

---

## 4. GET /api/v1/assessments/:quizId/result
**Description**: Retrieve a student's score for a specific quiz.

**Logic**:
- Validate the user with **User Management Service**.
- Fetch quiz result from the database or Redis if cached.

**Response**:
```json
{
  "userId": "student-123",
  "quizId": "quiz-789",
  "score": 90,
  "status": "Pass"
}
```

---

## 5. POST /api/v1/assessments/:quizId/grade
**Description**: Instructor manually grades a quiz if necessary (e.g., for subjective questions).

**Request Body**:
```json
{
  "userId": "student-123",
  "grade": 85
}
```

**Logic**:
- Validate quiz and user ID.
- Store the updated grade in the database.

**Response**:
```json
{
  "message": "Grade submitted successfully",
  "grade": 85
}
```

---

## 6. POST /api/v1/assignments/:courseId/create
**Description**: Instructor creates a new assignment for the course.

**Request Body**:
```json
{
  "title": "Final Project",
  "description": "Complete the final project by the deadline.",
  "dueDate": "2024-12-20"
}
```

**Logic**:
- Validate the course ID via **Course Management Service**.
- Store the assignment in the database.

**Response**:
```json
{
  "message": "Assignment created successfully",
  "assignmentId": "assign-123"
}
```

---

## 7. POST /api/v1/assignments/:assignmentId/submit
**Description**: Student submits their completed assignment.

**Request Body**:
```json
{
  "userId": "student-456",
  "submissionUrl": "https://s3.amazonaws.com/student-project.pdf"
}
```

**Logic**:
- Validate the student ID via **User Management Service**.
- Store submission details in the database.
- Trigger a Kafka event for the **Notification Service** to confirm submission.

**Response**:
```json
{
  "message": "Assignment submitted successfully"
}
```

---

## 8. GET /api/v1/assignments/:assignmentId/result
**Description**: Fetch the grade for a submitted assignment.

**Logic**:
- Validate the user and assignment.
- Fetch grade from the database.

**Response**:
```json
{
  "assignmentId": "assign-123",
  "grade": 88
}
```

---

# Assessment Service Workflow

## 1. **Assessment Creation Workflow**:
- Instructor creates a quiz or assignment.
- **Assessment Service** interacts with **Course Management Service** to verify the course.
- Assessment details are saved in the database, and a Kafka event is triggered to notify students.
  
## 2. **Assessment Submission Workflow**:
- Student submits responses via the **Assessment Service**.
- The system evaluates the responses or forwards subjective ones to the instructor for grading.
- The result is stored in the database, and Kafka notifies the student.

## 3. **Result Retrieval Workflow**:
- When a student or instructor requests the result, the **Assessment Service** retrieves it from the database, optionally using Redis for caching.

---

# Kafka in Assessment Service

Kafka can be used to decouple the microservices and handle the flow of events efficiently.

## **Kafka Topics**:
1. **Assessment-Creation**: Notifies the **Notification Service** when an assessment is created or updated.
2. **Submission-Completed**: Sent when a student submits an assessment or assignment, triggering a notification for the instructor.
3. **Grading-Completed**: After grading, Kafka sends an event to the **Notification Service** to inform the student about their result.

Kafka ensures loose coupling and scalability by decoupling services. Each event triggers subsequent processes without the services needing to wait for a synchronous response.
