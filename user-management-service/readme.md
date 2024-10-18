# MoocFlix: User Management Service

The User Management Service is a microservice responsible for handling user authentication, authorization, and profile management for the MoocFlix platform.

## Table of Contents

- [MoocFlix: User Management Service](#moocflix-user-management-service)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Technologies](#technologies)
  - [Project Structure](#project-structure)
  - [Routes](#routes)
    - [User Routes](#user-routes)
    - [Profile Routes](#profile-routes)
  - [Environment Variables](#environment-variables)
  - [Setup and Installation](#setup-and-installation)
  - [Running Tests](#running-tests)
  - [Docker Setup](#docker-setup)
  - [Architecture](#architecture)
  - [Contributing](#contributing)
  - [License](#license)

## Features

1. **Authentication/Authorization**: Handle user sign-up, sign-in, and role management (students, instructors, admins) using JWT.
2. **Profile Management**: Allow users to create, view, and edit their profiles.
3. **Role-based Access**: Implement role-based permission control for students, instructors, and administrators.

## Technologies

- **Node.js**: JavaScript runtime environment.
- **Express**: Web framework for Node.js.
- **MongoDB**: NoSQL database.
- **Mongoose**: MongoDB object modeling tool.
- **JWT**: JSON Web Tokens for authentication.
- **KafkaJS**: Kafka client for Node.js.
- **Winston**: Logging library.
- **Helmet**: Security middleware for Express.
- **Cors**: Middleware for enabling CORS.
- **Bcrypt.js**: Library for hashing passwords.
- **Jest**: JavaScript testing framework.
- **Supertest**: Library for testing HTTP.

## Project Structure

```
user-management-service/
│
├── src/
│   ├── controllers/  # Handle HTTP requests (e.g., login, signup)
│   ├── models/       # Define User schema/model (e.g., MongoDB, SQL)
│   ├── utils/        # Business logic (authentication, token generation)
│   ├── routes/       # Define routes (e.g., /signup, /login)
│   └── middlewares/  # Middleware (authentication, role validation)
│
├── tests/            # Unit and integration tests
├── .env              # Environment configurations
├── package.json      # Dependencies and scripts (Node.js example)
└── Dockerfile        # Docker setup for deployment
```

## Routes

### User Routes

- `POST /api/v1/users/signup` - Register a new user
- `POST /api/v1/users/login` - Authenticate and log in a user
- `POST /api/v1/users/logout` - Log out a user

### Profile Routes

- `GET /api/v1/profile/profile` - Get current user's profile
- `PUT /api/v1/profile/update` - Update user profile (name, email, etc.)
- `DELETE /api/v1/profile/deactivate` - Deactivate user account

## Environment Variables

Create a `.env` file in the root directory and add the following:

```
MONGO_URI=<your_mongodb_uri>
JWT_SECRET=<your_jwt_secret>
KAFKAJS_NO_PARTITIONER_WARNING=1
```

## Setup and Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/user-management-service.git
   cd user-management-service
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Start the server:
   ```sh
   npm start
   ```

   For development:
   ```sh
   npm run dev
   ```

## Running Tests

To run tests, use the following command:

```sh
npm test
```

## Docker Setup

1. Build the Docker image:
   ```sh
   docker build -t user-management-service .
   ```

2. Run the Docker container:
   ```sh
   docker-compose up
   ```

## Architecture

<svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
  <rect x="50" y="50" width="200" height="100" fill="#f3f4f6" stroke="#000" />
  <text x="150" y="90" font-size="14" text-anchor="middle" fill="#000">Client</text>
  <text x="150" y="110" font-size="12" text-anchor="middle" fill="#000">(Browser)</text>

  <rect x="50" y="200" width="200" height="100" fill="#f3f4f6" stroke="#000" />
  <text x="150" y="240" font-size="14" text-anchor="middle" fill="#000">API Gateway</text>
  <text x="150" y="260" font-size="12" text-anchor="middle" fill="#000">(Nginx)</text>

  <rect x="300" y="50" width="200" height="100" fill="#f3f4f6" stroke="#000" />
  <text x="400" y="90" font-size="14" text-anchor="middle" fill="#000">User Management Service</text>
  <text x="400" y="110" font-size="12" text-anchor="middle" fill="#000">(Node.js, Express)</text>

  <rect x="300" y="200" width="200" height="100" fill="#f3f4f6" stroke="#000" />
  <text x="400" y="240" font-size="14" text-anchor="middle" fill="#000">MongoDB</text>
  <text x="400" y="260" font-size="12" text-anchor="middle" fill="#000">(Database)</text>

  <rect x="300" y="350" width="200" height="100" fill="#f3f4f6" stroke="#000" />
  <text x="400" y="390" font-size="14" text-anchor="middle" fill="#000">Kafka</text>
  <text x="400" y="410" font-size="12" text-anchor="middle" fill="#000">(Message Broker)</text>

  <line x1="150" y1="150" x2="150" y2="200" stroke="#000" />
  <line x1="150" y1="300" x2="400" y2="300" stroke="#000" />
  <line x1="400" y1="150" x2="400" y2="200" stroke="#000" />
  <line x1="400" y1="300" x2="400" y2="350" stroke="#000" />
</svg>

This diagram illustrates the high-level architecture of the User Management Service:
- The client browser interacts with the API Gateway (Nginx)
- The API Gateway routes requests to the User Management Service (Node.js/Express)
- The User Management Service interacts with MongoDB for data storage
- Kafka is used as a message broker for event-driven communication with other services

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License.