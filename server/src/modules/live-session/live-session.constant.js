export const LIVE_SESSION_STATUS = {
  SCHEDULED: "scheduled",
  LIVE: "live",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

export const LIVE_SESSION_MESSAGES = {
  SESSION_CREATED: "Live session created successfully",
  SESSION_FETCHED: "Live session fetched successfully",
  SESSIONS_FETCHED: "Live sessions fetched successfully",
  SESSION_UPDATED: "Live session updated successfully",
  SESSION_DELETED: "Live session deleted successfully",
  SESSION_STARTED: "Live session started successfully",
  SESSION_ENDED: "Live session ended successfully",
  SESSION_NOT_FOUND: "Live session not found",
  UNAUTHORIZED_TEACHER: "You are not authorized to access this session",
  UNAUTHORIZED_STUDENT: "You are not authorized to access this session",
  CLASS_NOT_FOUND: "Class not found",
  TEACHER_NOT_FOUND: "Teacher not found",
  COURSE_NOT_FOUND: "Course not found",
  INVALID_SCHEDULE: "Cannot schedule session in the past",
  PAST_SESSION: "Cannot modify a past session",
  INVALID_SESSION_STATUS: "Invalid session status for this operation",
  CLASSROOM_NOT_AVAILABLE: "Classroom is not available for this session",
};
