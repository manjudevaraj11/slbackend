import jwt, { SignOptions } from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// Helper to loads vars
function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is not defined`);
  }
  return value;
}

// Get secrets safely
const accessTokenSecret = getEnvVar("ACCESS_TOKEN_SECRET");
const refreshTokenSecret = getEnvVar("REFRESH_TOKEN_SECRET");
const accessTokenExpiry = getEnvVar("ACCESS_TOKEN_EXPIRY");
const refreshTokenExpiry = getEnvVar("REFRESH_TOKEN_EXPIRY");

interface JwtPayload {
  id: string | number;
}

export function generateAccessToken(user: { id: string | number }): string {
  const payload: JwtPayload = { id: user.id };

  const options: SignOptions = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expiresIn: accessTokenExpiry as any,
  };

  return jwt.sign(payload, accessTokenSecret, options);
}

export function generateRefreshToken(user: { id: string | number }): string {
  const payload: JwtPayload = { id: user.id };

  const options: SignOptions = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expiresIn: refreshTokenExpiry as any,
  };

  return jwt.sign(payload, refreshTokenSecret, options);
}

export function verifyAccessToken(token: string): { id: string } {
  return jwt.verify(token, accessTokenSecret) as {
    id: string;
  };
}

export function verifyRefreshToken(token: string): { id: string } {
  return jwt.verify(token, refreshTokenSecret) as {
    id: string;
  };
}
