import mongoose from "mongoose";
import Quiz from "./quiz.model.js";
import Question from "./question.model.js";
import QuizAttempt from "./attempt.model.js";
import Enrollment from "../enrollment/enrollment.model.js";
import User from "../user/user.model.js";
import ApiError from "../../shared/ApiError.js";
import { USER_ROLE, USER_STATUS } from "../user/user.constant.js";
import { ENROLLMENT_STATUS, PAYMENT_STATUS as ENROLLMENT_PAYMENT_STATUS } from "../enrollment/enrollment.constant.js";
import { QUIZ_STATUS, QUIZ_MESSAGES } from "./quiz.constant.js";
import { ATTEMPT_STATUS, ATTEMPT_MESSAGES } from "./attempt.constant.js";

const validateQuiz = async (quizId) => {
  const quiz = await Quiz.findOne({
    _id: quizId,
    isDeleted: { $ne: true },
  });

  if (!quiz) {
    throw new ApiError(404, QUIZ_MESSAGES.QUIZ_NOT_FOUND);
  }

  return quiz;
};

const validateStudentEligibility = async (studentId, quiz) => {
  const student = await User.findOne({
    _id: studentId,
    role: USER_ROLE.STUDENT,
    status: USER_STATUS.ACTIVE,
    isDeleted: { $ne: true },
  });

  if (!student) {
    throw new ApiError(404, ATTEMPT_MESSAGES.UNAUTHORIZED_STUDENT);
  }

  const enrolled = await Enrollment.findOne({
    studentId,
    classId: quiz.classId,
    status: ENROLLMENT_STATUS.ACTIVE,
    paymentStatus: ENROLLMENT_PAYMENT_STATUS.PAID,
    isDeleted: { $ne: true },
  });

  if (!enrolled) {
    throw new ApiError(403, ATTEMPT_MESSAGES.UNAUTHORIZED_STUDENT);
  }

  return { student, enrollment: enrolled };
};

const startAttempt = async (quizId, studentId) => {
  const quiz = await validateQuiz(quizId);

  if (quiz.status !== QUIZ_STATUS.PUBLISHED) {
    throw new ApiError(403, QUIZ_MESSAGES.UNAUTHORIZED_TEACHER);
  }

  const now = new Date();
  if (now < quiz.startDate) {
    throw new ApiError(400, ATTEMPT_MESSAGES.QUIZ_NOT_STARTED);
  }

  if (now > quiz.endDate) {
    throw new ApiError(400, ATTEMPT_MESSAGES.QUIZ_EXPIRED);
  }

  await validateStudentEligibility(studentId, quiz);

  const existingAttempt = await QuizAttempt.findOne({
    quizId,
    studentId,
    status: ATTEMPT_STATUS.IN_PROGRESS,
    isDeleted: { $ne: true },
  });

  if (existingAttempt) {
    if (new Date() > existingAttempt.expiresAt) {
      existingAttempt.status = ATTEMPT_STATUS.EXPIRED;
      await existingAttempt.save();
    } else {
      return { attempt: existingAttempt, isNew: false };
    }
  }

  const attemptCount = await QuizAttempt.countDocuments({
    quizId,
    studentId,
    isDeleted: { $ne: true },
  });

  if (attemptCount >= quiz.attemptLimit) {
    throw new ApiError(409, ATTEMPT_MESSAGES.ATTEMPT_LIMIT_EXCEEDED);
  }

  const startedAt = new Date();
  const expiresAt = new Date(Math.min(startedAt.getTime() + quiz.durationMinutes * 60 * 1000, quiz.endDate.getTime()));

  const attempt = await QuizAttempt.create({
    quizId,
    studentId,
    attemptNumber: attemptCount + 1,
    startedAt,
    expiresAt,
    status: ATTEMPT_STATUS.IN_PROGRESS,
    totalMarks: quiz.totalMarks,
    createdBy: studentId,
  });

  return { attempt, isNew: true };
};

const getCurrentAttempt = async (quizId, studentId) => {
  const quiz = await validateQuiz(quizId);

  if (quiz.status !== QUIZ_STATUS.PUBLISHED) {
    throw new ApiError(403, QUIZ_MESSAGES.UNAUTHORIZED_TEACHER);
  }

  await validateStudentEligibility(studentId, quiz);

  const attempt = await QuizAttempt.findOne({
    quizId,
    studentId,
    status: ATTEMPT_STATUS.IN_PROGRESS,
    isDeleted: { $ne: true },
  }).sort({ startedAt: -1 });

  if (!attempt) {
    throw new ApiError(404, ATTEMPT_MESSAGES.ATTEMPT_NOT_FOUND);
  }

  if (new Date() > attempt.expiresAt) {
    attempt.status = ATTEMPT_STATUS.EXPIRED;
    await attempt.save();
    throw new ApiError(400, ATTEMPT_MESSAGES.ATTEMPT_EXPIRED);
  }

  return attempt;
};

const getMyAttempts = async (quizId, studentId) => {
  const quiz = await validateQuiz(quizId);

  if (quiz.status !== QUIZ_STATUS.PUBLISHED) {
    throw new ApiError(403, QUIZ_MESSAGES.UNAUTHORIZED_TEACHER);
  }

  await validateStudentEligibility(studentId, quiz);

  const attempts = await QuizAttempt.find({
    quizId,
    studentId,
    isDeleted: { $ne: true },
  })
    .sort({ startedAt: -1 })
    .select("-isDeleted -deletedAt");

  return attempts;
};

const gradeSubmission = async (answers, questions) => {
  let score = 0;
  const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

  for (const answer of answers) {
    const question = questionMap.get(answer.questionId);
    if (question && question.correctAnswer === answer.selectedOption) {
      score += question.marks;
    }
  }

  const percentage = Math.round((score / questions.reduce((sum, q) => sum + q.marks, 0)) * 100);

  return { score, percentage };
};

const submitAttempt = async (quizId, attemptId, payload, studentId) => {
  const quiz = await validateQuiz(quizId);

  if (quiz.status !== QUIZ_STATUS.PUBLISHED) {
    throw new ApiError(403, QUIZ_MESSAGES.UNAUTHORIZED_TEACHER);
  }

  await validateStudentEligibility(studentId, quiz);

  const attempt = await QuizAttempt.findOne({
    _id: attemptId,
    quizId,
    studentId,
    isDeleted: { $ne: true },
  });

  if (!attempt) {
    throw new ApiError(404, ATTEMPT_MESSAGES.ATTEMPT_NOT_FOUND);
  }

  if (attempt.status !== ATTEMPT_STATUS.IN_PROGRESS) {
    throw new ApiError(400, ATTEMPT_MESSAGES.ATTEMPT_ALREADY_SUBMITTED);
  }

  if (new Date() > attempt.expiresAt) {
    attempt.status = ATTEMPT_STATUS.EXPIRED;
    await attempt.save();
    throw new ApiError(400, ATTEMPT_MESSAGES.ATTEMPT_EXPIRED);
  }

  const questions = await Question.find({
    quizId,
    isDeleted: { $ne: true },
  }).sort({ order: 1 });

  const questionIds = questions.map((q) => q._id.toString());
  for (const answer of payload.answers) {
    if (!questionIds.includes(answer.questionId)) {
      throw new ApiError(400, ATTEMPT_MESSAGES.INVALID_QUESTION);
    }
  }

  const { score, percentage } = await gradeSubmission(payload.answers, questions);

  attempt.status = ATTEMPT_STATUS.SUBMITTED;
  attempt.submittedAt = new Date();
  attempt.score = score;
  attempt.totalMarks = quiz.totalMarks;
  attempt.percentage = percentage;
  attempt.passed = percentage >= ((quiz.passingMarks / quiz.totalMarks) * 100);

  await attempt.save();

  return attempt;
};

const getAttempts = async (quizId, userId, userRole) => {
  const quiz = await validateQuiz(quizId);

  if (userRole === USER_ROLE.TEACHER) {
    if (quiz.teacherId.toString() !== userId.toString()) {
      throw new ApiError(403, QUIZ_MESSAGES.UNAUTHORIZED_TEACHER);
    }
  }

  const attempts = await QuizAttempt.find({
    quizId,
    isDeleted: { $ne: true },
  })
    .populate("studentId", "fullName email")
    .sort({ startedAt: -1 })
    .select("-isDeleted -deletedAt");

  return attempts;
};

export const AttemptService = {
  startAttempt,
  getCurrentAttempt,
  getMyAttempts,
  submitAttempt,
  getAttempts,
};
