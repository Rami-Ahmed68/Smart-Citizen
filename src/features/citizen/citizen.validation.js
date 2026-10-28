import Joi from "joi";
import { objectIdSchema } from "../../utils/id/id.validations.js";
import { COUNTRIES } from "../../utils/countries/countries.js";

const birthDateSchema = Joi.date()
  .iso()
  .custom((value, helpers) => {
    const now = new Date();
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );
    if (new Date(value) > endOfToday) {
      return helpers.error("date.greater");
    }
    return value;
  })
  .messages({
    "date.base":
      "Birth date must be a valid date splithere تاريخ الميلاد يجب أن يكون تاريخًا صالحًا",
    "date.format":
      "Birth date must be in ISO format (YYYY-MM-DD) splithere تاريخ الميلاد يجب أن يكون بصيغة ISO (YYYY-MM-DD)",
    "date.greater":
      "Birth date cannot be in the future splithere تاريخ الميلاد لا يمكن أن يكون في المستقبل",
  });

export const CreateCitizenValidation = Joi.object({
  first_name: Joi.string().trim().min(2).max(100).required().messages({
    "string.base":
      "First name must be text splithere الاسم الأول يجب أن يكون نصًا",
    "string.empty": "First name is required splithere الاسم الأول مطلوب",
    "string.min":
      "First name must be at least 2 characters splithere الاسم الأول يجب أن يكون حرفين على الأقل",
    "string.max":
      "First name must not exceed 100 characters splithere الاسم الأول يجب ألا يتجاوز 100 حرف",
    "any.required": "First name is required splithere الاسم الأول مطلوب",
  }),

  last_name: Joi.string().trim().min(2).max(100).required().messages({
    "string.base":
      "Last name must be text splithere اسم العائلة يجب أن يكون نصًا",
    "string.empty": "Last name is required splithere اسم العائلة مطلوب",
    "string.min":
      "Last name must be at least 2 characters splithere اسم العائلة يجب أن يكون حرفين على الأقل",
    "string.max":
      "Last name must not exceed 100 characters splithere اسم العائلة يجب ألا يتجاوز 100 حرف",
    "any.required": "Last name is required splithere اسم العائلة مطلوب",
  }),

  birth_date: birthDateSchema.required().messages({
    "any.required": "Birth date is required splithere تاريخ الميلاد مطلوب",
  }),

  gender: Joi.string().valid("male", "female").required().messages({
    "string.base": "Gender must be text splithere الجنس يجب أن يكون نصًا",
    "any.only":
      "Gender must be 'male' or 'female' splithere الجنس يجب أن يكون 'male' أو 'female'",
    "any.required": "Gender is required splithere الجنس مطلوب",
  }),

  phone_number: Joi.string()
    .trim()
    .pattern(/^09[0-9]{8}$/)
    .required()
    .messages({
      "string.base":
        "Phone number must be text splithere رقم الهاتف يجب أن يكون نصًا",
      "string.pattern.base":
        "Phone number must be exactly 10 digits starting with 09 splithere رقم الهاتف يجب أن يكون 10 أرقام ويبدأ بـ 09",
      "any.required": "Phone number is required splithere رقم الهاتف مطلوب",
    }),

  email: Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } })
    .max(254)
    .required()
    .messages({
      "string.base":
        "Email must be text splithere البريد الإلكتروني يجب أن يكون نصًا",
      "string.email":
        "Email must be a valid email address splithere البريد الإلكتروني يجب أن يكون بريدًا صالحًا",
      "string.max":
        "Email must not exceed 254 characters splithere البريد الإلكتروني يجب ألا يتجاوز 254 حرفًا",
      "any.required": "Email is required splithere البريد الإلكتروني مطلوب",
    }),

  religion: Joi.string().valid("Muslim", "Christian").required().messages({
    "any.only":
      "Religion must be 'Muslim' or 'Christian' splithere الديانة يجب أن تكون 'Muslim' أو 'Christian'",
    "any.required": "Religion is required splithere الديانة مطلوبة",
  }),

  original_nationality: Joi.string()
    .trim()
    .valid(...COUNTRIES)
    .default("Syria")
    .messages({
      "string.base":
        "Original nationality must be text splithere الجنسية الأصلية يجب أن تكون نصًا",
      "any.only":
        "Original nationality must be a valid country name splithere الجنسية الأصلية يجب أن تكون اسم دولة صالحًا",
    }),

  location: Joi.string()
    .valid(
      "Damascus",
      "Rif Dimashq",
      "Aleppo",
      "Homs",
      "Hama",
      "Latakia",
      "Tartus",
      "Idlib",
      "Deir ez-Zor",
      "Raqqa",
      "Al-Hasakah",
      "Daraa",
      "As-Suwayda",
      "Quneitra",
    )
    .required()
    .messages({
      "any.only":
        "Location must be one of the 14 Syrian governorates splithere المحافظة يجب أن تكون إحدى المحافظات السورية الـ14",
      "any.required": "Location is required splithere المحافظة مطلوبة",
    }),

  marital_status: Joi.string()
    .valid("Single", "Married", "Divorced", "Widowed")
    .default("Single")
    .messages({
      "any.only":
        "Marital status must be Single, Married, Divorced, or Widowed splithere الحالة الاجتماعية يجب أن تكون Single أو Married أو Divorced أو Widowed",
    }),

  spouse_id: objectIdSchema.optional().allow(null).messages({
    "any.invalid":
      "Invalid spouse ID format splithere صيغة معرف الزوج/الزوجة غير صالحة",
  }),
});

export const GetAllCitizensValidation = Joi.object({
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

  location: Joi.string()
    .valid(
      "Damascus",
      "Rif Dimashq",
      "Aleppo",
      "Homs",
      "Hama",
      "Latakia",
      "Tartus",
      "Idlib",
      "Deir ez-Zor",
      "Raqqa",
      "Al-Hasakah",
      "Daraa",
      "As-Suwayda",
      "Quneitra",
    )
    .optional()
    .messages({
      "any.only":
        "Location must be one of the 14 Syrian governorates splithere المحافظة يجب أن تكون إحدى المحافظات السورية الـ14",
      "string.base":
        "Location must be text splithere المحافظة يجب أن تكون نصًا",
    }),

  gender: Joi.string().valid("male", "female").optional().messages({
    "any.only":
      "Gender must be 'male' or 'female' splithere الجنس يجب أن يكون 'male' أو 'female'",
    "string.base": "Gender must be text splithere الجنس يجب أن يكون نصًا",
  }),

  marital_status: Joi.string()
    .valid("Single", "Married", "Divorced", "Widowed")
    .optional()
    .messages({
      "any.only":
        "Marital status must be Single, Married, Divorced, or Widowed splithere الحالة الاجتماعية يجب أن تكون Single أو Married أو Divorced أو Widowed",
      "string.base":
        "Marital status must be text splithere الحالة الاجتماعية يجب أن تكون نصًا",
    }),

  original_nationality: Joi.string()
    .trim()
    .valid(...COUNTRIES)
    .optional()
    .messages({
      "string.base":
        "Original nationality must be text splithere الجنسية الأصلية يجب أن تكون نصًا",
      "any.only":
        "Original nationality must be a valid country name splithere الجنسية الأصلية يجب أن تكون اسم دولة صالحًا",
    }),

  citizenship_type: Joi.string()
    .valid("by_birth", "naturalized")
    .optional()
    .messages({
      "string.base":
        "Citizenship type must be text splithere نوع الجنسية يجب أن يكون نصًا",
      "any.only":
        "Citizenship type must be 'by_birth' or 'naturalized' splithere نوع الجنسية يجب أن يكون 'by_birth' أو 'naturalized'",
    }),

  birth_date_from: Joi.string()
    .pattern(/^\d{4}(-\d{2}-\d{2})?$/)
    .optional()
    .messages({
      "string.base":
        "birth_date_from must be text splithere تاريخ الميلاد (من) يجب أن يكون نصًا",
      "string.pattern.base":
        "birth_date_from must be YYYY or YYYY-MM-DD splithere تاريخ الميلاد (من) يجب أن يكون بصيغة YYYY أو YYYY-MM-DD",
    }),

  birth_date_to: Joi.string()
    .pattern(/^\d{4}(-\d{2}-\d{2})?$/)
    .optional()
    .messages({
      "string.base":
        "birth_date_to must be text splithere تاريخ الميلاد (إلى) يجب أن يكون نصًا",
      "string.pattern.base":
        "birth_date_to must be YYYY or YYYY-MM-DD splithere تاريخ الميلاد (إلى) يجب أن يكون بصيغة YYYY أو YYYY-MM-DD",
    }),

  sortBy: Joi.string()
    .valid("createdAt", "first_name", "last_name", "birth_date")
    .default("createdAt")
    .messages({
      "any.only":
        "Sort field must be one of: createdAt, first_name, last_name, birth_date splithere حقل الترتيب يجب أن يكون أحد: createdAt, first_name, last_name, birth_date",
    }),

  sortOrder: Joi.string().valid("asc", "desc").default("desc").messages({
    "any.only":
      "Sort order must be 'asc' or 'desc' splithere اتجاه الترتيب يجب أن يكون 'asc' أو 'desc'",
  }),
})
  .oxor("original_nationality", "citizenship_type")
  .messages({
    "object.oxor":
      "Use either original_nationality or citizenship_type, not both splithere استخدم إما الجنسية الأصلية أو نوع الجنسية وليس الاثنين معاً",
  });

export const GetOneCitizenValidation = Joi.object({
  target_id: objectIdSchema.required().messages({
    "any.invalid":
      "Invalid citizen citizen's id format splithere صيغة معرف المواطن غير صالحة",
    "any.required":
      "Citizen citizen's id is required splithere معرف المواطن مطلوب",
    "string.base":
      "Citizen citizen's id must be a string splithere معرف المواطن يجب أن يكون نصًا",
  }),
});

export const UpdateRelationsValidation = Joi.object({
  citizen_id: objectIdSchema.required().messages({
    "any.invalid":
      "Invalid citizen ID format splithere صيغة معرف المواطن غير صالحة",
    "any.required": "Citizen ID is required splithere معرف المواطن مطلوب",
    "string.base":
      "Citizen ID must be a string splithere معرف المواطن يجب أن يكون نصًا",
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

  spouse_id: objectIdSchema.optional().allow(null).messages({
    "any.invalid":
      "Invalid spouse ID format splithere صيغة معرف الزوج/الزوجة غير صالحة",
  }),

  marital_status: Joi.string()
    .valid("Single", "Married", "Divorced", "Widowed")
    .optional()
    .messages({
      "any.only":
        "Marital status must be Single, Married, Divorced, or Widowed splithere الحالة الاجتماعية يجب أن تكون Single أو Married أو Divorced أو Widowed",
    }),
})
  .min(2)
  .messages({
    "object.min":
      "At least one field (father, mother, children_ids, spouse_id, or marital_status) must be provided splithere يجب توفير حقل واحد على الأقل",
  });

export const UpdateCitizenValidation = Joi.object({
  target_id: objectIdSchema.required().messages({
    "any.invalid":
      "Invalid citizen ID format splithere صيغة معرف المواطن غير صالحة",
    "any.required": "Citizen ID is required splithere معرف المواطن مطلوب",
    "string.base":
      "Citizen ID must be a string splithere معرف المواطن يجب أن يكون نصًا",
  }),

  first_name: Joi.string().trim().min(2).max(100).optional().messages({
    "string.base":
      "First name must be text splithere الاسم الأول يجب أن يكون نصًا",
    "string.min":
      "First name must be at least 2 characters splithere الاسم الأول يجب أن يكون حرفين على الأقل",
    "string.max":
      "First name must not exceed 100 characters splithere الاسم الأول يجب ألا يتجاوز 100 حرف",
  }),

  last_name: Joi.string().trim().min(2).max(100).optional().messages({
    "string.base":
      "Last name must be text splithere اسم العائلة يجب أن يكون نصًا",
    "string.min":
      "Last name must be at least 2 characters splithere اسم العائلة يجب أن يكون حرفين على الأقل",
    "string.max":
      "Last name must not exceed 100 characters splithere اسم العائلة يجب ألا يتجاوز 100 حرف",
  }),

  birth_date: birthDateSchema.optional(),

  email: Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } })
    .max(254)
    .optional()
    .messages({
      "string.base":
        "Email must be text splithere البريد الإلكتروني يجب أن يكون نصًا",
      "string.email":
        "Email must be a valid email address splithere البريد الإلكتروني يجب أن يكون بريدًا صالحًا",
      "string.max":
        "Email must not exceed 254 characters splithere البريد الإلكتروني يجب ألا يتجاوز 254 حرفًا",
    }),

  phone_number: Joi.string()
    .trim()
    .pattern(/^09[0-9]{8}$/)
    .optional()
    .messages({
      "string.base":
        "Phone number must be text splithere رقم الهاتف يجب أن يكون نصًا",
      "string.pattern.base":
        "Phone number must be exactly 10 digits starting with 09 splithere رقم الهاتف يجب أن يكون 10 أرقام ويبدأ بـ 09",
    }),
})
  .min(2)
  .messages({
    "object.min":
      "At least one field (first_name, last_name, birth_date, email, or phone_number) must be provided splithere يجب توفير حقل واحد على الأقل للتحديث",
  });

export const DeleteCitizenValidation = Joi.object({
  target_id: objectIdSchema.required().messages({
    "any.invalid":
      "Invalid citizen ID format splithere صيغة معرف المواطن غير صالحة",
    "any.required": "Citizen ID is required splithere معرف المواطن مطلوب",
    "string.base":
      "Citizen ID must be a string splithere معرف المواطن يجب أن يكون نصًا",
  }),
});
