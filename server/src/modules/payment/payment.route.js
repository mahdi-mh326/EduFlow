import express from "express";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { USER_ROLE } from "../user/user.constant.js";
import { PaymentController } from "./payment.controller.js";
import { PaymentValidation } from "./payment.validation.js";

const router = express.Router();

router.post("/success", PaymentController.paymentSuccess);
router.get("/success", PaymentController.paymentSuccess);
router.post("/fail", PaymentController.paymentFail);
router.get("/fail", PaymentController.paymentFail);
router.post("/cancel", PaymentController.paymentCancel);
router.get("/cancel", PaymentController.paymentCancel);
router.post("/ipn", PaymentController.paymentIpn);
router.get("/ipn", PaymentController.paymentIpn);

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

router.get(
  "/verify/:tranId",
  authenticate,
  PaymentController.getPaymentByTransactionId
);

router.get(
  "/:id",
  authenticate,
  PaymentController.getPaymentById
);

router.use(authenticate, authorize(USER_ROLE.ADMIN));

router.get("/", PaymentController.getPayments);

export default router;

