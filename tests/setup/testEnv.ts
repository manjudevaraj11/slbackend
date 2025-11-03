import { execSync } from "child_process";
import prisma from "../../src/prisma";

beforeAll(async () => {
  // Run migrations on the test DB
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
});

beforeEach(async () => {
  // Clean up relevant tables
  //   await prisma.user.deleteMany({});
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});
