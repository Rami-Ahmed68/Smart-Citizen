import { ApiError } from "../../utils/error/ApiError.js";

export const NotFound = (req, res, next) => {
  return next(
    new ApiError(
      {
        en: "The requested resource was not found on this server",
        ar: "المورد المطلوب غير موجود على هذا الخادم",
      },
      404,
    ),
  );
};
