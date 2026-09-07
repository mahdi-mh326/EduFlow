import { Readable } from "stream";
import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import ApiError from "../../shared/ApiError.js";
import cloudinary, { uploadStreamToCloudinary } from "../../config/cloudinary.js";
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
  const resource_type = fileType === "image" ? "image" : "raw";

  const uploadResult = await uploadStreamToCloudinary(req.file.buffer, {
    folder,
    resource_type,
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

const proxyFile = catchAsync(async (req, res) => {
  const { url, name, download } = req.query;
  if (!url) {
    throw new ApiError(400, "File URL is required.");
  }

  let targetUrl;
  try {
    targetUrl = new URL(url);
    if (!["http:", "https:"].includes(targetUrl.protocol)) {
      throw new Error();
    }
  } catch {
    throw new ApiError(400, "Invalid file URL.");
  }

  let response = await fetch(targetUrl.toString());

  // If Cloudinary returned 401 or 403 on a Cloudinary URL, attempt private_download_url fallback
  if (!response.ok && (response.status === 401 || response.status === 403) && targetUrl.hostname.includes("cloudinary.com")) {
    try {
      const match = targetUrl.pathname.match(/\/(image|raw|video)\/upload\/(?:v\d+\/)?(.+?)(?:\.([a-zA-Z0-9]+))?$/);
      if (match) {
        const resourceType = match[1];
        const publicId = match[2];
        const format = match[3] || "";
        const privUrl = cloudinary.utils.private_download_url(publicId, format, { resource_type: resourceType });
        const retryResp = await fetch(privUrl);
        if (retryResp.ok) {
          response = retryResp;
        }
      }
    } catch {
      // Fallback attempt failed, proceed with original response check
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, "Failed to fetch file from source.");
  }

  const fileName = name || path.basename(targetUrl.pathname) || "download";
  const ext = path.extname(fileName).toLowerCase();

  let contentType = response.headers.get("content-type");
  if (!contentType || contentType === "application/octet-stream" || contentType === "text/plain") {
    if (ext === ".pdf") contentType = "application/pdf";
    else if (ext === ".doc") contentType = "application/msword";
    else if (ext === ".docx") contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    else if (ext === ".xls") contentType = "application/vnd.ms-excel";
    else if (ext === ".xlsx") contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    else if (ext === ".ppt") contentType = "application/vnd.ms-powerpoint";
    else if (ext === ".pptx") contentType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    else if (ext === ".zip") contentType = "application/zip";
    else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".png") contentType = "image/png";
    else if (ext === ".webp") contentType = "image/webp";
    else contentType = "application/octet-stream";
  }

  const isDownload = download === "1" || download === "true";
  const disposition = isDownload ? "attachment" : "inline";

  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `${disposition}; filename="${encodeURIComponent(fileName)}"`);
  const contentLength = response.headers.get("content-length");
  if (contentLength) {
    res.setHeader("Content-Length", contentLength);
  }

  if (response.body) {
    Readable.fromWeb(response.body).pipe(res);
  } else {
    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  }
});

export const UploadController = {
  uploadFile,
  proxyFile,
};
