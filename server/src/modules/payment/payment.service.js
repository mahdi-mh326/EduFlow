import mongoose from "mongoose";
import Payment from "./payment.model.js";
import User from "../user/user.model.js";
import Course from "../course/course.model.js";
import Class from "../class/class.model.js";
import Enrollment from "../enrollment/enrollment.model.js";
import ApiError from "../../shared/ApiError.js";
import { USER_ROLE, USER_STATUS } from "../user/user.constant.js";
import { COURSE_STATUS } from "../course/course.constant.js";
import { CLASS_STATUS } from "../class/class.constant.js";
import { ENROLLMENT_STATUS } from "../enrollment/enrollment.constant.js";
import { PAYMENT_MESSAGES, PAYMENT_STATUS, PAYMENT_GATEWAY } from "./payment.constant.js";
import { PaymentUtils } from "./payment.utils.js";

const validateStudent = async (studentId) => {
  const student = await User.findOne({
    _id: studentId,
    role: USER_ROLE.STUDENT,
    isDeleted: { $ne: true },
    isVerified: true,
  });

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  return student;
};

const validateCourse = async (courseId) => {
  const course = await Course.findOne({
    _id: courseId,
    isDeleted: { $ne: true },
    status: COURSE_STATUS.PUBLISHED,
  });

  if (!course) {
    throw new ApiError(404, PAYMENT_MESSAGES.DELETED_COURSE);
  }

  return course;
};

const validateClass = async (classId) => {
  const cls = await Class.findOne({
    _id: classId,
    isDeleted: { $ne: true },
    status: { $in: [CLASS_STATUS.UPCOMING, CLASS_STATUS.ONGOING] },
  });

  if (!cls) {
    throw new ApiError(404, "Class not found");
  }

  return cls;
};

const checkExistingEnrollment = async (studentId, courseId) => {
  const enrollment = await Enrollment.findOne({
    studentId,
    courseId,
    status: ENROLLMENT_STATUS.ACTIVE,
    isDeleted: { $ne: true },
  });

  if (enrollment) {
    throw new ApiError(400, PAYMENT_MESSAGES.ALREADY_ENROLLED);
  }
};

const checkExistingPaidPayment = async (studentId, courseId) => {
  const paidPayment = await Payment.findOne({
    studentId,
    courseId,
    status: PAYMENT_STATUS.PAID,
    isDeleted: { $ne: true },
  });

  if (paidPayment) {
    throw new ApiError(400, PAYMENT_MESSAGES.ALREADY_PAID);
  }
};

const initiatePayment = async (payload, createdBy) => {
  const { courseId, classId } = payload;

  const student = await validateStudent(createdBy);
  const course = await validateCourse(courseId);
  const cls = await validateClass(classId);

  await checkExistingEnrollment(createdBy, courseId);
  await checkExistingPaidPayment(createdBy, courseId);

  if (!course.price || course.price <= 0) {
    throw new ApiError(400, PAYMENT_MESSAGES.INVALID_AMOUNT);
  }

  const existingPendingPayment = await Payment.findOne({
    studentId: createdBy,
    courseId,
    status: PAYMENT_STATUS.PENDING,
    isDeleted: { $ne: true },
  });

  let payment;
  if (existingPendingPayment) {
    payment = existingPendingPayment;
  } else {
    const transactionId = PaymentUtils.generateTransactionId();

    payment = await Payment.create({
      studentId: createdBy,
      courseId,
      classId,
      amount: course.price,
      currency: "BDT",
      gateway: PAYMENT_GATEWAY.SSLCOMMERZ,
      transactionId,
      status: PAYMENT_STATUS.PENDING,
      createdBy: createdBy,
    });
  }

  const sslResponse = await PaymentUtils.initiateSslCommerzPayment({
    amount: payment.amount,
    currency: payment.currency,
    transactionId: payment.transactionId,
    successUrl: `${process.env.CLIENT_URL}/payment/success`,
    failUrl: `${process.env.CLIENT_URL}/payment/fail`,
    cancelUrl: `${process.env.CLIENT_URL}/payment/cancel`,
    ipnUrl: `${process.env.CLIENT_URL}/api/v1/payments/ipn`,
    productName: course.title,
    productCategory: "Course",
    productProfile: "education",
    customerName: student.fullName,
    customerEmail: student.email,
    customerPhone: student.phone,
    customerAddress: "",
  });

  if (!sslResponse || sslResponse.status !== "SUCCESS") {
    throw new ApiError(400, PAYMENT_MESSAGES.INVALID_SSL_RESPONSE);
  }

  await Payment.findByIdAndUpdate(payment._id, {
    sslSessionKey: sslResponse.sessionkey,
    gatewayResponse: sslResponse,
  });

  return {
    paymentId: payment._id,
    transactionId: payment.transactionId,
    gatewayUrl: sslResponse.GatewayPageURL,
  };
};

const getStudentPayments = async (studentId) => {
  const payments = await Payment.find({
    studentId,
    isDeleted: { $ne: true },
  })
    .populate("courseId", "title slug thumbnail price")
    .populate("classId", "batchName startDate endDate")
    .sort({ createdAt: -1 });

  return payments;
};

const getPayments = async (query) => {
  const {
    page = 1,
    limit = 10,
    courseId,
    teacherId,
    studentId,
    status,
    sortBy = "newest",
    sortOrder = "desc",
  } = query;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const filter = { isDeleted: { $ne: true } };

  if (courseId) filter.courseId = courseId;
  if (studentId) filter.studentId = studentId;
  if (status) filter.status = status;

  let sort = {};
  switch (sortBy) {
    case "amount":
      sort = { amount: sortOrder === "asc" ? 1 : -1 };
      break;
    case "date":
      sort = { createdAt: sortOrder === "asc" ? 1 : -1 };
      break;
    case "newest":
    default:
      sort = { createdAt: sortOrder === "asc" ? 1 : -1 };
      break;
  }

  const [countResult, payments] = await Promise.all([
    Payment.countDocuments(filter),
    Payment.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate("studentId", "fullName email phone")
      .populate("courseId", "title slug price")
      .populate("classId", "batchName startDate endDate"),
  ]);

  const total = countResult;
  const totalPages = Math.ceil(total / limitNum);

  return {
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    },
    payments,
  };
};

const getPaymentById = async (id) => {
  const payment = await Payment.findOne({
    _id: id,
    isDeleted: { $ne: true },
  })
    .populate("studentId", "fullName email phone")
    .populate("courseId", "title slug price")
    .populate("classId", "batchName startDate endDate");

  if (!payment) {
    throw new ApiError(404, PAYMENT_MESSAGES.PAYMENT_NOT_FOUND);
  }

  return payment;
};

export const PaymentService = {
  initiatePayment,
  getStudentPayments,
  getPayments,
  getPaymentById,
};
