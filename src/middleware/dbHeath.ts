import { Request, Response, Router } from "express";
import prisma from "../prisma.js";

const router = Router();

router.get("/health", async (req: Request, res: Response) => {
  try {
    console.log("runnig-health");
    await prisma.$queryRaw`SELECT 1`; // ping DB
    res.status(200).json({ status: "ok" });
  } catch (err) {
    res.status(500).json({ status: "error", error: (err as Error).message });
  }
});

export default router;
