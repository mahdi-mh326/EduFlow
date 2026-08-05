import mongoose from "mongoose";
import Material from "./material.model.js";
import User from "../user/user.model.js";
import Course from "../course/course.model.js";
import Class from "../class/class.model.js";
import Enrollment from "../enrollment/enrollment.model.js";
import ApiError from "../../shared/ApiError.js";
import { USER_ROLE, USER_STATUS } from "../user/user.constant.js";
import { COURSE_STATUS } from "../course/course.constant.js";
import { CLASS_STATUS } from "../class/class.constant.js";
import { ENROLLMENT_STATUS } from "../enrollment/enrollment.constant.js";
import { MATERIAL_MESSAGES } from "./material.constant.js";

const createMaterial = async (payload, createdBy, userRole) => {
  const {
    courseId, classId, teacherId, title, description, fileUrl, fileType, visibility,
  } = payload;

  if (userRole === USER_ROLE.TEACHER) {
    const isOwnClass = await Class.findOne({
      _id: classId,
      teacherId: createdBy,
      isDeleted: { $ne: true },
    });

    if (!isOwnClass) {
      throw new ApiError(403, MATERIAL_MESSAGES.UNAUTHORIZED_TEACHER);
    }

    payload.teacherId = createdBy;
  }

  const course = await Course.findOne({
    _id: courseId,
    isDeleted: { $ne: true },
  });

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  const cls = await Class.findOne({
    _id: classId,
    isDeleted: { $ne: true },
  });

  if (!cls) {
    throw new ApiError(404, "Class not found");
  }

  const teacher = await User.findOne({
    _id: payload.teacherId,
    role: USER_ROLE.TEACHER,
    isDeleted: { $ne: true },
  });

  if (!teacher) {
    throw new ApiError(404, "Teacher not found");
  }

  const material = await Material.create({
    courseId,
    classId,
    teacherId: payload.teacherId,
    title,
    description: description || "",
    fileUrl,
    fileType,
    visibility: visibility || "public",
    createdBy,
  });

  return material;
};

const getMaterials = async (userId, userRole) => {
  const filter = { isDeleted: { $ne: true } };

  if (userRole === USER_ROLE.ADMIN) {
    // Admin sees all
  } else if (userRole === USER_ROLE.TEACHER) {
    filter.teacherId = userId;
  } else if (userRole === USER_ROLE.STUDENT) {
    const enrolledClassIds = await Enrollment.find({
      studentId: userId,
      status: ENROLLMENT_STATUS.ACTIVE,
      isDeleted: { $ne: true },
    }).distinct("classId");

    filter.classId = { $in: enrolledClassIds };
  }

  const materials = await Material.find(filter)
    .populate("courseId", "title slug")
    .populate("classId", "batchName")
    .populate("teacherId", "fullName email")
    .sort({ createdAt: -1 });

  return materials;
};

const getMaterialById = async (id, userId, userRole) => {
  const material = await Material.findOne({
    _id: id,
    isDeleted: { $ne: true },
  })
    .populate("courseId", "title slug")
    .populate("classId", "batchName")
    .populate("teacherId", "fullName email");

  if (!material) {
    throw new ApiError(404, MATERIAL_MESSAGES.MATERIAL_NOT_FOUND);
  }

  if (userRole === USER_ROLE.ADMIN) {
    return material;
  }

  if (userRole === USER_ROLE.TEACHER) {
    if (material.teacherId._id.toString() !== userId.toString()) {
      throw new ApiError(403, MATERIAL_MESSAGES.UNAUTHORIZED_TEACHER);
    }
    return material;
  }

  if (userRole === USER_ROLE.STUDENT) {
    const enrolled = await Enrollment.findOne({
      studentId: userId,
      classId: material.classId._id,
      status: ENROLLMENT_STATUS.ACTIVE,
      isDeleted: { $ne: true },
    });

    if (!enrolled) {
      throw new ApiError(403, MATERIAL_MESSAGES.UNAUTHORIZED_TEACHER);
    }
    return material;
  }

  throw new ApiError(403, "You are not authorized to access this material");
};

const updateMaterial = async (id, payload, userId, userRole) => {
  const material = await Material.findOne({
    _id: id,
    isDeleted: { $ne: true },
  });

  if (!material) {
    throw new ApiError(404, MATERIAL_MESSAGES.MATERIAL_NOT_FOUND);
  }

  if (userRole === USER_ROLE.TEACHER) {
    if (material.teacherId.toString() !== userId.toString()) {
      throw new ApiError(403, MATERIAL_MESSAGES.UNAUTHORIZED_TEACHER);
    }
  }

  const updatedMaterial = await Material.findByIdAndUpdate(
    id,
    { $set: payload },
    { new: true, runValidators: true }
  )
    .populate("courseId", "title slug")
    .populate("classId", "batchName")
    .populate("teacherId", "fullName email");

  return updatedMaterial;
};

const deleteMaterial = async (id, userId, userRole) => {
  const material = await Material.findOne({
    _id: id,
    isDeleted: { $ne: true },
  });

  if (!material) {
    throw new ApiError(404, MATERIAL_MESSAGES.MATERIAL_NOT_FOUND);
  }

  if (userRole === USER_ROLE.TEACHER) {
    if (material.teacherId.toString() !== userId.toString()) {
      throw new ApiError(403, MATERIAL_MESSAGES.UNAUTHORIZED_TEACHER);
    }
  }

  await Material.findByIdAndUpdate(id, {
    isDeleted: true,
    deletedAt: new Date(),
  });

  return { message: MATERIAL_MESSAGES.MATERIAL_DELETED };
};

export const MaterialService = {
  createMaterial,
  getMaterials,
  getMaterialById,
  updateMaterial,
  deleteMaterial,
};
