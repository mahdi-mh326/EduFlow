import express from "express";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { USER_ROLE } from "../user/user.constant.js";
import { CertificateController } from "./certificate.controller.js";
import { CertificateValidation } from "./certificate.validation.js";

const router = express.Router();

// Public Verification Endpoint
router.get("/verify/:certificateNumber", CertificateController.verifyCertificate);

// Student Protected Endpoints
router.get(
  "/my-certificates",
  authenticate,
  authorize(USER_ROLE.STUDENT),
  CertificateController.getMyCertificates
);

router.get(
  "/class/:classId",
  authenticate,
  authorize(USER_ROLE.STUDENT),
  CertificateController.getCertificateByClass
);

router.get(
  "/progress/:classId",
  authenticate,
  authorize(USER_ROLE.STUDENT),
  CertificateController.getStudentProgress
);

router.post(
  "/claim",
  authenticate,
  authorize(USER_ROLE.STUDENT),
  validateRequest(CertificateValidation.generateCertificateSchema),
  CertificateController.claimCertificate
);

// Admin & Teacher Endpoints
router.get(
  "/",
  authenticate,
  authorize(USER_ROLE.ADMIN, USER_ROLE.TEACHER),
  CertificateController.getAllCertificates
);

export const CertificateRoutes = router;
