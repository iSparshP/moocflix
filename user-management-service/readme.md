MoocFlix: A mooc streaming platform
user-management-service is going to be a microservice which is going to carry out these tasks:
1. Authentication/Authorization: Handle user sign-up, sign-in, and role management (students, instructors, admins) using OAuth, JWT, or similar security standards.
2. Profile Management: Allow users to create, view, and edit their profiles.
3. Role-based Access: Implement role-based permission control for students, instructors, and administrators​

the structure is going to look like this:
/user-management-service
│
├── /src
│   ├── /controllers         # Handle HTTP requests (e.g., login, signup)
│   ├── /models              # Define User schema/model (e.g., MongoDB, SQL)
│   ├── /utils               # Business logic (authentication, token generation)
│   ├── /routes              # Define routes (e.g., /signup, /login)
│   └── /middlewares         # Middleware (authentication, role validation)
│
├── /.env                    # Environment configurations
├── /tests                   # Unit and integration tests
├── package.json             # Dependencies and scripts (Node.js example)
└── Dockerfile               # Docker setup for deployment


these are going to be the routes:
POST   /api/v1/users/signup          // Register a new user
POST   /api/v1/users/login           // Authenticate and log in a user
POST   /api/v1/users/logout          // Log out a user
GET    /api/v1/users/profile         // Get current user's profile
PUT    /api/v1/users/profile/update  // Update user profile (name, email, etc.)
DELETE /api/v1/users/deactivate      // Deactivate user account



