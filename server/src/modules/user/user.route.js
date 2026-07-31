import express from "express";
import authenticate from "../../middlewares/authenticate.js";
import { UserController } from "./user.controller.js";

const router = express.Router();

router.get("/me", authenticate, UserController.getMe);

export default router;
