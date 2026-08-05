import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import { NoticeService } from "./notice.service.js";
import { NOTICE_MESSAGES } from "./notice.constant.js";
import { NoticeValidation } from "./notice.validation.js";

const createNotice = catchAsync(async (req, res) => {
  const result = await NoticeService.createNotice(req.body, req.user._id, req.user.role);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: NOTICE_MESSAGES.NOTICE_CREATED,
    data: result,
  });
});

const getNotices = catchAsync(async (req, res) => {
  const result = await NoticeService.getNotices(req.user._id, req.user.role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: NOTICE_MESSAGES.NOTICES_FETCHED,
    data: result,
  });
});

const getNoticeById = catchAsync(async (req, res) => {
  const result = await NoticeService.getNoticeById(req.params.id, req.user._id, req.user.role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: NOTICE_MESSAGES.NOTICE_FETCHED,
    data: result,
  });
});

const updateNotice = catchAsync(async (req, res) => {
  const result = await NoticeService.updateNotice(req.params.id, req.body, req.user._id, req.user.role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: NOTICE_MESSAGES.NOTICE_UPDATED,
    data: result,
  });
});

const deleteNotice = catchAsync(async (req, res) => {
  const result = await NoticeService.deleteNotice(req.params.id, req.user._id, req.user.role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
    data: null,
  });
});

export const NoticeController = {
  createNotice,
  getNotices,
  getNoticeById,
  updateNotice,
  deleteNotice,
};
