import { ApiError } from "../../utils/error/ApiError.js";

export function requirePermission(...requiredPermissions) {
  return (req, res, next) => {
    if (!req.admin) {
      throw new ApiError(
        {
          en: "Authentication required. Please log in.",
          ar: "المصادقة مطلوبة. يرجى تسجيل الدخول.",
        },
        401,
      );
    }

    if (req.admin.role === "super") {
      return next();
    }

    const adminPermissions = Array.isArray(req.admin.permissions)
      ? req.admin.permissions
      : [];

    const hasAllPermissions = requiredPermissions.every((permission) =>
      adminPermissions.includes(permission),
    );

    if (!hasAllPermissions) {
      const missing = requiredPermissions.filter(
        (permission) => !adminPermissions.includes(permission),
      );

      throw new ApiError(
        {
          en: `Insufficient permissions. Missing: ${missing.join(", ")}.`,
          ar: `صلاحيات غير كافية. المفقودة: ${missing.join("، ")}.`,
        },
        403,
      );
    }

    next();
  };
}
