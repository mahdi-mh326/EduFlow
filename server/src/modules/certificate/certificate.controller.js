import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import { CertificateService } from "./certificate.service.js";

const claimCertificate = catchAsync(async (req, res) => {
  const studentId = req.user._id;
  const { classId } = req.body;
  const certificate = await CertificateService.generateCertificate(studentId, classId);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Certificate generated successfully.",
    data: certificate,
  });
});

const getMyCertificates = catchAsync(async (req, res) => {
  const studentId = req.user._id;
  const certificates = await CertificateService.getMyCertificates(studentId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Certificates retrieved successfully.",
    data: certificates,
  });
});

const getCertificateByClass = catchAsync(async (req, res) => {
  const studentId = req.user._id;
  const { classId } = req.params;
  const certificate = await CertificateService.getCertificateByClass(studentId, classId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Class certificate retrieved successfully.",
    data: certificate,
  });
});

const getStudentProgress = catchAsync(async (req, res) => {
  const studentId = req.user._id;
  const { classId } = req.params;
  const progress = await CertificateService.calculateStudentProgress(studentId, classId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Class progress retrieved successfully.",
    data: progress,
  });
});

const verifyCertificate = catchAsync(async (req, res) => {
  const { certificateNumber } = req.params;
  const result = await CertificateService.verifyCertificate(certificateNumber);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Certificate verified successfully.",
    data: result,
  });
});

const getAllCertificates = catchAsync(async (req, res) => {
  const certificates = await CertificateService.getAllCertificates(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "All certificates retrieved successfully.",
    data: certificates,
  });
});

export const CertificateController = {
  claimCertificate,
  getMyCertificates,
  getCertificateByClass,
  getStudentProgress,
  verifyCertificate,
  getAllCertificates,
};
