import { ApiError } from "../../utils/error/ApiError";

export const NotFound = (req, res, next) => {
  const error = new ApiError(
    {
      en: "The requested resource was not found on this server",
      ar: "المورد المطلوب غير موجود على هذا الخادم",
    },
    404,
  );
  next(error);
};
