import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import { LiveSessionService } from "./live-session.service.js";
import { LIVE_SESSION_MESSAGES } from "./live-session.constant.js";

const createLiveSession = catchAsync(async (req, res) => {
  const result = await LiveSessionService.createLiveSession(req.body, req.user._id, req.user.role);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: LIVE_SESSION_MESSAGES.SESSION_CREATED,
    data: result,
  });
});

const getLiveSessions = catchAsync(async (req, res) => {
  const result = await LiveSessionService.getLiveSessions(req.user._id, req.user.role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: LIVE_SESSION_MESSAGES.SESSIONS_FETCHED,
    data: result,
  });
});

const getLiveSessionById = catchAsync(async (req, res) => {
  const result = await LiveSessionService.getLiveSessionById(req.params.id, req.user._id, req.user.role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: LIVE_SESSION_MESSAGES.SESSION_FETCHED,
    data: result,
  });
});

const updateLiveSession = catchAsync(async (req, res) => {
  const result = await LiveSessionService.updateLiveSession(req.params.id, req.body, req.user._id, req.user.role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: LIVE_SESSION_MESSAGES.SESSION_UPDATED,
    data: result,
  });
});

const deleteLiveSession = catchAsync(async (req, res) => {
  const result = await LiveSessionService.deleteLiveSession(req.params.id, req.user._id, req.user.role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
    data: null,
  });
});

const getStudentLiveSessions = catchAsync(async (req, res) => {
  const result = await LiveSessionService.getStudentLiveSessions(req.user._id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: LIVE_SESSION_MESSAGES.SESSIONS_FETCHED,
    data: result,
  });
});

export const LiveSessionController = {
  createLiveSession,
  getLiveSessions,
  getLiveSessionById,
  updateLiveSession,
  deleteLiveSession,
  getStudentLiveSessions,
};
