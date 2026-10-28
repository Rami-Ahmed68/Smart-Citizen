import { ApiError } from "../../utils/error/ApiError.js";

export const Global = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const status =
    err.status || (statusCode.toString().startsWith("4") ? "fail" : "error");

  let messageEn = err.messageEn || err.message || "Internal Server Error";
  let messageAr = err.messageAr || err.message || "خطأ داخلي في الخادم";

  if (err.name === "ValidationError") {
    const fields = Object.values(err.errors)
      .map((e) => e.path)
      .join(", ");
    messageEn = `Invalid data in fields: ${fields}`;
    messageAr = `بيانات غير صالحة في الحقول: ${fields}`;
  } else if (err.name === "CastError") {
    messageEn = `Invalid value for field: ${err.path}`;
    messageAr = `قيمة غير صالحة للحقل: ${err.path}`;
  } else if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = Object.values(err.keyValue)[0];
    messageEn = `Duplicate value for field "${field}": ${value}`;
    messageAr = `القيمة مكررة في الحقل "${field}": ${value}`;
  } else if (err.name === "JsonWebTokenError") {
    messageEn = "Invalid token";
    messageAr = "رمز غير صالح";
  } else if (err.name === "TokenExpiredError") {
    messageEn = "Token expired, please log in again";
    messageAr = "انتهت صلاحية الرمز، يرجى تسجيل الدخول مجددًا";
  }

  if (Array.isArray(messageEn)) messageEn = messageEn.join(". ");
  if (Array.isArray(messageAr)) messageAr = messageAr.join("، ");

  const message = { en: messageEn, ar: messageAr };

  res.status(statusCode).json({
    success: false,
    status,
    statusCode,
    message,
  });
};

export const notFound = (req, res, next) => {
  next(
    new ApiError(
      {
        ar: "المسار المطلوب غير موجود",
        en: "The requested resource was not found",
      },
      404,
    ),
  );
};
