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
  if (req.admin?._id) return req.admin._id.toString();
  return ipKeyGenerator(req.ip);
};

export const createCitizenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: buildKeyGenerator,
  handler: buildHandler(
    "Too many citizens created. Please try again in 15 minutes.",
    "تم إنشاء عدد كبير من المواطنين. يرجى المحاولة بعد 15 دقيقة.",
  ),
});

export const getAllCitizensLimiter = rateLimit({
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

export const getOneCitizenLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: buildKeyGenerator,
  handler: buildHandler(
    "Too many requests. Please slow down.",
    "عدد كبير من الطلبات. يرجى التمهّل.",
  ),
});

export const updateRelationsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: buildKeyGenerator,
  handler: buildHandler(
    "Too many relation updates. Please try again in 15 minutes.",
    "عدد كبير من تعديلات العلاقات. يرجى المحاولة بعد 15 دقيقة.",
  ),
});

export const updateCitizenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: buildKeyGenerator,
  handler: buildHandler(
    "Too many update attempts. Please try again in 15 minutes.",
    "عدد كبير من محاولات التحديث. يرجى المحاولة بعد 15 دقيقة.",
  ),
});

export const deleteCitizenLimiter = rateLimit({
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
