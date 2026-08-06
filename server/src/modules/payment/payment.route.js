import express from "express";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { USER_ROLE } from "../user/user.constant.js";
import { PaymentController } from "./payment.controller.js";
import { PaymentValidation } from "./payment.validation.js";

const router = express.Router();

router.post(
  "/initiate",
  authenticate,
  authorize(USER_ROLE.STUDENT),
  validateRequest(PaymentValidation.initiatePaymentSchema),
  PaymentController.initiatePayment
);

router.get(
  "/student/payments",
  authenticate,
  authorize(USER_ROLE.STUDENT),
  PaymentController.getStudentPayments
);

router.use(authenticate, authorize(USER_ROLE.ADMIN));

router.get("/", PaymentController.getPayments);

router.get("/:id", PaymentController.getPaymentById);

export default router;
