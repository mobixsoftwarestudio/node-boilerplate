import { Router } from "express";
const router = Router();
import authRoutes from "./auth/routes";

router.use("/auth", authRoutes);

export default router;