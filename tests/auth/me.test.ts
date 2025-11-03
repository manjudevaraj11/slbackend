import request from "supertest";
import app from "../../src/app";
import * as jwtUtils from "../../src/utils/token";

describe("GET /api/v1/auth/me", () => {
  const testUser = "vamshi.kr777@gmail.com";
  const testPassword = "vamshi123";

  let accessTokenCookie: string;
  let refreshTokenCookie: string;

  let testUserId: string;
  let testUserEmail: string;
  let testUserName: string;

  beforeAll(async () => {
    // Login first to get cookies
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: testUser, password: testPassword });

    expect(res.statusCode).toBe(200);

    const rawCookies = res.headers["set-cookie"];

    const cookies = Array.isArray(rawCookies) ? rawCookies : [];
    expect(cookies).toBeDefined();

    // Extract accessToken and refreshToken cookies
    accessTokenCookie = cookies.find((c: string) =>
      c.startsWith("accessToken"),
    );
    refreshTokenCookie = cookies.find((c: string) =>
      c.startsWith("refreshToken"),
    );
  });

  it("should return 200 and user info with valid tokens", async () => {
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", [accessTokenCookie, refreshTokenCookie]);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("user");
    expect(res.body.user).toHaveProperty("id");
    testUserId = res.body.user.id;
    expect(res.body.user).toHaveProperty("email", testUser);
    testUserEmail = res.body.user.email;
    expect(res.body.user).toHaveProperty("name");
    testUserName = res.body.user.name;
  });

  it("should return 400 if both cookies are missing", async () => {
    const res = await request(app).get("/api/v1/auth/me");
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("errors");
  });

  it("should return 401 if accessToken is missing", async () => {
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", [refreshTokenCookie]);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty(
      "message",
      "Access token missing, try refresh",
    );
  });

  it("should return 400 if refreshToken is missing", async () => {
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", [accessTokenCookie]);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("errors");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paths = res.body.errors.map((e: any) => e.path[0]);
    expect(paths).toContain("refreshToken");
  });

  it("should return 401 if accessToken is invalid", async () => {
    jest.spyOn(jwtUtils, "verifyAccessToken").mockImplementationOnce(() => {
      throw new Error("Invalid token");
    });

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", [`accessToken=invalidtoken`, refreshTokenCookie]);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty(
      "message",
      "Invalid or expired access token",
    );
  });

  it("should return 404 if user not found (in case user got deleted but access and refresh tokens being sent)", async () => {
    jest
      .spyOn(jwtUtils, "verifyAccessToken")
      .mockReturnValueOnce({ id: "nonexistent-id" });

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", [accessTokenCookie, refreshTokenCookie]);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("message", "User not found");
  });

  it("should return 200 with valid user info for valid tokens", async () => {
    jest
      .spyOn(jwtUtils, "verifyAccessToken")
      .mockReturnValueOnce({ id: testUserId });

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", [accessTokenCookie, refreshTokenCookie]);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("user");
    expect(res.body.user).toHaveProperty("id", testUserId);
    expect(res.body.user).toHaveProperty("name", testUserName);
    expect(res.body.user).toHaveProperty("email", testUserEmail);
  });
});
