import Admin from "../../features/admin/admin.model.js";
import { verifyToken, extractTokenFromHeader } from "../token/token.js";
import { ApiError } from "../../utils/error/ApiError.js";
import { isValidObjectId } from "../../utils/id/id.validations.js";

export function protect(...allowedRoles) {
  return async (req, res, next) => {
    const token = extractTokenFromHeader(req);
    const decoded = verifyToken(token);

    if (!isValidObjectId(decoded._id)) {
      throw new ApiError(
        {
          en: "Invalid admin ID in token.",
          ar: "معرف الأدمن في التوكن غير صالح.",
        },
        401,
      );
    }

    const admin = await Admin.findById(decoded._id);

    if (!admin) {
      throw new ApiError(
        {
          en: "The admin belonging to this token no longer exists.",
          ar: "الأدمن المرتبط بهذا التوكن لم يعد موجودًا.",
        },
        401,
      );
    }

    if (!admin.isActive) {
      throw new ApiError(
        {
          en: "Your account has been deactivated.",
          ar: "تم تعطيل حسابك.",
        },
        403,
      );
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(admin.role)) {
      throw new ApiError(
        {
          en: "You do not have permission to perform this action.",
          ar: "ليس لديك صلاحية لتنفيذ هذا الإجراء.",
        },
        403,
      );
    }

    req.admin = admin;
    req.decodedToken = decoded;
    next();
  };
}
