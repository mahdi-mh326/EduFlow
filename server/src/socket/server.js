import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import env from "../config/env.js";
import User from "../modules/user/user.model.js";
import { USER_STATUS, USER_ROLE } from "../modules/user/user.constant.js";
import LiveSession from "../modules/live-session/live-session.model.js";
import Enrollment from "../modules/enrollment/enrollment.model.js";
import {
  ENROLLMENT_STATUS,
  PAYMENT_STATUS as ENROLLMENT_PAYMENT_STATUS,
} from "../modules/enrollment/enrollment.constant.js";
import { LIVE_SESSION_STATUS } from "../modules/live-session/live-session.constant.js";
import { classroom } from "./classroom.js";

const verifySocketToken = async (token) => {
  try {
    const decoded = jwt.verify(token, env.jwtAccessSecret);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return { error: "User not found", code: 401 };
    }

    if (user.status !== USER_STATUS.ACTIVE) {
      return { error: "Your account is not active", code: 403 };
    }

    if (!user.isVerified) {
      return { error: "Please verify your email first", code: 403 };
    }

    return { user };
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return { error: "Access token expired", code: 401 };
    }
    return { error: "Invalid access token", code: 401 };
  }
};

const canAccessClassroom = async (user, sessionId) => {
  const session = await LiveSession.findOne({
    _id: sessionId,
    isDeleted: { $ne: true },
  });

  if (!session) {
    return { error: "Live session not found", code: 404 };
  }

  if (session.status !== LIVE_SESSION_STATUS.LIVE) {
    return { error: "Classroom is not available for this session", code: 403 };
  }

  if (user.role === USER_ROLE.TEACHER) {
    if (session.teacherId.toString() !== user._id.toString()) {
      return { error: "You are not authorized to access this classroom", code: 403 };
    }
    return { session, role: "teacher" };
  }

  if (user.role === USER_ROLE.STUDENT) {
    const enrolled = await Enrollment.findOne({
      studentId: user._id,
      classId: session.classId,
      status: ENROLLMENT_STATUS.ACTIVE,
      paymentStatus: ENROLLMENT_PAYMENT_STATUS.PAID,
      isDeleted: { $ne: true },
    });

    if (!enrolled) {
      return { error: "You are not authorized to access this classroom", code: 403 };
    }

    return { session, role: "student" };
  }

  return { error: "You are not authorized to access this classroom", code: 403 };
};

export const initSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: env.nodeEnv === "production" ? (env.clientUrl || "http://localhost:5173") : true,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication token required"));
      }

      const result = await verifySocketToken(token);
      if (result.error) {
        return next(new Error(result.error));
      }

      socket.user = result.user;
      next();
    } catch (error) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.user;
    logger.info(`Socket connected: ${user.fullName} (${user._id})`);

    socket.on("join-room", async (sessionId) => {
      try {
        const authResult = await canAccessClassroom(user, sessionId);
        if (authResult.error) {
          socket.emit("error", authResult.error);
          return;
        }

        const { session, role } = authResult;
        const roomId = session.meetingRoom;

        const participant = {
          userId: user._id.toString(),
          socketId: socket.id,
          role,
          displayName: user.fullName,
          joinedAt: new Date(),
        };

        classroom.joinRoom(roomId, participant);

        socket.join(roomId);

        socket.data.roomId = roomId;
        socket.data.role = role;
        socket.data.sessionId = sessionId;

        socket.emit("room-joined", {
          roomId,
          sessionId,
          role,
          participants: classroom.getParticipants(roomId),
        });

        socket.to(roomId).emit("participant-joined", {
          participant,
          participants: classroom.getParticipants(roomId),
        });

        socket.on("offer", (payload) => {
          socket.to(roomId).emit("offer", {
            ...payload,
            from: user._id.toString(),
          });
        });

        socket.on("answer", (payload) => {
          socket.to(roomId).emit("answer", {
            ...payload,
            from: user._id.toString(),
          });
        });

        socket.on("ice-candidate", (payload) => {
          socket.to(roomId).emit("ice-candidate", {
            ...payload,
            from: user._id.toString(),
          });
        });

        socket.on("leave-room", () => {
          classroom.leaveRoom(roomId, user._id.toString());
          socket.leave(roomId);

          socket.to(roomId).emit("participant-left", {
            userId: user._id.toString(),
            participants: classroom.getParticipants(roomId),
          });

          socket.data.roomId = null;
        });
      } catch (error) {
        socket.emit("error", "Failed to join classroom");
      }
    });

    socket.on("disconnect", async () => {
      const roomId = socket.data.roomId;
      if (roomId) {
        classroom.leaveRoom(roomId, user._id.toString());
        socket.to(roomId).emit("participant-left", {
          userId: user._id.toString(),
          participants: classroom.getParticipants(roomId),
        });
      }
      logger.info(`Socket disconnected: ${user.fullName} (${user._id})`);
    });
  });

  return io;
};
