// import { NextFunction } from "express";
// import { verifyAccessToken } from "../utils/token.js";

// interface AuthRequest extends Request {
//   user?: { id: string };
// }

// export const authMiddleware = (
//   req: AuthRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   const token = req.cookies.accessToken;
//   if (!token) return res.status(401).json({ message: "Unauthorized" });

//   try {
//     req.user = verifyAccessToken(token);
//     next();
//   } catch {
//     return res.status(401).json({ message: "Invalid or expired token" });
//   }
// };
