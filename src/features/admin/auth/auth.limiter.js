import rateLimit, { ipKeyGenerator } from "express-rate-limit";

const buildHandler = (enMsg, arMsg) => (req, res) => {
  res.status(429).json({
    success: false,
    status: "fail",
    statusCode: 429,
    message: { en: enMsg, ar: arMsg },
  });
};

export const LogInLimiter = rateLimit({
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

export const RefreshTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const refreshToken = req.body?.old_refresh_token || "unknown";
    const lastChars = refreshToken.slice(-16);
    return `${ipKeyGenerator(req.ip)}:${lastChars}`;
  },
  handler: buildHandler(
    "Too many refresh attempts. Please try again in 15 minutes.",
    "عدد كبير من محاولات التجديد. يرجى المحاولة بعد 15 دقيقة.",
  ),
});
