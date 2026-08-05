import mongoose from "mongoose";
import User from "../user/user.model.js";
import TeacherProfile from "./teacher.model.js";
import { teacherUtils } from "./teacher.utils.js";
import { generateTemporaryPassword } from "../../shared/password.utils.js";
import { checkDuplicateEmail, checkDuplicatePhone } from "../../shared/userValidation.utils.js";
import { createStaffUser } from "../../shared/userCreation.utils.js";
import { EMAIL_SUBJECTS } from "../../constants/email.constant.js";
import sendEmail from "../../utils/email/sendEmail.js";
import { emailTemplates } from "../../utils/email/email.template.js";
import { USER_ROLE, USER_STATUS } from "../user/user.constant.js";
import logger from "../../shared/logger.js";
import ApiError from "../../shared/ApiError.js";

const createTeacher = async (payload, createdBy) => {
  const {
    designation, qualification, experienceYears, bio, officePhone,
    ...userPayload
  } = payload;

  await Promise.all([
    checkDuplicateEmail(userPayload.email),
    checkDuplicatePhone(userPayload.phone),
  ]);

  let user;
  let teacherProfile;
  let temporaryPassword;

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const employeeId = await teacherUtils.generateTeacherEmployeeId();
      temporaryPassword = generateTemporaryPassword();

      user = await createStaffUser(userPayload, temporaryPassword, {
        role: USER_ROLE.TEACHER,
        status: USER_STATUS.PENDING,
        isVerified: false,
        mustChangePassword: true,
        createdBy,
        session,
      });

      [teacherProfile] = await TeacherProfile.create(
        [
          {
            userId: user._id,
            employeeId,
            designation,
            qualification,
            experienceYears,
            bio,
            officePhone,
          },
        ],
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  try {
    await sendEmail({
      to: user.email,
      subject: EMAIL_SUBJECTS.WELCOME_TEACHER,
      html: emailTemplates.teacherWelcome(
        user.fullName,
        teacherProfile.employeeId,
        user.email,
        temporaryPassword
      ),
    });
  } catch (emailError) {
    logger.error(`Welcome email failed for teacher [${user.email}]: ${emailError.message}`);
  } finally {
    temporaryPassword = null;
  }

  return {
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      role: user.role,
      status: user.status,
    },
    teacherProfile: {
      id: teacherProfile._id,
      employeeId: teacherProfile.employeeId,
      designation: teacherProfile.designation,
      qualification: teacherProfile.qualification,
      experienceYears: teacherProfile.experienceYears,
    },
  };
};

const getTeachers = async (query) => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    gender,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const pageNum  = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
  const skip     = (pageNum - 1) * limitNum;
  const ALLOWED_SORT = new Set(["createdAt", "employeeId", "fullName"]);
  const sortField = ALLOWED_SORT.has(sortBy) ? sortBy : "createdAt";

  const sort = sortField === "employeeId"
    ? { "teacherProfile.employeeId": sortOrder === "asc" ? 1 : -1 }
    : { [sortField]: sortOrder === "asc" ? 1 : -1 };

  // Base filter — always teachers only, never deleted
  const userFilter = { role: USER_ROLE.TEACHER, isDeleted: { $ne: true } };
  if (status) userFilter.status = status;
  if (gender) userFilter.gender = gender;
  if (search) {
    const regex = { $regex: search, $options: "i" };
    userFilter.$or = [{ fullName: regex }, { email: regex }];
  }

  const pipeline = [
    { $match: userFilter },
    {
      $lookup: {
        from: "teacher_profiles",
        localField: "_id",
        foreignField: "userId",
        as: "teacherProfile",
      },
    },
    { $unwind: { path: "$teacherProfile", preserveNullAndEmptyArrays: false } },
    // employeeId search applied after lookup
    ...(search
      ? [{
          $match: {
            $or: [
              { fullName: { $regex: search, $options: "i" } },
              { email:    { $regex: search, $options: "i" } },
              { "teacherProfile.employeeId": { $regex: search, $options: "i" } },
            ],
          },
        }]
      : []),
    {
      $project: {
        password: 0,
        __v: 0,
        "teacherProfile.__v": 0,
      },
    },
  ];

  const [countResult, teachers] = await Promise.all([
    User.aggregate([...pipeline, { $count: "total" }]),
    User.aggregate([...pipeline, { $sort: sort }, { $skip: skip }, { $limit: limitNum }]),
  ]);

  const total = countResult[0]?.total ?? 0;

  return {
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
    teachers,
  };
};

// Shared pipeline fragment: lookup + unwind + exclude password
const teacherPipeline = (matchStage) => [
  { $match: matchStage },
  {
    $lookup: {
      from: "teacher_profiles",
      localField: "_id",
      foreignField: "userId",
      as: "teacherProfile",
    },
  },
  { $unwind: { path: "$teacherProfile", preserveNullAndEmptyArrays: false } },
  { $project: { password: 0, __v: 0, "teacherProfile.__v": 0 } },
];

const getTeacher = async (id) => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid teacher ID.");

  const [teacher] = await User.aggregate(
    teacherPipeline({ _id: new mongoose.Types.ObjectId(id), role: USER_ROLE.TEACHER, isDeleted: { $ne: true } })
  );

  if (!teacher) throw new ApiError(404, "Teacher not found.");

  return teacher;
};

const updateTeacher = async (id, payload) => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid teacher ID.");

  const user = await User.findOne({ _id: id, role: USER_ROLE.TEACHER, isDeleted: { $ne: true } }).select("_id phone");
  if (!user) throw new ApiError(404, "Teacher not found.");

  const {
    fullName, phone, gender, avatar,
    designation, qualification, experienceYears, bio, officePhone,
  } = payload;

  const userUpdates    = { fullName, phone, gender, avatar };
  const profileUpdates = { designation, qualification, experienceYears, bio, officePhone };

  // Strip undefined keys
  Object.keys(userUpdates).forEach((k)    => userUpdates[k]    === undefined && delete userUpdates[k]);
  Object.keys(profileUpdates).forEach((k) => profileUpdates[k] === undefined && delete profileUpdates[k]);

  if (phone && phone !== String(user.phone)) {
    const conflict = await User.findOne({ phone, _id: { $ne: id } }, { _id: 1 }).lean();
    if (conflict) throw new ApiError(409, "Phone number already in use.");
  }

  await Promise.all([
    Object.keys(userUpdates).length
      ? User.findByIdAndUpdate(id, userUpdates, { runValidators: true })
      : null,
    Object.keys(profileUpdates).length
      ? TeacherProfile.findOneAndUpdate({ userId: id }, profileUpdates, { runValidators: true })
      : null,
  ]);

  return getTeacher(id);
};

const updateTeacherStatus = async (id, status) => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid teacher ID.");

  const teacher = await User.findOneAndUpdate(
    { _id: id, role: USER_ROLE.TEACHER, isDeleted: { $ne: true } },
    { status },
    { new: true, runValidators: true }
  ).select("-password");

  if (!teacher) throw new ApiError(404, "Teacher not found.");

  return teacher;
};

const deleteTeacher = async (id) => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid teacher ID.");

  const teacher = await User.findOneAndUpdate(
    { _id: id, role: USER_ROLE.TEACHER, isDeleted: { $ne: true } },
    { isDeleted: true, deletedAt: new Date(), status: USER_STATUS.BLOCKED },
    { new: true }
  ).select("_id");

  if (!teacher) throw new ApiError(404, "Teacher not found.");
};

export const TeacherService = { createTeacher, getTeachers, getTeacher, updateTeacher, updateTeacherStatus, deleteTeacher };
