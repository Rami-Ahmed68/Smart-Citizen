import rateLimit, { ipKeyGenerator } from "express-rate-limit";

const buildHandler = (enMsg, arMsg) => (req, res) => {
  res.status(429).json({
    success: false,
    status: "fail",
    statusCode: 429,
    message: { en: enMsg, ar: arMsg },
  });
};

const buildKeyGenerator = (req) => {
  if (req.admin?._id) {
    return req.admin._id.toString();
  }
  return ipKeyGenerator(req.ip);
};

export const createAdminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: buildKeyGenerator,
  handler: buildHandler(
    "Too many admins created. Please try again in an hour.",
    "تم إنشاء عدد كبير من الحسابات. يرجى المحاولة بعد ساعة.",
  ),
});

export const changePasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: buildKeyGenerator,
  handler: buildHandler(
    "Too many password change attempts. Please try again in 15 minutes.",
    "عدد كبير من محاولات تغيير كلمة المرور. يرجى المحاولة بعد 15 دقيقة.",
  ),
});

export const adminReadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: buildKeyGenerator,
  handler: buildHandler(
    "Too many requests. Please slow down.",
    "عدد كبير من الطلبات. يرجى التمهّل.",
  ),
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = req.body?.email?.toLowerCase().trim() || "unknown";
    return `${ipKeyGenerator(req.ip)}:${email}`;
  },
  handler: buildHandler(
    "Too many login attempts. Please try again in 15 minutes.",
    "عدد كبير من محاولات تسجيل الدخول. يرجى المحاولة بعد 15 دقيقة.",
  ),
});

export const getAllLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: buildKeyGenerator,
  handler: buildHandler(
    "Too many requests. Please slow down.",
    "عدد كبير من الطلبات. يرجى التمهّل.",
  ),
});

export const getOneLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: buildKeyGenerator,
  handler: buildHandler(
    "Too many requests. Please slow down.",
    "عدد كبير من الطلبات. يرجى التمهّل.",
  ),
});

export const ToggleStatusLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: buildKeyGenerator,
  handler: buildHandler(
    "Too many status change attempts. Please try again in 15 minutes.",
    "عدد كبير من محاولات تغيير الحالة. يرجى المحاولة بعد 15 دقيقة.",
  ),
});

export const deleteAdminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: buildKeyGenerator,
  handler: buildHandler(
    "Too many delete attempts. Please try again in 15 minutes.",
    "عدد كبير من محاولات الحذف. يرجى المحاولة بعد 15 دقيقة.",
  ),
});

export const changeAdminPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: buildKeyGenerator,
  handler: buildHandler(
    "Too many password change attempts. Please try again in 15 minutes.",
    "عدد كبير من محاولات تغيير كلمة المرور. يرجى المحاولة بعد 15 دقيقة.",
  ),
});

export const changeMyPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: buildKeyGenerator,
  handler: buildHandler(
    "Too many password change attempts. Please try again in 15 minutes.",
    "عدد كبير من محاولات تغيير كلمة المرور. يرجى المحاولة بعد 15 دقيقة.",
  ),
});

export const updateAdminDataLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: buildKeyGenerator,
  handler: buildHandler(
    "Too many update attempts. Please try again in 15 minutes.",
    "عدد كبير من محاولات التحديث. يرجى المحاولة بعد 15 دقيقة.",
  ),
});

export const updateMyDataLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: buildKeyGenerator,
  handler: buildHandler(
    "Too many update attempts. Please try again in 15 minutes.",
    "عدد كبير من محاولات التحديث. يرجى المحاولة بعد 15 دقيقة.",
  ),
});
