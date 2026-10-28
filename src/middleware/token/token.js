import jwt from "jsonwebtoken";
import { ApiError } from "../../utils/error/ApiError.js";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    "❌ JWT_SECRET is not defined. Add it to .env before starting the server.",
  );
}

if (JWT_SECRET.length < 32) {
  throw new Error(
    "❌ JWT_SECRET must be at least 32 characters long for security.",
  );
}

export function generateToken(payload) {
  if (!payload || typeof payload !== "object") {
    throw new ApiError(
      { en: "Invalid token payload", ar: "بيانات التوكن غير صالحة" },
      500,
    );
  }

  try {
    return jwt.sign(payload, JWT_SECRET);
  } catch (err) {
    throw new ApiError(
      {
        en: "Failed to generate authentication token",
        ar: "فشل إنشاء توكن المصادقة",
      },
      500,
    );
  }
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new ApiError(
        {
          en: "Token has expired. Please log in again.",
          ar: "انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجددًا.",
        },
        401,
      );
    }

    if (err.name === "JsonWebTokenError") {
      throw new ApiError(
        { en: "Invalid authentication token", ar: "توكن مصادقة غير صالح" },
        401,
      );
    }

    if (err.name === "NotBeforeError") {
      throw new ApiError(
        { en: "Token is not active yet", ar: "التوكن غير نشط بعد" },
        401,
      );
    }

    throw new ApiError(
      { en: "Token verification failed", ar: "فشل التحقق من التوكن" },
      401,
    );
  }
}

export function decodeToken(token) {
  const decoded = jwt.decode(token, { complete: true });

  if (!decoded) {
    throw new ApiError(
      { en: "Invalid token format", ar: "صيغة التوكن غير صالحة" },
      400,
    );
  }

  return decoded;
}

export function extractTokenFromHeader(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new ApiError(
      {
        en: "Not logged in. Please log in to access this resource.",
        ar: "غير مسجل الدخول. يرجى تسجيل الدخول للوصول إلى هذا المورد.",
      },
      401,
    );
  }

  if (!authHeader.startsWith("Bearer ")) {
    throw new ApiError(
      {
        en: "Invalid authorization header format. Expected: Bearer <token>",
        ar: "صيغة ترويسة التفويض غير صالحة. المتوقع: Bearer <token>",
      },
      401,
    );
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    throw new ApiError(
      { en: "Authentication token is missing", ar: "توكن المصادقة مفقود" },
      401,
    );
  }

  return token;
}
