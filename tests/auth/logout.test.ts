import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/prisma";

describe("POST /api/v1/auth/logout", () => {
  const testUserEmail = "vamshi.kr777@gmail.com";
  const testPassword = "vamshi123";

  let refreshTokenCookie: string;

  beforeAll(async () => {
    // Login to get refreshToken
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: testUserEmail, password: testPassword });

    const cookies = Array.isArray(res.headers["set-cookie"])
      ? res.headers["set-cookie"]
      : [];

    refreshTokenCookie = cookies.find((c: string) =>
      c.startsWith("refreshToken"),
    )!;
  });

  it("should logout successfully and clear cookies", async () => {
    const res = await request(app)
      .post("/api/v1/auth/logout")
      .set("Cookie", [refreshTokenCookie]);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Logged out");

    // Cookies cleared
    const cookies = res.headers["set-cookie"] || [];
    const cookieStr = Array.isArray(cookies) ? cookies.join("; ") : "";
    expect(cookieStr).toContain("accessToken=;"); // cleared
    expect(cookieStr).toContain("refreshToken=;"); // cleared
  });

  it("should return 400 if refreshToken is missing", async () => {
    const res = await request(app).post("/api/v1/auth/logout");
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("errors");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paths = res.body.errors.map((e: any) => e.path[0]);
    expect(paths).toContain("refreshToken");
  });

  it("should still succeed if refreshToken not found in DB", async () => {
    // Fake cookie that doesn't exist in DB
    const res = await request(app)
      .post("/api/v1/auth/logout")
      .set("Cookie", ["refreshToken=invalidRefreshToken"]);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Logged out");
  });

  it("should return 500 if DB update fails", async () => {
    // Mock prisma updateMany to throw
    jest.spyOn(prisma.user, "updateMany").mockImplementationOnce(() => {
      throw new Error("DB failure");
    });

    const res = await request(app)
      .post("/api/v1/auth/logout")
      .set("Cookie", [refreshTokenCookie]);

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("message", "Internal server error");
  });
});
