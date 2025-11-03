import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/prisma";

describe("POST /api/v1/auth/verify-user", () => {
  const testEmail = "vamshi.kr777@gmail.com";

  //   beforeAll(async () => {
  //     // Ensure test user exists
  //     await prisma.user.create({
  //       data: {
  //         id: "test-id-123",
  //         name: "Test User",
  //         email: testEmail,
  //         passwordHash: "hashedpassword",
  //         googleId: "",
  //         providers: ["email"],
  //         profilePic: "",
  //         refreshToken: "",
  //       },
  //     });
  //   });

  //   afterAll(async () => {
  //     // Cleanup test user
  //     await prisma.user.deleteMany({ where: { email: testEmail } });
  //     await prisma.$disconnect();
  //   });

  it("should return provider and username for a valid email", async () => {
    const res = await request(app)
      .post("/api/v1/auth/verify-user")
      .send({ email: testEmail });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("provider");
    expect(Array.isArray(res.body.provider)).toBe(true);
    const allowedProviders = ["email", "google", "linkedin"];
    const hasValidProvider = res.body.provider.some((p: string) =>
      allowedProviders.includes(p),
    );
    expect(hasValidProvider).toBe(true);
    expect(res.body).toHaveProperty("userName");
    expect(res.body.userName).toEqual(expect.any(String));
  });

  it("should return 400 for invalid email format", async () => {
    const res = await request(app)
      .post("/api/v1/auth/verify-user")
      .send({ email: "invalid-email" });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].path).toContain("email");
    expect(res.body.errors[0].message).toMatch(/invalid email/i);
  });

  it("should return 400 if email not found", async () => {
    const res = await request(app)
      .post("/api/v1/auth/verify-user")
      .send({ email: "notfound@example.com" });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message", "Bad request");
  });

  it("should return 400 if email is missing", async () => {
    const res = await request(app).post("/api/v1/auth/verify-user").send({});

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].path).toContain("email");
  });

  it("should handle server errors gracefully", async () => {
    // Mock prisma to throw
    jest
      .spyOn(prisma.user, "findUnique")
      .mockRejectedValue(new Error("Database connection failed"));

    const res = await request(app)
      .post("/api/v1/auth/verify-user")
      .send({ email: testEmail });

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("message", "Internal Server Error");
  });
});
