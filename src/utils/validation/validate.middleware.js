import { deleteUploadedFile } from "../upload/multer.upload.js";

const SEPARATOR = " splithere ";

const extractBilingual = (message) => {
  if (!message) {
    return { en: "Validation failed", ar: "فشل التحقق" };
  }

  if (typeof message === "object" && message.en && message.ar) {
    return { en: message.en, ar: message.ar };
  }

  if (typeof message === "string" && message.includes(SEPARATOR)) {
    const [en, ar] = message.split(SEPARATOR);
    return { en: en.trim(), ar: (ar || en).trim() };
  }

  return { en: message, ar: message };
};

const deleteUploadedFiles = async (req) => {
  if (req.file?.path) {
    await deleteUploadedFile(req.file.path);
  }

  if (!req.files) return;

  try {
    const allFiles = Array.isArray(req.files)
      ? req.files
      : Object.values(req.files).flat();

    await Promise.all(
      allFiles
        .filter((f) => f && f.path)
        .map((f) => deleteUploadedFile(f.path)),
    );
  } catch (err) {
    console.error("Error deleting uploaded files:", err);
  }
};

const buildErrorResponse = (error) => {
  const details = error.details.map((d) => ({
    field: d.path.join("."),
    message: extractBilingual(d.message),
  }));

  const enMessage = details.map((d) => d.message.en).join(". ");
  const arMessage = details.map((d) => d.message.ar).join("، ");

  return {
    success: false,
    status: "fail",
    statusCode: 400,
    message: {
      en: enMessage || "Validation failed",
      ar: arMessage || "فشل التحقق",
    },
    details,
  };
};

export const validate = (schema, source = "body") => {
  return async (req, res, next) => {
    try {
      const data = req[source] ?? req.body;

      const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: false,
        convert: true,
      });

      if (error) {
        if (req.file || req.files) await deleteUploadedFiles(req);
        return res.status(400).json(buildErrorResponse(error));
      }

      req.validated = value;
      next();
    } catch (err) {
      if (req.file || req.files) await deleteUploadedFiles(req);
      next(err);
    }
  };
};

export const cleanupFilesOnError = (req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    if (res.statusCode >= 400 && (req.file || req.files)) {
      deleteUploadedFiles(req).catch(console.error);
    }
    return originalJson.call(this, data);
  };

  next();
};
