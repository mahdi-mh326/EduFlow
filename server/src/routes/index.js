import express from "express";

import authRoutes from "../modules/auth/auth.route.js";

const router = express.Router();

router.use("/auth", authRoutes);

export default router;