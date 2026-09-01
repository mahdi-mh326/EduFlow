import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import SavedCourse from "./saved-course.model.js";
import Course from "../course/course.model.js";
import Class from "../class/class.model.js";
import ApiError from "../../shared/ApiError.js";
import { CLASS_STATUS } from "../class/class.constant.js";

const toggleSaveCourse = catchAsync(async (req, res) => {
  const studentId = req.user._id;
  const { courseId } = req.body;

  if (!courseId) {
    throw new ApiError(400, "Course ID is required");
  }

  const course = await Course.findOne({ _id: courseId, isDeleted: { $ne: true } });
  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  const existing = await SavedCourse.findOne({ studentId, courseId });

  if (existing) {
    await SavedCourse.findByIdAndDelete(existing._id);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Course removed from saved list",
      data: { isSaved: false, courseId },
    });
  } else {
    const saved = await SavedCourse.create({
      studentId,
      courseId,
    });
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Course saved successfully. You will be notified when a class batch opens.",
      data: { isSaved: true, savedId: saved._id, courseId },
    });
  }
});

const getSavedCourses = catchAsync(async (req, res) => {
  const studentId = req.user._id;

  const savedList = await SavedCourse.find({ studentId })
    .populate({
      path: "courseId",
      match: { isDeleted: { $ne: true } },
      select: "title slug thumbnail shortDescription price offerPrice category difficulty durationValue durationUnit status",
    })
    .sort({ createdAt: -1 });

  // Filter out any populated docs that were null due to soft delete
  const validSaved = savedList.filter((s) => s.courseId != null);

  // For each saved course, check if any active classes exist now
  const enriched = await Promise.all(
    validSaved.map(async (item) => {
      const course = item.courseId;
      const activeClassCount = await Class.countDocuments({
        courseId: course._id,
        status: { $in: [CLASS_STATUS.UPCOMING, CLASS_STATUS.ONGOING] },
        isDeleted: { $ne: true },
      });

      return {
        _id: item._id,
        course,
        activeClassCount,
        hasAvailableBatch: activeClassCount > 0,
        savedAt: item.createdAt,
      };
    })
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Saved courses retrieved successfully",
    data: enriched,
  });
});

const checkCourseSaved = catchAsync(async (req, res) => {
  const studentId = req.user._id;
  const { courseId } = req.params;

  const saved = await SavedCourse.findOne({ studentId, courseId });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Saved status retrieved",
    data: { isSaved: Boolean(saved) },
  });
});

export const SavedCourseController = {
  toggleSaveCourse,
  getSavedCourses,
  checkCourseSaved,
};
