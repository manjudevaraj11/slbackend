import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/prisma";

describe("POST /api/v1/auth/login", () => {
  it("should login successfully with valid credentials", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "vamshi.kr777@gmail.com", password: "vamshi123" });

    expect(res.statusCode).toBe(200);

    expect(res.body).toHaveProperty("message", "Logged in");
    expect(res.body).toHaveProperty("user");
    expect(res.body.user).toHaveProperty("id");
    expect(res.body.user).toHaveProperty("email", "vamshi.kr777@gmail.com");
  });

  it("should login successfully with valid credentials and response should have cookies", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "vamshi.kr777@gmail.com", password: "vamshi123" });

    expect(res.statusCode).toBe(200);

    expect(res.body).toHaveProperty("message", "Logged in");
    expect(res.body).toHaveProperty("user");
    expect(res.body.user).toHaveProperty("id");
    expect(res.body.user).toHaveProperty("email", "vamshi.kr777@gmail.com");

    const rawCookies = res.headers["set-cookie"];
    // console.log("rawCookies--", rawCookies, Array.isArray(rawCookies));
    const cookies = Array.isArray(rawCookies) ? rawCookies : [];

    expect(cookies).toBeDefined();
    expect(Array.isArray(cookies)).toBe(true);

    const cookieStr = cookies.join("| ");
    // console.log("cookieStr: ", cookieStr);

    expect(cookieStr).toContain("accessToken=");
    expect(cookieStr).toContain("refreshToken=");
  });

  it("should return 401 for invalid credentials(wrong password)", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "vamshi.kr777@gmail.com", password: "wrongpassword" });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/invalid/i);
  });

  it("should return 400 if email is invalid", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "invalid-email", password: "12345678" });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Validation failed/i);
  });

  it("should return 401 if password is too short and invalid", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "test@gmail.com", password: "1234" });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/Invalid credentials/i);
  });

  it("should return 400 if both email and password is invalid", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "invalid-email", password: "1234" });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Validation failed/i);
  });

  it("should return 400 if email is missing", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ password: "password123" });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/validation failed/i);
  });

  it("should return 400 if password is missing", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "test@gmail.com" });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/validation failed/i);
  });

  it("should return 400 if both fields are missing", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/validation failed/i);
  });

  describe("POST /api/v1/auth/login", () => {
    it("should handle server errors gracefully", async () => {
      const mock = jest
        .spyOn(prisma.user, "findUnique")
        .mockRejectedValue(new Error("Database connection failed"));

      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "vamshi.kr777@gmail.com", password: "vamshi123" });

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toMatch(/Internal server error/i);

      mock.mockRestore();
    });
  });
});
