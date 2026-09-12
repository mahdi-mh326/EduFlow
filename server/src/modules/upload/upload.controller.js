import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Readable } from "stream";
import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import ApiError from "../../shared/ApiError.js";
import env from "../../config/env.js";
import cloudinary, { uploadStreamToCloudinary } from "../../config/cloudinary.js";
import logger from "../../shared/logger.js";

const getFileTypeCategory = (mimetype = "", filename = "") => {
  const ext = path.extname(filename).toLowerCase();
  const mime = mimetype.toLowerCase();

  if (mime.startsWith("image/") || [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"].includes(ext)) {
    return "image";
  }
  if (mime.startsWith("video/") || [".mp4", ".mov", ".avi", ".mkv", ".webm"].includes(ext)) {
    return "video";
  }
  if (mime.startsWith("audio/") || [".mp3", ".wav", ".ogg", ".m4a"].includes(ext)) {
    return "audio";
  }
  if (mime.includes("pdf") || ext === ".pdf") {
    return "pdf";
  }
  if (
    mime.includes("word") ||
    mime.includes("officedocument.wordprocessingml") ||
    [".doc", ".docx"].includes(ext)
  ) {
    return "doc";
  }
  if (
    mime.includes("presentation") ||
    mime.includes("powerpoint") ||
    [".ppt", ".pptx"].includes(ext)
  ) {
    return "presentation";
  }
  if (
    mime.includes("spreadsheet") ||
    mime.includes("excel") ||
    [".xls", ".xlsx", ".csv"].includes(ext)
  ) {
    return "spreadsheet";
  }
  if (
    mime.includes("zip") ||
    mime.includes("compressed") ||
    mime.includes("tar") ||
    [".zip", ".rar", ".7z", ".tar", ".gz"].includes(ext)
  ) {
    return "archive";
  }
  return "other";
};

const __serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const getUploadsBaseDir = () => path.join(__serverRoot, "public", "uploads");

const uploadFile = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No file uploaded.");
  }

  const rawFolder = req.body.folder || req.query.folder || "eduflow/materials";
  const sanitizedFolder = rawFolder.replace(/[^a-zA-Z0-9_-]/g, "/");
  const fileType = getFileTypeCategory(req.file.mimetype, req.file.originalname);
  const resource_type = fileType === "image" ? "image" : fileType === "video" ? "video" : "raw";

  const ext = (path.extname(req.file.originalname) || (fileType === "pdf" ? ".pdf" : "")).toLowerCase();
  const rawBase = path.basename(req.file.originalname, ext);
  const cleanBase = rawBase.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40) || "file";
  const uniqueFileName = `${cleanBase}_${Date.now()}${ext}`;

  // 1. Always save to local public/uploads directory for 100% reliable local access & proxying
  const targetDir = path.join(getUploadsBaseDir(), sanitizedFolder);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  const localFilePath = path.join(targetDir, uniqueFileName);
  fs.writeFileSync(localFilePath, req.file.buffer);

  const baseUrl = env.backendUrl || "http://localhost:5000";
  const localUrl = `${baseUrl}/uploads/${sanitizedFolder}/${uniqueFileName}`;

  // 2. Also attempt Cloudinary upload in background / fallback if desired
  let publicId = uniqueFileName;
  if (fileType === "image") {
    try {
      const cloudRes = await uploadStreamToCloudinary(req.file.buffer, {
        folder: rawFolder,
        resource_type,
        public_id: uniqueFileName,
      });
      if (cloudRes?.url) {
        publicId = cloudRes.publicId || uniqueFileName;
      }
    } catch {
      // Cloudinary error ignored for local resilience
    }
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "File uploaded successfully.",
    data: {
      url: localUrl,
      publicId,
      originalName: req.file.originalname,
      fileType,
      format: ext.replace(".", "") || fileType,
      bytes: req.file.buffer.length,
    },
  });
});

const proxyFile = catchAsync(async (req, res) => {
  const { url, name, download, fileType: queryFileType } = req.query;
  if (!url) {
    throw new ApiError(400, "File URL is required.");
  }

  // Remove restrictive Helmet headers so browser inline previews and downloads work seamlessly
  res.removeHeader("Content-Security-Policy");
  res.removeHeader("X-Frame-Options");
  res.removeHeader("Cross-Origin-Opener-Policy");
  res.removeHeader("X-Download-Options");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

  let buffer = null;
  let sourceContentType = "";

  let targetUrl = null;
  try {
    targetUrl = new URL(url);
  } catch {
    // Might be a relative path like /uploads/...
  }

  const urlPath = targetUrl ? targetUrl.pathname : url;

  // 1. Check if the file is in local public/uploads directory
  if (urlPath.includes("/uploads/")) {
    const rel = urlPath.substring(urlPath.indexOf("/uploads/"));
    const localPath = path.join(__serverRoot, "public", rel);
    if (fs.existsSync(localPath)) {
      buffer = fs.readFileSync(localPath);
    }
  }

  // 2. If not found locally, search for filename in public/uploads recursively
  if (!buffer) {
    const baseName = path.basename(urlPath);
    if (baseName && baseName !== "raw" && baseName !== "upload") {
      const findInDir = (dir) => {
        if (!fs.existsSync(dir)) return null;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            const found = findInDir(full);
            if (found) return found;
          } else if (entry.name === baseName) {
            return full;
          }
        }
        return null;
      };
      const foundFile = findInDir(getUploadsBaseDir());
      if (foundFile) {
        buffer = fs.readFileSync(foundFile);
      }
    }
  }

  // 3. If still not found, fetch from remote source (e.g. Cloudinary)
  if (!buffer && targetUrl) {
    let response = await fetch(targetUrl.toString());

    if (!response.ok) {
      // If Cloudinary returned 401 or 403, attempt signed private download
      if (
        (response.status === 401 || response.status === 403) &&
        targetUrl.hostname.includes("cloudinary.com")
      ) {
        try {
          const match = targetUrl.pathname.match(
            /\/(image|raw|video)\/upload\/(?:v\d+\/)?(.+?)(?:\.([a-zA-Z0-9]+))?$/
          );
          if (match) {
            const resourceType = match[1];
            const pubId = match[2];
            const fmt = match[3] || "";
            const privUrl = cloudinary.utils.private_download_url(pubId, fmt, {
              resource_type: resourceType,
            });
            const retryResp = await fetch(privUrl);
            if (retryResp.ok) {
              response = retryResp;
            }
          }
        } catch {
          // ignore
        }
      }
    }

    if (response.ok) {
      sourceContentType = response.headers.get("content-type") || "";
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }
  }

  if (!buffer) {
    throw new ApiError(404, "File not found or unable to fetch source.");
  }

  // Detect True MIME Type & File Extension using Magic Bytes
  let detectedMime = sourceContentType;
  let detectedExt = "";

  if (buffer.length >= 4) {
    const headerHex = buffer.subarray(0, 8).toString("hex");
    const headerStr = buffer.subarray(0, 8).toString("latin1");

    if (headerStr.startsWith("%PDF")) {
      detectedMime = "application/pdf";
      detectedExt = ".pdf";
    } else if (headerHex.startsWith("ffd8ff")) {
      detectedMime = "image/jpeg";
      detectedExt = ".jpg";
    } else if (headerHex.startsWith("89504e47")) {
      detectedMime = "image/png";
      detectedExt = ".png";
    } else if (headerHex.startsWith("47494638")) {
      detectedMime = "image/gif";
      detectedExt = ".gif";
    } else if (headerStr.startsWith("RIFF") && headerStr.includes("WEBP")) {
      detectedMime = "image/webp";
      detectedExt = ".webp";
    } else if (headerHex.startsWith("504b0304")) {
      // ZIP or OpenXML Document (docx / xlsx / pptx)
      const urlExt = path.extname(urlPath).toLowerCase();
      const nameExt = name ? path.extname(name).toLowerCase() : "";
      const chosenExt = nameExt || urlExt;
      if (chosenExt === ".docx") {
        detectedMime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        detectedExt = ".docx";
      } else if (chosenExt === ".xlsx") {
        detectedMime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        detectedExt = ".xlsx";
      } else if (chosenExt === ".pptx") {
        detectedMime = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
        detectedExt = ".pptx";
      } else {
        detectedMime = "application/zip";
        detectedExt = ".zip";
      }
    }
  }

  // Secondary detection via URL or Name extension
  if (!detectedExt) {
    const urlExt = path.extname(urlPath).toLowerCase();
    const nameExt = name ? path.extname(name).toLowerCase() : "";
    detectedExt = nameExt || urlExt;

    if (detectedExt === ".pdf") detectedMime = "application/pdf";
    else if (detectedExt === ".doc") detectedMime = "application/msword";
    else if (detectedExt === ".docx")
      detectedMime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    else if (detectedExt === ".xls") detectedMime = "application/vnd.ms-excel";
    else if (detectedExt === ".xlsx")
      detectedMime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    else if (detectedExt === ".ppt") detectedMime = "application/vnd.ms-powerpoint";
    else if (detectedExt === ".pptx")
      detectedMime = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    else if (detectedExt === ".zip") detectedMime = "application/zip";
    else if (detectedExt === ".rar") detectedMime = "application/x-rar-compressed";
    else if (detectedExt === ".jpg" || detectedExt === ".jpeg") detectedMime = "image/jpeg";
    else if (detectedExt === ".png") detectedMime = "image/png";
    else if (detectedExt === ".webp") detectedMime = "image/webp";
  }

  // Explicit query hint fallback
  if (queryFileType === "pdf" || (!detectedExt && urlPath.includes(".pdf"))) {
    detectedMime = "application/pdf";
    detectedExt = ".pdf";
  }

  if (!detectedMime || detectedMime === "application/octet-stream" || detectedMime === "text/plain") {
    detectedMime = detectedExt === ".pdf" ? "application/pdf" : "application/octet-stream";
  }

  // Construct a clean, human-friendly filename WITH extension
  let resolvedFileName = name ? name.trim() : path.basename(urlPath);
  if (!resolvedFileName || resolvedFileName === "/" || resolvedFileName === "raw" || resolvedFileName === "download") {
    resolvedFileName = `document_${Date.now()}`;
  }
  // Sanitize filename for safe Content-Disposition
  resolvedFileName = resolvedFileName.replace(/[/\\?%*:|"<>]/g, "_");

  // Ensure resolvedFileName has the detected extension
  if (detectedExt && !resolvedFileName.toLowerCase().endsWith(detectedExt)) {
    resolvedFileName = `${resolvedFileName}${detectedExt}`;
  }

  const isDownload = download === "1" || download === "true";
  const isRenderable =
    detectedMime.startsWith("image/") ||
    detectedMime === "application/pdf" ||
    detectedMime.startsWith("video/") ||
    detectedMime.startsWith("audio/") ||
    detectedMime === "text/plain";

  const disposition = isDownload || !isRenderable ? "attachment" : "inline";

  res.setHeader("Content-Type", detectedMime);
  res.setHeader(
    "Content-Disposition",
    `${disposition}; filename="${encodeURIComponent(resolvedFileName)}"; filename*=UTF-8''${encodeURIComponent(resolvedFileName)}`
  );
  res.setHeader("Content-Length", buffer.length);

  res.send(buffer);
});

export const UploadController = {
  uploadFile,
  proxyFile,
};

