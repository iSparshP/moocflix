# MoocFlix Microservices Architecture

## Overview

MoocFlix is a microservices-based platform for online courses. The architecture consists of several microservices, each responsible for a specific domain. These services communicate with each other using REST APIs and Kafka for asynchronous messaging.

## Microservices

### 1. User Management Service

- **Purpose**: Handles user authentication, authorization, and profile management.
- **Routes**:
  - `POST /api/v1/users/signup`: Register a new user
  - `POST /api/v1/users/login`: Authenticate and log in a user
  - `POST /api/v1/users/logout`: Log out a user
  - `GET /api/v1/users/profile`: Get current user's profile
  - `PUT /api/v1/users/profile/update`: Update user profile (name, email, etc.)
  - `DELETE /api/v1/users/deactivate`: Deactivate user account

### 2. Course Management Service

- **Purpose**: Manages courses, modules, and student enrollments.
- **Routes**:
  - `POST /api/v1/courses`: Create a new course
  - `PUT /api/v1/courses/:id`: Update a course
  - `GET /api/v1/courses/:id`: Get course details
  - `DELETE /api/v1/courses/:id`: Delete a course
  - `GET /api/v1/courses`: List all courses
  - `POST /api/v1/courses/:id/enroll`: Enroll a student in a course
  - `GET /api/v1/courses/:id/modules`: Get course modules
  - `POST /api/v1/courses/:id/modules`: Create a course module
  - `PUT /api/v1/courses/:id/modules/:moduleId`: Update a course module
  - `DELETE /api/v1/courses/:id/modules/:moduleId`: Delete a course module

### 3. Content Delivery Service

- **Purpose**: Manages video uploads, streaming, and transcoding.
- **Routes**:
  - `POST /api/v1/content/upload`: Upload a video
  - `POST /api/v1/content/:videoId/transcode`: Request video transcoding

### 4. Assessment Service

- **Purpose**: Manages quizzes and assignments.
- **Routes**:
  - `POST /api/v1/assessments`: Create a new assessment
  - `GET /api/v1/assessments/:id`: Get assessment details
  - `POST /api/v1/assessments/:id/submit`: Submit an assessment
  - `GET /api/v1/assessments/:id/results`: Get assessment results

## Kafka Integration

### Kafka Topics

- **User Management Service**:
  - `User-Creation`: Notify other services when a new user is created.
  - `User-Update`: Notify other services when a user profile is updated.

- **Course Management Service**:
  - `Course-Creation`: Notify other services when a new course is created.
  - `Course-Update`: Notify other services when a course is updated.
  - `Course-Deletion`: Notify other services when a course is deleted.
  - `Student-Enrolled`: Notify other services when a student is enrolled in a course.

- **Content Delivery Service**:
  - `Transcoding-Request`: Request video transcoding.
  - `Transcoding-Completed`: Notify other services when transcoding is completed.

- **Assessment Service**:
  - `Assessment-Creation`: Notify students when a new assessment is created.
  - `Submission-Completed`: Notify instructors when a student submits an assessment.
  - `Grading-Completed`: Notify students when grading is completed.

### Kafka Producer and Consumer Architecture

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect x="10" y="10" width="580" height="380" fill="#f0f0f0" stroke="#000000" stroke-width="2"/>
  <text x="300" y="40" font-family="Arial" font-size="24" text-anchor="middle">Kafka Topics</text>
  
  <!-- User Management Topics -->
  <rect x="50" y="80" width="200" height="60" fill="#ff9999" stroke="#000000" stroke-width="2"/>
  <text x="150" y="110" font-family="Arial" font-size="14" text-anchor="middle">User-Creation</text>
  <rect x="50" y="150" width="200" height="60" fill="#ff9999" stroke="#000000" stroke-width="2"/>
  <text x="150" y="180" font-family="Arial" font-size="14" text-anchor="middle">User-Update</text>
  
  <!-- Course Management Topics -->
  <rect x="350" y="80" width="200" height="60" fill="#99ff99" stroke="#000000" stroke-width="2"/>
  <text x="450" y="110" font-family="Arial" font-size="14" text-anchor="middle">Course-Creation</text>
  <rect x="350" y="150" width="200" height="60" fill="#99ff99" stroke="#000000" stroke-width="2"/>
  <text x="450" y="180" font-family="Arial" font-size="14" text-anchor="middle">Course-Update</text>
  
  <!-- Content Delivery Topics -->
  <rect x="50" y="220" width="200" height="60" fill="#9999ff" stroke="#000000" stroke-width="2"/>
  <text x="150" y="250" font-family="Arial" font-size="14" text-anchor="middle">Transcoding-Request</text>
  
  <!-- Assessment Topics -->
  <rect x="350" y="220" width="200" height="60" fill="#ffff99" stroke="#000000" stroke-width="2"/>
  <text x="450" y="250" font-family="Arial" font-size="14" text-anchor="middle">Assessment-Creation</text>
  <rect x="350" y="290" width="200" height="60" fill="#ffff99" stroke="#000000" stroke-width="2"/>
  <text x="450" y="320" font-family="Arial" font-size="14" text-anchor="middle">Submission-Completed</text>
</svg>

#### User Management Service

- **Producer**: Sends messages to `User-Creation` and `User-Update` topics.
- **Consumer**: Listens to relevant topics for user-related events.

#### Course Management Service

- **Producer**: Sends messages to `Course-Creation`, `Course-Update`, `Course-Deletion`, and `Student-Enrolled` topics.
- **Consumer**: Listens to relevant topics for course-related events.

#### Content Delivery Service

- **Producer**: Sends messages to `Transcoding-Request` topic.
- **Consumer**: Listens to `Transcoding-Completed` topic.

#### Assessment Service

- **Producer**: Sends messages to `Assessment-Creation`, `Submission-Completed`, and `Grading-Completed` topics.
- **Consumer**: Listens to relevant topics for assessment-related events.

## Workflow

### User Registration and Authentication

1. **User Management Service**:
   - User signs up via `POST /api/v1/users/signup`.
   - Service creates a new user and sends a message to `User-Creation` topic.
   - Other services consume the message and update their records accordingly.

2. **User Login**:
   - User logs in via `POST /api/v1/users/login`.
   - Service authenticates the user and returns a JWT token.

### Course Creation and Enrollment

1. **Course Management Service**:
   - Instructor creates a course via `POST /api/v1/courses`.
   - Service creates the course and sends a message to `Course-Creation` topic.
   - Other services consume the message and update their records accordingly.

2. **Student Enrollment**:
   - Student enrolls in a course via `POST /api/v1/courses/:id/enroll`.
   - Service enrolls the student and sends a message to `Student-Enrolled` topic.
   - Other services consume the message and update their records accordingly.

### Video Upload and Transcoding

1. **Content Delivery Service**:
   - User uploads a video via `POST /api/v1/content/upload`.
   - Service uploads the video to S3 and saves metadata to PostgreSQL.
   - User requests transcoding via `POST /api/v1/content/:videoId/transcode`.
   - Service sends a message to `Transcoding-Request` topic.
   - Transcoding service consumes the message, processes the video, and sends a message to `Transcoding-Completed` topic.
   - Content Delivery Service consumes the message and updates the video status.

### Assessment Creation and Submission

1. **Assessment Service**:
   - Instructor creates an assessment via `POST /api/v1/assessments`.
   - Service creates the assessment and sends a message to `Assessment-Creation` topic.
   - Notification service consumes the message and notifies students.

2. **Assessment Submission**:
   - Student submits an assessment via `POST /api/v1/assessments/:id/submit`.
   - Service processes the submission and sends a message to `Submission-Completed` topic.
   - Notification service consumes the message and notifies the instructor.

3. **Grading**:
   - Instructor grades the assessment.
   - Service sends a message to `Grading-Completed` topic.
   - Notification service consumes the message and notifies the student.

## Conclusion

This documentation provides an overview of the MoocFlix microservices architecture, including the routes, workflows, and Kafka integration. Each service is responsible for a specific domain and communicates with other services using REST APIs and Kafka for asynchronous messaging. This architecture ensures scalability, maintainability, and loose coupling between services.