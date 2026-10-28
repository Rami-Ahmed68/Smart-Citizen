import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import crypto from "node:crypto";
import { ApiError } from "../error/ApiError.js";

export const UPLOADS_BASE = "uploads";
export const CITIZENS_DIR = path.join(UPLOADS_BASE, "citizens");

if (!fs.existsSync(CITIZENS_DIR)) {
  fs.mkdirSync(CITIZENS_DIR, { recursive: true });
}

export async function deleteUploadedFile(filePath) {
  if (!filePath) return;
  try {
    await fsPromises.unlink(path.resolve(filePath));
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.error(`Failed to delete file "${filePath}":`, err.message);
    }
  }
}

export async function deleteUploadedFiles(filePaths = []) {
  if (!Array.isArray(filePaths) || filePaths.length === 0) return;
  await Promise.all(filePaths.map((p) => deleteUploadedFile(p)));
}

export function toStoredPath(reqFile) {
  if (!reqFile?.filename) return null;
  return `/${reqFile.filename}`;
}

export function toDiskPath(storedPhoto, folder = CITIZENS_DIR) {
  if (!storedPhoto) return null;
  const filename = path.basename(storedPhoto);
  return path.join(folder, filename);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, CITIZENS_DIR),
  filename: (req, file, cb) => {
    const uniqueId = crypto.randomBytes(16).toString("hex");
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `${timestamp}-${uniqueId}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(
      new ApiError(
        {
          en: "Only JPEG, PNG, and WebP images are allowed",
          ar: "يُسمح فقط بصور JPEG و PNG و WebP",
        },
        400,
      ),
    );
  }
  cb(null, true);
};

export const uploadCitizenPhoto = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("photo");
