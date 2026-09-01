import mongoose from "mongoose";
import Assignment from "./assignment.model.js";
import AssignmentSubmission from "./submission.model.js";
import Class from "../class/class.model.js";
import Enrollment from "../enrollment/enrollment.model.js";
import User from "../user/user.model.js";
import ApiError from "../../shared/ApiError.js";
import { USER_ROLE, USER_STATUS } from "../user/user.constant.js";
import { ENROLLMENT_STATUS, PAYMENT_STATUS as ENROLLMENT_PAYMENT_STATUS } from "../enrollment/enrollment.constant.js";
import { ASSIGNMENT_STATUS, ASSIGNMENT_MESSAGES } from "./assignment.constant.js";
import { SUBMISSION_STATUS, SUBMISSION_MESSAGES } from "./submission.constant.js";

const validateAssignment = async (assignmentId) => {
  const assignment = await Assignment.findOne({
    _id: assignmentId,
    isDeleted: { $ne: true },
  });

  if (!assignment) {
    throw new ApiError(404, ASSIGNMENT_MESSAGES.ASSIGNMENT_NOT_FOUND);
  }

  return assignment;
};

const validateStudentEligibility = async (studentId, assignment) => {
  const student = await User.findOne({
    _id: studentId,
    role: USER_ROLE.STUDENT,
    status: USER_STATUS.ACTIVE,
    isDeleted: { $ne: true },
  });

  if (!student) {
    throw new ApiError(404, SUBMISSION_MESSAGES.UNAUTHORIZED_STUDENT);
  }

  const enrolled = await Enrollment.findOne({
    studentId,
    classId: assignment.classId,
    status: ENROLLMENT_STATUS.ACTIVE,
    paymentStatus: ENROLLMENT_PAYMENT_STATUS.PAID,
    isDeleted: { $ne: true },
  });

  if (!enrolled) {
    throw new ApiError(403, SUBMISSION_MESSAGES.UNAUTHORIZED_STUDENT);
  }

  return { student, enrollment: enrolled };
};

const createSubmission = async (assignmentId, payload, studentId) => {
  const assignment = await validateAssignment(assignmentId);

  if (assignment.status !== ASSIGNMENT_STATUS.PUBLISHED) {
    throw new ApiError(400, SUBMISSION_MESSAGES.ASSIGNMENT_NOT_PUBLISHED);
  }

  if (assignment.status === ASSIGNMENT_STATUS.CLOSED) {
    throw new ApiError(400, SUBMISSION_MESSAGES.ASSIGNMENT_CLOSED);
  }

  if (new Date(assignment.dueDate) <= new Date()) {
    throw new ApiError(400, SUBMISSION_MESSAGES.DEADLINE_PASSED);
  }

  await validateStudentEligibility(studentId, assignment);

  const existingSubmission = await AssignmentSubmission.findOne({
    assignmentId,
    studentId,
    isDeleted: { $ne: true },
  });

  let submission;
  if (existingSubmission) {
    submission = await AssignmentSubmission.findByIdAndUpdate(
      existingSubmission._id,
      {
        $set: {
          content: payload.content || existingSubmission.content,
          attachmentUrl: payload.attachmentUrl || existingSubmission.attachmentUrl,
          submittedAt: new Date(),
          status: SUBMISSION_STATUS.SUBMITTED,
        },
      },
      { new: true, runValidators: true }
    );
  } else {
    submission = await AssignmentSubmission.create({
      assignmentId,
      studentId,
      content: payload.content || "",
      attachmentUrl: payload.attachmentUrl || "",
      submittedAt: new Date(),
      status: SUBMISSION_STATUS.SUBMITTED,
      createdBy: studentId,
    });
  }

  const populated = await AssignmentSubmission.findById(submission._id)
    .populate("assignmentId", "title dueDate totalMarks status")
    .populate("studentId", "fullName email")
    .select("-isDeleted -deletedAt");

  return populated;
};

const getMySubmission = async (assignmentId, studentId) => {
  const assignment = await validateAssignment(assignmentId);

  if (assignment.status !== ASSIGNMENT_STATUS.PUBLISHED) {
    throw new ApiError(403, ASSIGNMENT_MESSAGES.UNAUTHORIZED_TEACHER);
  }

  await validateStudentEligibility(studentId, assignment);

  const submission = await AssignmentSubmission.findOne({
    assignmentId,
    studentId,
    isDeleted: { $ne: true },
  })
    .populate("assignmentId", "title dueDate totalMarks status")
    .select("-isDeleted -deletedAt");

  if (!submission) {
    throw new ApiError(404, SUBMISSION_MESSAGES.SUBMISSION_NOT_FOUND);
  }

  return submission;
};

const updateMySubmission = async (assignmentId, payload, studentId) => {
  const assignment = await validateAssignment(assignmentId);

  if (assignment.status !== ASSIGNMENT_STATUS.PUBLISHED) {
    throw new ApiError(400, SUBMISSION_MESSAGES.ASSIGNMENT_NOT_PUBLISHED);
  }

  if (assignment.status === ASSIGNMENT_STATUS.CLOSED) {
    throw new ApiError(400, SUBMISSION_MESSAGES.ASSIGNMENT_CLOSED);
  }

  if (new Date(assignment.dueDate) <= new Date()) {
    throw new ApiError(400, SUBMISSION_MESSAGES.DEADLINE_PASSED);
  }

  await validateStudentEligibility(studentId, assignment);

  const submission = await AssignmentSubmission.findOne({
    assignmentId,
    studentId,
    isDeleted: { $ne: true },
  });

  if (!submission) {
    throw new ApiError(404, SUBMISSION_MESSAGES.SUBMISSION_NOT_FOUND);
  }

  const updatedSubmission = await AssignmentSubmission.findByIdAndUpdate(
    submission._id,
    {
      $set: {
        content: payload.content !== undefined ? payload.content : submission.content,
        attachmentUrl: payload.attachmentUrl !== undefined ? payload.attachmentUrl : submission.attachmentUrl,
        submittedAt: new Date(),
        status: SUBMISSION_STATUS.SUBMITTED,
      },
    },
    { new: true, runValidators: true }
  )
    .populate("assignmentId", "title dueDate totalMarks status")
    .populate("studentId", "fullName email")
    .select("-isDeleted -deletedAt");

  return updatedSubmission;
};

const getSubmissions = async (assignmentId, userId, userRole) => {
  const assignment = await validateAssignment(assignmentId);

  if (userRole === USER_ROLE.TEACHER) {
    if (assignment.teacherId.toString() !== userId.toString()) {
      throw new ApiError(403, ASSIGNMENT_MESSAGES.UNAUTHORIZED_TEACHER);
    }
  }

  const submissions = await AssignmentSubmission.find({
    assignmentId,
    isDeleted: { $ne: true },
  })
    .populate("studentId", "fullName email")
    .populate("assignmentId", "title dueDate totalMarks status")
    .sort({ submittedAt: -1 })
    .select("-isDeleted -deletedAt");

  return submissions;
};

const gradeSubmission = async (assignmentId, submissionId, payload, userId, userRole) => {
  const assignment = await validateAssignment(assignmentId);

  if (userRole === USER_ROLE.TEACHER) {
    if (assignment.teacherId.toString() !== userId.toString()) {
      throw new ApiError(403, ASSIGNMENT_MESSAGES.UNAUTHORIZED_TEACHER);
    }
  }

  const submission = await AssignmentSubmission.findOne({
    _id: submissionId,
    assignmentId,
    isDeleted: { $ne: true },
  });

  if (!submission) {
    throw new ApiError(404, SUBMISSION_MESSAGES.SUBMISSION_NOT_FOUND);
  }

  if (payload.marks > assignment.totalMarks) {
    throw new ApiError(400, `Marks cannot exceed assignment total marks (${assignment.totalMarks})`);
  }

  const updated = await AssignmentSubmission.findByIdAndUpdate(
    submission._id,
    {
      $set: {
        marks: payload.marks,
        feedback: payload.feedback !== undefined ? payload.feedback : submission.feedback,
        status: SUBMISSION_STATUS.GRADED,
        gradedAt: new Date(),
        gradedBy: userId,
      },
    },
    { new: true, runValidators: true }
  )
    .populate("assignmentId", "title dueDate totalMarks status")
    .populate("studentId", "fullName email")
    .populate("gradedBy", "fullName email")
    .select("-isDeleted -deletedAt");

  return updated;
};

export const SubmissionService = {
  createSubmission,
  getMySubmission,
  updateMySubmission,
  getSubmissions,
  gradeSubmission,
};

