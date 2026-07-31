import jwt from "jsonwebtoken";
import env from "../../config/env.js";
import ApiError from "../../shared/ApiError.js";

const generateAccessToken = (payload) => {
  try {
    return jwt.sign(payload, env.jwtAccessSecret, {
      expiresIn: env.jwtAccessExpires,
    });
  } catch (error) {
    throw new ApiError(500, "Failed to generate access token");
  }
};

const generateRefreshToken = (payload) => {
  try {
    return jwt.sign(payload, env.jwtRefreshSecret, {
      expiresIn: env.jwtRefreshExpires,
    });
  } catch (error) {
    throw new ApiError(500, "Failed to generate refresh token");
  }
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, env.jwtAccessSecret);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Access token expired");
    }
    throw new ApiError(401, "Invalid access token");
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, env.jwtRefreshSecret);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Refresh token expired");
    }
    throw new ApiError(401, "Invalid refresh token");
  }
};

const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    throw new ApiError(400, "Failed to decode token");
  }
};

export const tokenUtils = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
};
