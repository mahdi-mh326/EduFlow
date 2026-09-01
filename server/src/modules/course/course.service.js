import path from "path";
import fs from "fs";
import Course from "./course.model.js";
import ApiError from "../../shared/ApiError.js";
import { COURSE_STATUS, COURSE_MESSAGES } from "./course.constant.js";
import { USER_ROLE } from "../user/user.constant.js";


const toSlug = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");

const createCourse = async (payload, createdBy) => {
  const title = payload.title.trim().replace(/\s+/g, " ");
  const slug = toSlug(title);

  const existing = await Course.findOne({ slug }, { _id: 1 }).lean();
  if (existing) throw new ApiError(409, "A course with this title already exists.");

  const course = await Course.create({
    ...payload,
    title,
    slug,
    createdBy,
    status: COURSE_STATUS.DRAFT,
    featured: false,
    timelineVisible: false,
  });

  return {
    id: course._id,
    title: course.title,
    slug: course.slug,
    category: course.category,
    status: course.status,
    createdBy: course.createdBy,
    createdAt: course.createdAt,
  };
};

const getAllCourses = async (query, user) => {
  const {
    page = 1,
    limit = 10,
    search,
    category,
    difficulty,
    featured,
    status,
    sortBy = "newest",
    sortOrder = "desc",
  } = query;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const filter = { isDeleted: { $ne: true } };

  if (!user || user.role !== USER_ROLE.ADMIN) {
    filter.status = COURSE_STATUS.PUBLISHED;
  } else if (status) {
    filter.status = status;
  }

  if (search) {
    filter.title = { $regex: search, $options: "i" };
  }

  if (category) {
    filter.category = category;
  }

  if (difficulty) {
    filter.difficulty = difficulty;
  }

  if (featured !== undefined && featured !== "") {
    filter.featured = featured === "true" || featured === true;
  }

  let sort = {};
  switch (sortBy) {
    case "price":
      sort = { price: sortOrder === "asc" ? 1 : -1 };
      break;
    case "title":
      sort = { title: sortOrder === "asc" ? 1 : -1 };
      break;
    case "newest":
    default:
      sort = { createdAt: -1 };
      break;
  }

  const [countResult, courses] = await Promise.all([
    Course.countDocuments(filter),
    Course.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .select("-isDeleted -deletedAt"),
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
    courses,
  };
};

const getCourseById = async (id) => {
  const course = await Course.findOne({ _id: id, isDeleted: { $ne: true } }).select("-isDeleted -deletedAt");
  if (!course) throw new ApiError(404, COURSE_MESSAGES.COURSE_NOT_FOUND);
  return course;
};

const getCourseBySlug = async (slug, user) => {
  const filter = { slug, isDeleted: { $ne: true } };

  if (!user || user.role !== USER_ROLE.ADMIN) {
    filter.status = COURSE_STATUS.PUBLISHED;
  }

  const course = await Course.findOne(filter).select("-isDeleted -deletedAt");
  if (!course) throw new ApiError(404, COURSE_MESSAGES.COURSE_NOT_FOUND);
  return course;
};

const updateCourse = async (id, payload) => {
  const course = await Course.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!course) throw new ApiError(404, COURSE_MESSAGES.COURSE_NOT_FOUND);

  if (payload.title) {
    payload.title = payload.title.trim().replace(/\s+/g, " ");
    payload.slug = toSlug(payload.title);

    const existing = await Course.findOne({ slug: payload.slug, _id: { $ne: id } }).select("_id").lean();
    if (existing) throw new ApiError(409, "A course with this title already exists.");
  }

  const effectivePrice = "price" in payload ? payload.price : course.price;
  const effectiveOfferPrice = "offerPrice" in payload ? payload.offerPrice : course.offerPrice;

  if (effectiveOfferPrice != null && effectiveOfferPrice > effectivePrice) {
    throw new ApiError(400, "Offer price must not exceed the original price.");
  }

  const updatedCourse = await Course.findByIdAndUpdate(
    id,
    { $set: payload },
    { new: true, runValidators: true }
  ).select("-isDeleted -deletedAt");

  return updatedCourse;
};

const publishCourse = async (id) => {
  const course = await Course.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!course) throw new ApiError(404, COURSE_MESSAGES.COURSE_NOT_FOUND);

  const newStatus = course.status === COURSE_STATUS.PUBLISHED
    ? COURSE_STATUS.DRAFT
    : COURSE_STATUS.PUBLISHED;

  const updatedCourse = await Course.findByIdAndUpdate(
    id,
    { status: newStatus },
    { new: true }
  ).select("-isDeleted -deletedAt");

  return {
    course: updatedCourse,
    status: newStatus,
  };
};

const featureCourse = async (id) => {
  const course = await Course.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!course) throw new ApiError(404, COURSE_MESSAGES.COURSE_NOT_FOUND);

  const newFeatured = !course.featured;

  const updatedCourse = await Course.findByIdAndUpdate(
    id,
    { featured: newFeatured },
    { new: true }
  ).select("-isDeleted -deletedAt");

  return {
    course: updatedCourse,
    featured: newFeatured,
  };
};

const softDeleteCourse = async (id) => {
  const course = await Course.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!course) throw new ApiError(404, COURSE_MESSAGES.COURSE_NOT_FOUND);

  await Course.findByIdAndUpdate(id, {
    isDeleted: true,
    deletedAt: new Date(),
  });

  return { message: COURSE_MESSAGES.COURSE_DELETED };
};

const uploadPoster = async (courseId, file) => {
  if (!file) throw new ApiError(400, "No image file provided.");
  const posterUrl = `/uploads/courses/${file.filename}`;

  if (courseId && courseId !== "new") {
    const course = await Course.findOne({ _id: courseId, isDeleted: { $ne: true } });
    if (course) {
      if (course.thumbnail && course.thumbnail.startsWith("/uploads/courses/")) {
        const oldPath = path.join(process.cwd(), "public", course.thumbnail.replace(/^\//, ""));
        if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch {}
        }
      }
      course.thumbnail = posterUrl;
      course.banner = posterUrl;
      await course.save();
    }
  }

  return { posterUrl };
};

const deletePoster = async (courseId) => {
  const course = await Course.findOne({ _id: courseId, isDeleted: { $ne: true } });
  if (!course) throw new ApiError(404, COURSE_MESSAGES.COURSE_NOT_FOUND);

  if (course.thumbnail && course.thumbnail.startsWith("/uploads/courses/")) {
    const oldPath = path.join(process.cwd(), "public", course.thumbnail.replace(/^\//, ""));
    if (fs.existsSync(oldPath)) {
      try { fs.unlinkSync(oldPath); } catch {}
    }
  }

  course.thumbnail = "";
  course.banner = "";
  await course.save();

  return { message: "Poster deleted successfully." };
};

export const CourseService = {
  createCourse,
  getAllCourses,
  getCourseById,
  getCourseBySlug,
  updateCourse,
  publishCourse,
  featureCourse,
  softDeleteCourse,
  uploadPoster,
  deletePoster,
};

