import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/prisma";

describe("POST /api/v1/auth/verify-otp", () => {
  const testEmail = "verifyuser@example.com";
  const validOtp = "123456";
  const expiredDate = new Date(Date.now() - 60 * 1000); // 1 min ago
  const futureDate = new Date(Date.now() + 10 * 60 * 1000); // 10 min later

  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
    // create test user
    await prisma.user.create({
      data: {
        email: testEmail,
        name: "Verify OTP user",
        passwordHash: "hashedpassword",
        providers: ["email"],
        verificationOtp: validOtp,
        otpExpiry: futureDate,
        emailVerified: false,
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
  });

  it("should verify user successfully with valid OTP", async () => {
    const res = await request(app)
      .post("/api/v1/auth/verify-otp")
      .send({ email: testEmail, otp: validOtp });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Email verified successfully");

    // Check database updated
    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    expect(user?.emailVerified).toBe(true);
    expect(user?.verificationOtp).toBeNull();
    expect(user?.otpExpiry).toBeNull();
  });

  it("should return 400 for invalid OTP", async () => {
    await prisma.user.update({
      where: { email: testEmail },
      data: {
        verificationOtp: validOtp,
        otpExpiry: futureDate,
        emailVerified: false,
      },
    });

    const res = await request(app)
      .post("/api/v1/auth/verify-otp")
      .send({ email: testEmail, otp: "111111" }); // trying with invalid OTP

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message", "Invalid OTP");
  });

  it("should return 400 if OTP expired", async () => {
    await prisma.user.update({
      where: { email: testEmail },
      data: {
        verificationOtp: validOtp,
        otpExpiry: expiredDate,
        emailVerified: false,
      },
    });

    const res = await request(app)
      .post("/api/v1/auth/verify-otp")
      .send({ email: testEmail, otp: validOtp });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message", "OTP expired");
  });

  it("should return 400 if user not found", async () => {
    const res = await request(app)
      .post("/api/v1/auth/verify-otp")
      .send({ email: "notfound@example.com", otp: validOtp });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message", "Bad request");
  });

  it("should return validation error if fields are missing", async () => {
    const res = await request(app).post("/api/v1/auth/verify-otp").send({});
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("errors");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paths = res.body.errors.map((e: any) => e.path[0]);
    expect(paths).toContain("email");
    expect(paths).toContain("otp");
  });

  it("should return validation error for invalid email format", async () => {
    const res = await request(app)
      .post("/api/v1/auth/verify-otp")
      .send({ email: "invalid-email", otp: "123456" });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0].message).toMatch(/Invalid email format/i);
  });

  it("should return validation error for invalid OTP format", async () => {
    const res = await request(app)
      .post("/api/v1/auth/verify-otp")
      .send({ email: testEmail, otp: "12ab56" });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0].message).toMatch(
      /OTP must contain only numbers/i,
    );
  });

  it("should return 500 on database failure", async () => {
    jest
      .spyOn(prisma.user, "findUnique")
      .mockRejectedValueOnce(new Error("DB connection failed"));

    const res = await request(app)
      .post("/api/v1/auth/verify-otp")
      .send({ email: testEmail, otp: validOtp });

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("message", "Internal server error");

    jest.restoreAllMocks();
  });
});
