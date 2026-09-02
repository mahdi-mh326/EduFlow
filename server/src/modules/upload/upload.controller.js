import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import ApiError from "../../shared/ApiError.js";
import { uploadStreamToCloudinary } from "../../config/cloudinary.js";
import path from "path";

const getFileTypeCategory = (mimetype, filename) => {
  const ext = path.extname(filename).toLowerCase();
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.includes("pdf") || ext === ".pdf") return "pdf";
  if (
    mimetype.includes("word") ||
    mimetype.includes("officedocument.wordprocessingml") ||
    ext === ".doc" ||
    ext === ".docx"
  ) {
    return "doc";
  }
  if (
    mimetype.includes("presentation") ||
    mimetype.includes("powerpoint") ||
    ext === ".ppt" ||
    ext === ".pptx"
  ) {
    return "presentation";
  }
  if (
    mimetype.includes("spreadsheet") ||
    mimetype.includes("excel") ||
    ext === ".xls" ||
    ext === ".xlsx"
  ) {
    return "spreadsheet";
  }
  if (mimetype.includes("zip") || mimetype.includes("compressed") || ext === ".zip" || ext === ".rar") {
    return "archive";
  }
  return "other";
};

const uploadFile = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No file uploaded.");
  }

  const folder = req.body.folder || req.query.folder || "eduflow/materials";
  const fileType = getFileTypeCategory(req.file.mimetype, req.file.originalname);

  const uploadResult = await uploadStreamToCloudinary(req.file.buffer, {
    folder,
    resource_type: "auto",
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "File uploaded successfully.",
    data: {
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      originalName: req.file.originalname,
      fileType,
      format: uploadResult.format,
      bytes: uploadResult.bytes,
    },
  });
});

export const UploadController = {
  uploadFile,
};
