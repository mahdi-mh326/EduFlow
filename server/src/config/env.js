import dotenv from "dotenv";

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT,

  clientUrl: process.env.CLIENT_URL,

  mongodbUri: process.env.MONGODB_URI,

  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES,

  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES,

  brevoApiKey: process.env.BREVO_API_KEY,
  emailFrom: process.env.EMAIL_FROM,

  superAdminName: process.env.SUPER_ADMIN_NAME,
  superAdminEmail: process.env.SUPER_ADMIN_EMAIL,
  superAdminPhone: process.env.SUPER_ADMIN_PHONE,
  superAdminPassword: process.env.SUPER_ADMIN_PASSWORD,

  aiProvider: process.env.AI_PROVIDER || "gemini",
  aiApiKey: process.env.GEMINI_API_KEY || process.env.AI_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.AI_API_KEY,
  aiModel: process.env.AI_MODEL || "gemini-3.1-flash-lite",
  aiBaseURL: process.env.AI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta",
  aiTimeout: process.env.AI_TIMEOUT || "30000",

  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "r2q5ywkk",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "581934686522572",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "KYnmBKMkG965WSMDXRMCz7acQcA",

  backendUrl: process.env.BACKEND_URL || (process.env.NODE_ENV === "production" ? "https://eduflow-backend-eqb1.onrender.com" : "http://localhost:5000"),
  sslStoreId: process.env.SSL_STORE_ID || "hexby6a743d31c9023",
  sslStorePassword: process.env.SSL_STORE_PASSWORD || "hexby6a743d31c9023@ssl",
  sslIsLive: process.env.SSL_IS_LIVE === "true",
  paymentSuccessUrl: process.env.PAYMENT_SUCCESS_URL,
  paymentFailUrl: process.env.PAYMENT_FAIL_URL,
  paymentCancelUrl: process.env.PAYMENT_CANCEL_URL,
  paymentIpnUrl: process.env.PAYMENT_IPN_URL,
};




export default env;
