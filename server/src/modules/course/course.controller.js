import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import { CourseService } from "./course.service.js";
import { COURSE_MESSAGES, COURSE_STATUS } from "./course.constant.js";

const createCourse = catchAsync(async (req, res) => {
  const result = await CourseService.createCourse(req.body, req.user._id);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Course created successfully.",
    data: result,
  });
});

const getAllCourses = catchAsync(async (req, res) => {
  const result = await CourseService.getAllCourses(req.query, req.user);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Courses retrieved successfully",
    meta: result.meta,
    data: result.courses,
  });
});

const getCourseBySlug = catchAsync(async (req, res) => {
  const result = await CourseService.getCourseBySlug(req.params.slug, req.user);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Course retrieved successfully",
    data: result,
  });
});

const updateCourse = catchAsync(async (req, res) => {
  const result = await CourseService.updateCourse(req.params.id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: COURSE_MESSAGES.COURSE_UPDATED,
    data: result,
  });
});

const publishCourse = catchAsync(async (req, res) => {
  const result = await CourseService.publishCourse(req.params.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.status === COURSE_STATUS.PUBLISHED
      ? COURSE_MESSAGES.COURSE_PUBLISHED
      : COURSE_MESSAGES.COURSE_UNPUBLISHED,
    data: result,
  });
});

const featureCourse = catchAsync(async (req, res) => {
  const result = await CourseService.featureCourse(req.params.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.featured
      ? COURSE_MESSAGES.COURSE_FEATURED
      : COURSE_MESSAGES.COURSE_UNFEATURED,
    data: result,
  });
});

const softDeleteCourse = catchAsync(async (req, res) => {
  const result = await CourseService.softDeleteCourse(req.params.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
    data: null,
  });
});

const uploadPoster = catchAsync(async (req, res) => {
  const result = await CourseService.uploadPoster(req.params.id, req.file);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Poster uploaded successfully.",
    data: result,
  });
});

const deletePoster = catchAsync(async (req, res) => {
  const result = await CourseService.deletePoster(req.params.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
    data: null,
  });
});

export const CourseController = {
  createCourse,
  getAllCourses,
  getCourseBySlug,
  updateCourse,
  publishCourse,
  featureCourse,
  softDeleteCourse,
  uploadPoster,
  deletePoster,
};

