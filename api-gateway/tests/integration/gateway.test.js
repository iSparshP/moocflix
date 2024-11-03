const request = require("supertest");
const app = "http://localhost:8000";

describe("API Gateway Integration Tests", () => {
  test("Health Check", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
  });

  // Add more test cases
});

describe("Service Health Checks", () => {
  test("User Service", async () => {
    const response = await request(app).get("/api/v1/users/health");
    expect(response.status).toBe(200);
  });

  test("Course Service", async () => {
    const response = await request(app).get("/api/v1/courses/health");
    expect(response.status).toBe(200);
  });
});

describe("Authentication", () => {
  test("JWT Protection", async () => {
    const response = await request(app).get("/api/v1/users/profile");
    expect(response.status).toBe(401);
  });
});
