import rateLimit from "express-rate-limit";

const jsonMessage = (en, ar) => ({
  success: false,
  status: "error",
  statusCode: 429,
  message: { en, ar },
});

export const createFamilyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage(
    "Too many family creation attempts. Please try again later.",
    "محاولات إنشاء عائلة كثيرة جدًا. يرجى المحاولة لاحقًا.",
  ),
});

export const getAllFamiliesLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage(
    "Too many requests. Please try again later.",
    "طلبات كثيرة جدًا. يرجى المحاولة لاحقًا.",
  ),
});

export const getFamiliesByCitizenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage(
    "Too many citizen family lookups. Please try again later.",
    "محاولات جلب عائلات المواطن كثيرة جدًا. يرجى المحاولة لاحقًا.",
  ),
});

export const getOneFamilyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage(
    "Too many requests. Please try again later.",
    "طلبات كثيرة جدًا. يرجى المحاولة لاحقًا.",
  ),
});

export const updateFamilyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage(
    "Too many family update attempts. Please try again later.",
    "محاولات تحديث عائلة كثيرة جدًا. يرجى المحاولة لاحقًا.",
  ),
});

export const deleteFamilyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage(
    "Too many family deletion attempts. Please try again later.",
    "محاولات حذف عائلة كثيرة جدًا. يرجى المحاولة لاحقًا.",
  ),
});
