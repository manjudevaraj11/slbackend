import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/prisma";
import * as emailUtils from "../../src/services/EmailServiceTesting";

describe("POST /api/v1/auth/register", () => {
  const endpoint = "/api/v1/auth/register";

  const baseBody = {
    email: "registeruser@example.com",
    password: "password123",
    name: "Test Register User",
    phoneNumber: "+918934567890",
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if email is invalid", async () => {
    const res = await request(app)
      .post(endpoint)
      .send({ ...baseBody, email: "invalid-email" });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0].path).toContain("email");
  });

  it("should return 400 if password is too short", async () => {
    const res = await request(app)
      .post(endpoint)
      .send({ ...baseBody, password: "123" });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0].path).toContain("password");
  });

  it("should return 400 if name is missing", async () => {
    const res = await request(app)
      .post(endpoint)
      .send({ ...baseBody, name: "" });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0].path).toContain("name");
  });

  it("should pass if phoneNumber is omitted", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn(prisma.user, "findUnique").mockResolvedValueOnce(null as any); // we are going to resolve this will user being null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn(prisma.user, "create").mockResolvedValueOnce({ id: "1" } as any); // we create new user and send back object

    const res = await request(app).post(endpoint).send({
      email: baseBody.email,
      password: baseBody.password,
      name: baseBody.name,
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toMatch(/User registered/i);
  });

  it("should return 400 if phoneNumber is invalid", async () => {
    const res = await request(app)
      .post(endpoint)
      .send({ ...baseBody, phoneNumber: "12345" });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0].path).toContain("phoneNumber");
  });

  it("should return 400 if email already exists and verified", async () => {
    jest.spyOn(prisma.user, "findUnique").mockResolvedValueOnce({
      email: baseBody.email,
      emailVerified: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const res = await request(app).post(endpoint).send(baseBody);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Email already registered");
  });

  it("should update user and resend OTP if email exists but not verified", async () => {
    jest.spyOn(prisma.user, "findUnique").mockResolvedValueOnce({
      email: baseBody.email,
      emailVerified: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const updateSpy = jest
      .spyOn(prisma.user, "update")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockResolvedValueOnce({ id: "1" } as any);

    jest.spyOn(emailUtils, "sendTestEmail").mockResolvedValueOnce(undefined);

    const res = await request(app).post(endpoint).send(baseBody);

    expect(updateSpy).toHaveBeenCalledWith({
      where: { email: baseBody.email },
      data: expect.objectContaining({
        name: baseBody.name,
        providers: { set: ["email"] },
        passwordHash: expect.any(String),
        verificationOtp: expect.any(String),
        otpExpiry: expect.any(Date),
      }),
    });
    expect(emailUtils.sendTestEmail).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/OTP resent/i);
  });

  it("should create a new user if email not found", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn(prisma.user, "findUnique").mockResolvedValueOnce(null as any);
    const createSpy = jest
      .spyOn(prisma.user, "create")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockResolvedValueOnce({ id: "1" } as any);

    const res = await request(app).post(endpoint).send(baseBody);

    expect(createSpy).toHaveBeenCalled();
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toMatch(/User registered/i);
  });

  it("should handle internal server errors", async () => {
    jest
      .spyOn(prisma.user, "findUnique")
      .mockRejectedValueOnce(new Error("DB error"));

    const res = await request(app).post(endpoint).send(baseBody);

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe("Internal server error");
  });
});
