import Admin from "../admin.model.js";
import RefreshToken from "../../refresh.token/refresh.token.model.js";
import _ from "lodash";
import { ApiError } from "../../../utils/error/ApiError.js";
import { comparePassword } from "../../../middleware/password/bcrypt.js";
import {
  generateToken,
  verifyToken,
  decodeToken,
} from "../../../middleware/token/token.js";

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/admin/auth",
};

export const LogIn = async (req, res, next) => {
  try {
    const { email, password } = req.validated;

    const exists_account = await Admin.findOne({ email }).select("+password");

    if (!exists_account) {
      return next(
        new ApiError(
          {
            en: "Sorry, invalid email or password",
            ar: "عذرًا، خطأ في البريد أو كلمة المرور",
          },
          401,
        ),
      );
    }

    const isMatch = await comparePassword(password, exists_account.password);

    if (!isMatch) {
      return next(
        new ApiError(
          {
            en: "Sorry, invalid email or password",
            ar: "عذرًا، خطأ في البريد أو كلمة المرور",
          },
          401,
        ),
      );
    }

    if (!exists_account.isActive) {
      return next(
        new ApiError(
          {
            en: "Your account is deactivated. Contact the administration.",
            ar: "حسابك معطّل. تواصل مع الإدارة.",
          },
          403,
        ),
      );
    }

    const payload = {
      _id: exists_account._id,
      role: exists_account.role,
      permissions: exists_account.permissions,
    };

    const access_token = generateToken(payload, "access");
    const refresh_token = generateToken(payload, "refresh");

    const decoded = decodeToken(refresh_token);
    const expires_at = new Date(decoded.payload.exp * 1000);

    await RefreshToken.deleteMany({ admin: exists_account._id });
    await RefreshToken.create({
      token: refresh_token,
      admin: exists_account._id,
      expires_at,
      userAgent: req.headers["user-agent"] || null,
      ipAddress: req.ip || null,
    });

    res.cookie("refresh_token", refresh_token, REFRESH_COOKIE_OPTIONS);

    const adminData = _.pick(exists_account.toObject(), [
      "_id",
      "first_name",
      "last_name",
      "email",
      "avatar",
      "role",
      "permissions",
    ]);

    return res.status(200).json({
      success: true,
      status: "success",
      statusCode: 200,
      message: {
        en: "Logged in successfully",
        ar: "تم تسجيل الدخول بنجاح",
      },
      data: {
        admin: adminData,
        access_token,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const RefreshTokenMethod = async (req, res, next) => {
  try {
    const old_refresh_token = req.cookies?.refresh_token;

    if (!old_refresh_token) {
      return next(
        new ApiError(
          {
            en: "Refresh token is required",
            ar: "توكن التجديد مطلوب",
          },
          401,
        ),
      );
    }

    const decoded = verifyToken(old_refresh_token);

    const storedToken = await RefreshToken.findOne({
      token: old_refresh_token,
    }).lean();

    if (!storedToken) {
      await RefreshToken.deleteMany({ admin: decoded._id });
      res.clearCookie("refresh_token", REFRESH_COOKIE_OPTIONS);

      return next(
        new ApiError(
          {
            en: "Refresh token has been revoked. Please log in again.",
            ar: "تم إبطال توكن التجديد. يرجى تسجيل الدخول مجددًا.",
          },
          401,
        ),
      );
    }

    if (new Date(storedToken.expires_at) < new Date()) {
      await RefreshToken.deleteOne({ _id: storedToken._id });
      res.clearCookie("refresh_token", REFRESH_COOKIE_OPTIONS);

      return next(
        new ApiError(
          {
            en: "Refresh token has expired. Please log in again.",
            ar: "انتهت صلاحية توكن التجديد. يرجى تسجيل الدخول مجددًا.",
          },
          401,
        ),
      );
    }

    const admin = await Admin.findById(decoded._id);

    if (!admin) {
      await RefreshToken.deleteOne({ _id: storedToken._id });
      res.clearCookie("refresh_token", REFRESH_COOKIE_OPTIONS);

      return next(
        new ApiError(
          {
            en: "Admin no longer exists",
            ar: "الأدمن لم يعد موجودًا",
          },
          401,
        ),
      );
    }

    if (!admin.isActive) {
      await RefreshToken.deleteMany({ admin: admin._id });
      res.clearCookie("refresh_token", REFRESH_COOKIE_OPTIONS);

      return next(
        new ApiError(
          {
            en: "Your account is deactivated. Contact the administration.",
            ar: "حسابك معطّل. تواصل مع الإدارة.",
          },
          403,
        ),
      );
    }

    const payload = {
      _id: admin._id,
      role: admin.role,
      permissions: admin.permissions,
    };

    const access_token = generateToken(payload, "access");
    const new_refresh_token = generateToken(payload, "refresh");

    const decodedNew = decodeToken(new_refresh_token);
    const new_expires_at = new Date(decodedNew.payload.exp * 1000);

    await RefreshToken.deleteOne({ _id: storedToken._id });
    await RefreshToken.create({
      token: new_refresh_token,
      admin: admin._id,
      expires_at: new_expires_at,
      userAgent: req.headers["user-agent"] || null,
      ipAddress: req.ip || null,
    });

    res.cookie("refresh_token", new_refresh_token, REFRESH_COOKIE_OPTIONS);

    return res.status(200).json({
      success: true,
      status: "success",
      statusCode: 200,
      message: {
        en: "Tokens refreshed successfully",
        ar: "تم تجديد التوكنات بنجاح",
      },
      data: {
        access_token,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const LogOut = async (req, res, next) => {
  try {
    const refresh_token = req.cookies?.refresh_token;

    if (refresh_token) {
      await RefreshToken.deleteOne({ token: refresh_token });
    }

    res.clearCookie("refresh_token", REFRESH_COOKIE_OPTIONS);

    return res.status(200).json({
      success: true,
      status: "success",
      statusCode: 200,
      message: {
        en: "Logged out successfully",
        ar: "تم تسجيل الخروج بنجاح",
      },
    });
  } catch (error) {
    return next(error);
  }
};
