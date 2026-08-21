import mongoose from "mongoose";
import Question from "./question.model.js";
import Quiz from "./quiz.model.js";
import Class from "../class/class.model.js";
import ApiError from "../../shared/ApiError.js";
import { USER_ROLE, USER_STATUS } from "../user/user.constant.js";
import { QUESTION_MESSAGES } from "./question.constant.js";

const validateQuiz = async (quizId) => {
  const quiz = await Quiz.findOne({
    _id: quizId,
    isDeleted: { $ne: true },
  });

  if (!quiz) {
    throw new ApiError(404, "Quiz not found");
  }

  return quiz;
};

const validateTeacherOwnership = async (quizId, teacherId) => {
  const quiz = await Quiz.findOne({
    _id: quizId,
    teacherId,
    isDeleted: { $ne: true },
  });

  if (!quiz) {
    throw new ApiError(403, QUESTION_MESSAGES.UNAUTHORIZED_TEACHER);
  }

  return quiz;
};

const createQuestion = async (quizId, payload, userId, userRole) => {
  const quiz = await validateQuiz(quizId);

  if (userRole === USER_ROLE.TEACHER) {
    await validateTeacherOwnership(quizId, userId);
  }

  const optionKeys = payload.options.map((o) => o.key);
  if (new Set(optionKeys).size !== optionKeys.length) {
    throw new ApiError(400, "Duplicate option keys are not allowed");
  }

  if (!optionKeys.includes(payload.correctAnswer)) {
    throw new ApiError(400, QUESTION_MESSAGES.INVALID_CORRECT_ANSWER);
  }

  const question = await Question.create({
    quizId,
    questionText: payload.questionText,
    type: payload.type || "mcq",
    options: payload.options,
    correctAnswer: payload.correctAnswer,
    marks: payload.marks,
    order: payload.order,
    createdBy: userId,
  });

  const populated = await Question.findById(question._id)
    .populate("quizId", "title")
    .select("-isDeleted -deletedAt");

  return populated;
};

const getQuestions = async (quizId, userId, userRole) => {
  const quiz = await validateQuiz(quizId);

  if (userRole === USER_ROLE.TEACHER) {
    await validateTeacherOwnership(quizId, userId);
  } else if (userRole === USER_ROLE.STUDENT) {
    if (quiz.status !== "published") {
      throw new ApiError(403, QUESTION_MESSAGES.UNAUTHORIZED_TEACHER);
    }
  }

  const questions = await Question.find({
    quizId,
    isDeleted: { $ne: true },
  })
    .sort({ order: 1 })
    .select("-isDeleted -deletedAt");

  if (userRole === USER_ROLE.STUDENT) {
    const safeQuestions = questions.map((q) => {
      const qObj = q.toObject();
      delete qObj.correctAnswer;
      return qObj;
    });
    return safeQuestions;
  }

  return questions;
};

const getQuestionById = async (quizId, questionId, userId, userRole) => {
  const quiz = await validateQuiz(quizId);

  if (userRole === USER_ROLE.TEACHER) {
    await validateTeacherOwnership(quizId, userId);
  } else if (userRole === USER_ROLE.STUDENT) {
    if (quiz.status !== "published") {
      throw new ApiError(403, QUESTION_MESSAGES.UNAUTHORIZED_TEACHER);
    }
  }

  const question = await Question.findOne({
    _id: questionId,
    quizId,
    isDeleted: { $ne: true },
  }).select("-isDeleted -deletedAt");

  if (!question) {
    throw new ApiError(404, QUESTION_MESSAGES.QUESTION_NOT_FOUND);
  }

  if (userRole === USER_ROLE.STUDENT) {
    const qObj = question.toObject();
    delete qObj.correctAnswer;
    return qObj;
  }

  return question;
};

const updateQuestion = async (quizId, questionId, payload, userId, userRole) => {
  const quiz = await validateQuiz(quizId);

  if (userRole === USER_ROLE.TEACHER) {
    await validateTeacherOwnership(quizId, userId);
  }

  const question = await Question.findOne({
    _id: questionId,
    quizId,
    isDeleted: { $ne: true },
  });

  if (!question) {
    throw new ApiError(404, QUESTION_MESSAGES.QUESTION_NOT_FOUND);
  }

  if (payload.options) {
    const optionKeys = payload.options.map((o) => o.key);
    if (new Set(optionKeys).size !== optionKeys.length) {
      throw new ApiError(400, "Duplicate option keys are not allowed");
    }
  }

  if (payload.correctAnswer && payload.options) {
    const optionKeys = payload.options.map((o) => o.key);
    if (!optionKeys.includes(payload.correctAnswer)) {
      throw new ApiError(400, QUESTION_MESSAGES.INVALID_CORRECT_ANSWER);
    }
  }

  const updatedQuestion = await Question.findByIdAndUpdate(
    questionId,
    { $set: payload },
    { new: true, runValidators: true }
  )
    .populate("quizId", "title")
    .select("-isDeleted -deletedAt");

  return updatedQuestion;
};

const deleteQuestion = async (quizId, questionId, userId, userRole) => {
  const quiz = await validateQuiz(quizId);

  if (userRole === USER_ROLE.TEACHER) {
    await validateTeacherOwnership(quizId, userId);
  }

  const question = await Question.findOne({
    _id: questionId,
    quizId,
    isDeleted: { $ne: true },
  });

  if (!question) {
    throw new ApiError(404, QUESTION_MESSAGES.QUESTION_NOT_FOUND);
  }

  await Question.findByIdAndUpdate(questionId, {
    isDeleted: true,
    deletedAt: new Date(),
  });

  return { message: QUESTION_MESSAGES.QUESTION_DELETED };
};

export const QuestionService = {
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
};
