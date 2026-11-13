import rateLimit from "express-rate-limit";

export const dashboardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    status: "error",
    statusCode: 429,
    message: {
      en: "Too many dashboard requests. Please try again later.",
      ar: "طلبات لوحة التحكم كثيرة جدًا. يرجى المحاولة لاحقًا.",
    },
  },
});
