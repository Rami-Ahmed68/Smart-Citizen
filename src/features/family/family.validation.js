import Joi from "joi";
import { objectIdSchema } from "../../utils/id/id.validations.js";

export const CreateFamilyValidation = Joi.object({
  father: objectIdSchema.optional().allow(null).messages({
    "any.invalid":
      "Invalid father ID format splithere صيغة معرف الأب غير صالحة",
  }),

  mother: objectIdSchema.optional().allow(null).messages({
    "any.invalid":
      "Invalid mother ID format splithere صيغة معرف الأم غير صالحة",
  }),

  children_ids: Joi.array()
    .items(objectIdSchema)
    .unique()
    .optional()
    .default([])
    .messages({
      "array.base":
        "children_ids must be an array splithere معرفات الأبناء يجب أن تكون مصفوفة",
      "array.unique":
        "children_ids must not contain duplicates splithere معرفات الأبناء لا يمكن أن تتكرر",
      "any.invalid":
        "Invalid child ID format splithere صيغة معرف أحد الأبناء غير صالحة",
    }),
})
  .or("father", "mother")
  .messages({
    "object.missing":
      "At least one parent (father or mother) is required splithere يجب توفير الأب أو الأم على الأقل",
  });

export const GetAllFamiliesValidation = Joi.object({
  page: Joi.number().integer().min(1).max(10000).default(1).messages({
    "number.base": "Page must be a number splithere الصفحة يجب أن تكون رقمًا",
    "number.integer":
      "Page must be an integer splithere الصفحة يجب أن تكون عددًا صحيحًا",
    "number.min":
      "Page must be at least 1 splithere الصفحة يجب أن تكون 1 على الأقل",
    "number.max": "Page is too large splithere الصفحة كبيرة جدًا",
  }),

  limit: Joi.number().integer().min(1).max(100).default(20).messages({
    "number.base": "Limit must be a number splithere الحد يجب أن يكون رقمًا",
    "number.integer":
      "Limit must be an integer splithere الحد يجب أن يكون عددًا صحيحًا",
    "number.min":
      "Limit must be at least 1 splithere الحد يجب أن يكون 1 على الأقل",
    "number.max": "Limit must not exceed 100 splithere الحد يجب ألا يتجاوز 100",
  }),

  citizen_id: objectIdSchema.optional().messages({
    "any.invalid":
      "Invalid citizen ID format splithere صيغة معرف المواطن غير صالحة",
  }),

  relation: Joi.string()
    .valid("father", "mother", "child")
    .optional()
    .messages({
      "any.only":
        "Relation must be 'father', 'mother', or 'child' splithere علاقة المواطن يجب أن تكون 'father' أو 'mother' أو 'child'",
      "string.base":
        "Relation must be text splithere علاقة المواطن يجب أن تكون نصًا",
    }),

  father: objectIdSchema.optional().messages({
    "any.invalid":
      "Invalid father ID format splithere صيغة معرف الأب غير صالحة",
  }),

  mother: objectIdSchema.optional().messages({
    "any.invalid":
      "Invalid mother ID format splithere صيغة معرف الأم غير صالحة",
  }),

  added_by: objectIdSchema.optional().messages({
    "any.invalid":
      "Invalid admin ID format splithere صيغة معرف الموظف غير صالحة",
  }),

  has_father: Joi.boolean().optional().messages({
    "boolean.base":
      "has_father must be a boolean splithere has_father يجب أن تكون قيمة منطقية",
  }),

  has_mother: Joi.boolean().optional().messages({
    "boolean.base":
      "has_mother must be a boolean splithere has_mother يجب أن تكون قيمة منطقية",
  }),

  has_children: Joi.boolean().optional().messages({
    "boolean.base":
      "has_children must be a boolean splithere has_children يجب أن تكون قيمة منطقية",
  }),

  sortBy: Joi.string()
    .valid("createdAt", "updatedAt")
    .default("createdAt")
    .messages({
      "any.only":
        "Sort field must be one of: createdAt, updatedAt splithere حقل الترتيب يجب أن يكون أحد: createdAt, updatedAt",
    }),

  sortOrder: Joi.string().valid("asc", "desc").default("desc").messages({
    "any.only":
      "Sort order must be 'asc' or 'desc' splithere اتجاه الترتيب يجب أن يكون 'asc' أو 'desc'",
  }),
})
  .with("relation", "citizen_id")
  .messages({
    "object.with":
      "relation requires citizen_id splithere الحقل relation يتطلب وجود citizen_id",
  });

export const GetOneFamilyValidation = Joi.object({
  target_id: objectIdSchema.required().messages({
    "any.invalid":
      "Invalid family ID format splithere صيغة معرف العائلة غير صالحة",
    "any.required": "Family ID is required splithere معرف العائلة مطلوب",
    "string.base":
      "Family ID must be a string splithere معرف العائلة يجب أن يكون نصًا",
  }),
});

export const UpdateFamilyValidation = Joi.object({
  target_id: objectIdSchema.required().messages({
    "any.invalid":
      "Invalid family ID format splithere صيغة معرف العائلة غير صالحة",
    "any.required": "Family ID is required splithere معرف العائلة مطلوب",
    "string.base":
      "Family ID must be a string splithere معرف العائلة يجب أن يكون نصًا",
  }),

  father: objectIdSchema.optional().allow(null).messages({
    "any.invalid":
      "Invalid father ID format splithere صيغة معرف الأب غير صالحة",
  }),

  mother: objectIdSchema.optional().allow(null).messages({
    "any.invalid":
      "Invalid mother ID format splithere صيغة معرف الأم غير صالحة",
  }),

  children_ids: Joi.array().items(objectIdSchema).unique().optional().messages({
    "array.base":
      "children_ids must be an array splithere معرفات الأبناء يجب أن تكون مصفوفة",
    "array.unique":
      "children_ids must not contain duplicates splithere معرفات الأبناء لا يمكن أن تتكرر",
    "any.invalid":
      "Invalid child ID format splithere صيغة معرف أحد الأبناء غير صالحة",
  }),
})
  .min(2)
  .messages({
    "object.min":
      "At least one field (father, mother, or children_ids) must be provided splithere يجب توفير حقل واحد على الأقل للتحديث",
  });

export const DeleteFamilyValidation = Joi.object({
  target_id: objectIdSchema.required().messages({
    "any.invalid":
      "Invalid family ID format splithere صيغة معرف العائلة غير صالحة",
    "any.required": "Family ID is required splithere معرف العائلة مطلوب",
    "string.base":
      "Family ID must be a string splithere معرف العائلة يجب أن يكون نصًا",
  }),
});
