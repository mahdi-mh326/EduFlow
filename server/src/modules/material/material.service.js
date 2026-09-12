import mongoose from "mongoose";
import Material from "./material.model.js";
import User from "../user/user.model.js";
import Course from "../course/course.model.js";
import Class from "../class/class.model.js";
import Enrollment from "../enrollment/enrollment.model.js";
import ApiError from "../../shared/ApiError.js";
import { USER_ROLE } from "../user/user.constant.js";
import {
  ENROLLMENT_STATUS,
  PAYMENT_STATUS as ENROLLMENT_PAYMENT_STATUS,
} from "../enrollment/enrollment.constant.js";
import { MATERIAL_MESSAGES, MATERIAL_VISIBILITY } from "./material.constant.js";
const createMaterial = async (payload, createdBy, userRole) => {
  if (userRole !== USER_ROLE.ADMIN && userRole !== USER_ROLE.TEACHER) {
    throw new ApiError(403, "Only teachers and administrators can upload study materials.");
  }

  const { courseId, classId, title, description, fileUrl, fileType, visibility } = payload;

  if (!classId) {
    throw new ApiError(400, "Class ID is required to upload materials.");
  }

  const cls = await Class.findOne({
    _id: classId,
    isDeleted: { $ne: true },
  });

  if (!cls) {
    throw new ApiError(404, "Class not found.");
  }

  if (courseId && courseId.toString().trim() && cls.courseId.toString() !== courseId.toString().trim()) {
    throw new ApiError(400, "The selected class does not belong to the selected course.");
  }

  if (userRole === USER_ROLE.TEACHER) {
    const isAssigned =
      (cls.teacherId && cls.teacherId.toString() === createdBy.toString()) ||
      (cls.createdBy && cls.createdBy.toString() === createdBy.toString());
    if (!isAssigned) {
      throw new ApiError(403, "You can only upload study materials for classes assigned to you.");
    }
  }

  const resolvedTeacherId = cls.teacherId || (userRole === USER_ROLE.TEACHER ? createdBy : payload.teacherId || createdBy);

  const resolvedVisibility =
    visibility && Object.values(MATERIAL_VISIBILITY).includes(visibility)
      ? visibility
      : MATERIAL_VISIBILITY.PUBLIC;

  const material = await Material.create({
    courseId: cls.courseId,
    classId: cls._id,
    teacherId: resolvedTeacherId,
    title: title.trim(),
    description: description ? description.trim() : "",
    fileUrl: fileUrl.trim(),
    fileType: fileType ? fileType.trim() : "pdf",
    visibility: resolvedVisibility,
    createdBy,
  });

  const populated = await Material.findById(material._id)
    .populate("courseId", "title slug")
    .populate("classId", "batchName")
    .populate("teacherId", "fullName email avatar");

  return populated;
};

const getMaterials = async (userId, userRole, query = {}) => {
  const filter = { isDeleted: { $ne: true } };

  if (query.courseId) {
    filter.courseId = query.courseId;
  }

  if (query.classId) {
    filter.classId = query.classId;
  }

  if (query.fileType) {
    filter.fileType = query.fileType;
  }

  if (query.search) {
    filter.title = { $regex: query.search.trim(), $options: "i" };
  }

  if (userRole === USER_ROLE.TEACHER) {
    filter.$or = [{ teacherId: userId }, { createdBy: userId }];
  } else if (userRole === USER_ROLE.STUDENT) {
    filter.visibility = { $ne: "private" };

    const enrolledClassIds = await Enrollment.find({
      studentId: userId,
      status: ENROLLMENT_STATUS.ACTIVE,
      paymentStatus: ENROLLMENT_PAYMENT_STATUS.PAID,
      isDeleted: { $ne: true },
    }).distinct("classId");

    if (enrolledClassIds.length === 0) {
      return [];
    }

    if (filter.classId) {
      const isAllowed = enrolledClassIds.some(
        (cId) => cId && cId.toString() === filter.classId.toString()
      );
      if (!isAllowed) return [];
    } else {
      filter.classId = { $in: enrolledClassIds };
    }
  } else if (userRole === USER_ROLE.ADMIN) {
    // Admin can view all materials matching filters
  } else {
    return [];
  }

  const materials = await Material.find(filter)
    .populate("courseId", "title slug")
    .populate("classId", "batchName")
    .populate("teacherId", "fullName email avatar")
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
    .populate("teacherId", "fullName email avatar");

  if (!material) {
    throw new ApiError(404, MATERIAL_MESSAGES.MATERIAL_NOT_FOUND);
  }

  if (userRole === USER_ROLE.ADMIN) {
    return material;
  }

  if (userRole === USER_ROLE.TEACHER) {
    const isTeacher =
      (material.teacherId?._id && material.teacherId._id.toString() === userId.toString()) ||
      (material.createdBy && material.createdBy.toString() === userId.toString());
    if (!isTeacher) {
      throw new ApiError(403, MATERIAL_MESSAGES.UNAUTHORIZED_TEACHER);
    }
    return material;
  }

  if (userRole === USER_ROLE.STUDENT) {
    if (material.visibility === "private") {
      throw new ApiError(403, "You are not authorized to access this material.");
    }

    const enrolled = await Enrollment.findOne({
      studentId: userId,
      classId: material.classId._id,
      status: ENROLLMENT_STATUS.ACTIVE,
      paymentStatus: ENROLLMENT_PAYMENT_STATUS.PAID,
      isDeleted: { $ne: true },
    });

    if (!enrolled) {
      throw new ApiError(403, "You are not enrolled in this class.");
    }
    return material;
  }

  throw new ApiError(403, "You are not authorized to access this material.");
};

const updateMaterial = async (id, payload, userId, userRole) => {
  if (userRole !== USER_ROLE.ADMIN && userRole !== USER_ROLE.TEACHER) {
    throw new ApiError(403, "Only teachers and administrators can update study materials.");
  }

  const material = await Material.findOne({
    _id: id,
    isDeleted: { $ne: true },
  });

  if (!material) {
    throw new ApiError(404, MATERIAL_MESSAGES.MATERIAL_NOT_FOUND);
  }

  if (userRole === USER_ROLE.TEACHER) {
    const isOwner =
      material.teacherId?.toString() === userId.toString() ||
      material.createdBy?.toString() === userId.toString();
    if (!isOwner) {
      throw new ApiError(403, MATERIAL_MESSAGES.UNAUTHORIZED_TEACHER);
    }
  }

  if (payload.courseId || payload.classId) {
    const targetCourseId = (payload.courseId || material.courseId).toString();
    const targetClassId = (payload.classId || material.classId).toString();
    const cls = await Class.findOne({ _id: targetClassId, isDeleted: { $ne: true } });
    if (!cls) {
      throw new ApiError(404, "Target class not found.");
    }
    if (cls.courseId.toString() !== targetCourseId) {
      throw new ApiError(400, "The selected class does not belong to the selected course.");
    }
  }

  const updatedMaterial = await Material.findByIdAndUpdate(
    id,
    { $set: payload },
    { new: true, runValidators: true }
  )
    .populate("courseId", "title slug")
    .populate("classId", "batchName")
    .populate("teacherId", "fullName email avatar");

  return updatedMaterial;
};

const deleteMaterial = async (id, userId, userRole) => {
  if (userRole !== USER_ROLE.ADMIN && userRole !== USER_ROLE.TEACHER) {
    throw new ApiError(403, "Only teachers and administrators can delete study materials.");
  }

  const material = await Material.findOne({
    _id: id,
    isDeleted: { $ne: true },
  });

  if (!material) {
    throw new ApiError(404, MATERIAL_MESSAGES.MATERIAL_NOT_FOUND);
  }

  if (userRole === USER_ROLE.TEACHER) {
    const isOwner =
      material.teacherId?.toString() === userId.toString() ||
      material.createdBy?.toString() === userId.toString();
    if (!isOwner) {
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


