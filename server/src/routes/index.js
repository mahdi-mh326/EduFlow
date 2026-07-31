import express from "express";

import authRoutes from "../modules/auth/auth.route.js";
import userRoutes from "../modules/user/user.route.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);

export default router;
