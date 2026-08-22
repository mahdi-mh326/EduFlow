import bcrypt from "bcrypt";
import OTP from "./otp.model.js";
import ApiError from "../../shared/ApiError.js";

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTP = async (email) => {
  const otp = generateOTP();
  const hashedOTP = await bcrypt.hash(otp, 10);

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  const result = await OTP.findOneAndUpdate(
    { email },
    {
      email,
      otp: hashedOTP,
      expiresAt,
      attempts: 0,
      verified: false,
    },
    { upsert: true, new: true }
  );

  return otp;
};

const verifyOTP = async (email, otp) => {
  const otpRecord = await OTP.findOne({ email });

  if (!otpRecord) {
    throw new ApiError(404, "OTP not found");
  }

  if (new Date() > otpRecord.expiresAt) {
    await OTP.deleteOne({ email });
    throw new ApiError(400, "OTP expired");
  }

  if (otpRecord.attempts >= 3) {
    await OTP.deleteOne({ email });
    throw new ApiError(400, "Too many attempts. Please request a new OTP");
  }

  const isOTPValid = await bcrypt.compare(otp, otpRecord.otp);

  if (!isOTPValid) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    throw new ApiError(400, "Invalid OTP");
  }

  await OTP.deleteOne({ email });

  return true;
};

export const OTPService = {
  generateOTP,
  sendOTP,
  verifyOTP,
};
