import Joi from "joi";
import mongoose from "mongoose";

export function isValidObjectId(value) {
  if (!value || typeof value !== "string") return false;
  return mongoose.Types.ObjectId.isValid(value.trim());
}

export const objectIdSchema = Joi.string()
  .trim()
  .custom((value, helpers) => {
    if (!isValidObjectId(value)) {
      return helpers.error("any.invalid");
    }
    return value;
  }, "ObjectId Validation")
  .messages({
    "string.base": "ID must be text splithere المعرف يجب أن يكون نصًا",
    "string.empty": "ID is required splithere المعرف مطلوب",
    "any.invalid": "Invalid ID format splithere صيغة المعرف غير صالحة",
    "any.required": "ID is required splithere المعرف مطلوب",
  });
