import Joi from "joi";
import mongoose from "mongoose";

const objectIdSchema = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid", {
      message: "Invalid ID format splithere معرف غير صالح",
    });
  }
  return value;
}, "ObjectId Validation");

export const CreateAdminValidation = Joi.object({
  first_name: Joi.string().trim().min(2).max(50).required().messages({
    "string.base":
      "First name must be text splithere الاسم الأول يجب أن يكون نصًا",
    "string.empty": "First name is required splithere الاسم الأول مطلوب",
    "string.min":
      "First name must be at least 2 characters splithere الاسم الأول يجب أن يكون حرفين على الأقل",
    "string.max":
      "First name must not exceed 50 characters splithere الاسم الأول يجب ألا يتجاوز 50 حرفًا",
    "any.required": "First name is required splithere الاسم الأول مطلوب",
  }),

  last_name: Joi.string().trim().min(2).max(50).required().messages({
    "string.base":
      "Last name must be text splithere اسم العائلة يجب أن يكون نصًا",
    "string.empty": "Last name is required splithere اسم العائلة مطلوب",
    "string.min":
      "Last name must be at least 2 characters splithere اسم العائلة يجب أن يكون حرفين على الأقل",
    "string.max":
      "Last name must not exceed 50 characters splithere اسم العائلة يجب ألا يتجاوز 50 حرفًا",
    "any.required": "Last name is required splithere اسم العائلة مطلوب",
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
      "string.empty": "Email is required splithere البريد الإلكتروني مطلوب",
      "string.email":
        "Email must be a valid email address splithere البريد الإلكتروني يجب أن يكون بريدًا صالحًا",
      "string.max":
        "Email must not exceed 254 characters splithere البريد الإلكتروني يجب ألا يتجاوز 254 حرفًا",
      "any.required": "Email is required splithere البريد الإلكتروني مطلوب",
    }),

  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/[a-z]/)
    .pattern(/[A-Z]/)
    .pattern(/[0-9]/)
    .pattern(/[^A-Za-z0-9]/)
    .required()
    .messages({
      "string.base":
        "Password must be text splithere كلمة المرور يجب أن تكون نصًا",
      "string.empty": "Password is required splithere كلمة المرور مطلوبة",
      "string.min":
        "Password must be at least 8 characters splithere كلمة المرور يجب أن تكون 8 أحرف على الأقل",
      "string.max":
        "Password must not exceed 128 characters splithere كلمة المرور يجب ألا تتجاوز 128 حرفًا",
      "string.pattern.base":
        "Password must contain lowercase, uppercase, number, and special character splithere كلمة المرور يجب أن تحتوي حرفًا صغيرًا وكبيرًا ورقمًا ورمزًا خاصًا",
      "any.required": "Password is required splithere كلمة المرور مطلوبة",
    }),

  phone_number: Joi.string()
    .trim()
    .pattern(/^09[0-9]{8}$/)
    .required()
    .messages({
      "string.base":
        "Phone number must be text splithere رقم الهاتف يجب أن يكون نصًا",
      "string.empty": "Phone number is required splithere رقم الهاتف مطلوب",
      "string.pattern.base":
        "Phone number must be exactly 10 digits starting with 09 splithere رقم الهاتف يجب أن يكون 10 أرقام ويبدأ بـ 09",
      "any.required": "Phone number is required splithere رقم الهاتف مطلوب",
    }),

  gender: Joi.string().valid("male", "female").required().messages({
    "string.base": "Gender must be text splithere الجنس يجب أن يكون نصًا",
    "string.empty": "Gender is required splithere الجنس مطلوب",
    "any.only":
      "Gender must be 'male' or 'female' splithere الجنس يجب أن يكون 'male' أو 'female'",
    "any.required": "Gender is required splithere الجنس مطلوب",
  }),

  birth_date: Joi.date().iso().less("now").required().messages({
    "date.base":
      "Birth date must be a valid date splithere تاريخ الميلاد يجب أن يكون تاريخًا صالحًا",
    "date.format":
      "Birth date must be in ISO format (YYYY-MM-DD) splithere تاريخ الميلاد يجب أن يكون بصيغة ISO (YYYY-MM-DD)",
    "date.less":
      "Birth date must be in the past splithere تاريخ الميلاد يجب أن يكون في الماضي",
    "any.required": "Birth date is required splithere تاريخ الميلاد مطلوب",
  }),

  avatar: Joi.string()
    .trim()
    .uri({ scheme: ["http", "https"] })
    .max(500)
    .required()
    .messages({
      "string.base": "Avatar must be text splithere الصورة يجب أن تكون نصًا",
      "string.empty": "Avatar is required splithere الصورة مطلوبة",
      "string.uri":
        "Avatar must be a valid URL splithere الصورة يجب أن تكون رابطًا صالحًا",
      "string.max":
        "Avatar URL must not exceed 500 characters splithere رابط الصورة يجب ألا يتجاوز 500 حرف",
      "any.required": "Avatar is required splithere الصورة مطلوبة",
    }),
});

export const ChangePasswordValidation = Joi.object({
  admin_id: objectIdSchema.required().messages({
    "any.invalid":
      "Invalid admin ID format splithere صيغة معرف الأدمن غير صالحة",
    "any.required": "Admin ID is required splithere معرف الأدمن مطلوب",
    "string.base":
      "Admin ID must be a string splithere معرف الأدمن يجب أن يكون نصًا",
  }),

  new_password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/[a-z]/)
    .pattern(/[A-Z]/)
    .pattern(/[0-9]/)
    .pattern(/[^A-Za-z0-9]/)
    .required()
    .messages({
      "string.base":
        "New password must be text splithere كلمة المرور الجديدة يجب أن تكون نصًا",
      "string.empty":
        "New password is required splithere كلمة المرور الجديدة مطلوبة",
      "string.min":
        "New password must be at least 8 characters splithere كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل",
      "string.max":
        "New password must not exceed 128 characters splithere كلمة المرور الجديدة يجب ألا تتجاوز 128 حرفًا",
      "string.pattern.base":
        "New password must contain lowercase, uppercase, number, and special character splithere كلمة المرور الجديدة يجب أن تحتوي حرفًا صغيرًا وكبيرًا ورقمًا ورمزًا خاصًا",
      "any.required":
        "New password is required splithere كلمة المرور الجديدة مطلوبة",
    }),

  superadmin_password: Joi.string().min(1).max(128).required().messages({
    "string.base":
      "Your password must be text splithere كلمة مرورك يجب أن تكون نصًا",
    "string.empty":
      "Your password is required for confirmation splithere كلمة مرورك مطلوبة للتأكيد",
    "string.max": "Your password is too long splithere كلمة مرورك طويلة جدًا",
    "any.required":
      "Your password is required for confirmation splithere كلمة مرورك مطلوبة للتأكيد",
  }),
});

export const UpdateAdminValidation = Joi.object({
  first_name: Joi.string().trim().min(2).max(50).optional().messages({
    "string.base":
      "First name must be text splithere الاسم الأول يجب أن يكون نصًا",
    "string.min":
      "First name must be at least 2 characters splithere الاسم الأول يجب أن يكون حرفين على الأقل",
    "string.max":
      "First name must not exceed 50 characters splithere الاسم الأول يجب ألا يتجاوز 50 حرفًا",
  }),

  last_name: Joi.string().trim().min(2).max(50).optional().messages({
    "string.base":
      "Last name must be text splithere اسم العائلة يجب أن يكون نصًا",
    "string.min":
      "Last name must be at least 2 characters splithere اسم العائلة يجب أن يكون حرفين على الأقل",
    "string.max":
      "Last name must not exceed 50 characters splithere اسم العائلة يجب ألا يتجاوز 50 حرفًا",
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

  gender: Joi.string().valid("male", "female").optional().messages({
    "string.base": "Gender must be text splithere الجنس يجب أن يكون نصًا",
    "any.only":
      "Gender must be 'male' or 'female' splithere الجنس يجب أن يكون 'male' أو 'female'",
  }),

  birth_date: Joi.date().iso().less("now").optional().messages({
    "date.base":
      "Birth date must be a valid date splithere تاريخ الميلاد يجب أن يكون تاريخًا صالحًا",
    "date.format":
      "Birth date must be in ISO format (YYYY-MM-DD) splithere تاريخ الميلاد يجب أن يكون بصيغة ISO (YYYY-MM-DD)",
    "date.less":
      "Birth date must be in the past splithere تاريخ الميلاد يجب أن يكون في الماضي",
  }),

  avatar: Joi.string()
    .trim()
    .uri({ scheme: ["http", "https"] })
    .max(500)
    .optional()
    .messages({
      "string.base": "Avatar must be text splithere الصورة يجب أن تكون نصًا",
      "string.uri":
        "Avatar must be a valid URL splithere الصورة يجب أن تكون رابطًا صالحًا",
      "string.max":
        "Avatar URL must not exceed 500 characters splithere رابط الصورة يجب ألا يتجاوز 500 حرف",
    }),

  isActive: Joi.boolean().optional().messages({
    "boolean.base":
      "Account status must be true or false splithere حالة الحساب يجب أن تكون true أو false",
  }),
})
  .min(1)
  .messages({
    "object.min":
      "At least one field must be provided to update splithere يجب توفير حقل واحد على الأقل للتحديث",
  });

export const AdminIdValidation = Joi.object({
  id: objectIdSchema.required().messages({
    "any.invalid":
      "Invalid admin ID format splithere صيغة معرف الأدمن غير صالحة",
    "any.required": "Admin ID is required splithere معرف الأدمن مطلوب",
    "string.base":
      "Admin ID must be a string splithere معرف الأدمن يجب أن يكون نصًا",
  }),
});

export const AdminQueryValidation = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .max(10000)
    .default(1)
    .optional()
    .messages({
      "number.base": "Page must be a number splithere الصفحة يجب أن تكون رقمًا",
      "number.integer":
        "Page must be an integer splithere الصفحة يجب أن تكون عددًا صحيحًا",
      "number.min":
        "Page must be at least 1 splithere الصفحة يجب أن تكون 1 على الأقل",
      "number.max": "Page is too large splithere الصفحة كبيرة جدًا",
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .optional()
    .messages({
      "number.base": "Limit must be a number splithere الحد يجب أن يكون رقمًا",
      "number.integer":
        "Limit must be an integer splithere الحد يجب أن يكون عددًا صحيحًا",
      "number.min":
        "Limit must be at least 1 splithere الحد يجب أن يكون 1 على الأقل",
      "number.max":
        "Limit must not exceed 100 splithere الحد يجب ألا يتجاوز 100",
    }),

  search: Joi.string().trim().max(50).allow("").optional().messages({
    "string.base": "Search must be text splithere البحث يجب أن يكون نصًا",
    "string.max":
      "Search must not exceed 50 characters splithere البحث يجب ألا يتجاوز 50 حرفًا",
  }),

  role: Joi.string().valid("admin", "superadmin").optional().messages({
    "string.base": "Role must be text splithere الدور يجب أن يكون نصًا",
    "any.only":
      "Role must be 'admin' or 'superadmin' splithere الدور يجب أن يكون 'admin' أو 'superadmin'",
  }),

  isActive: Joi.boolean().optional().messages({
    "boolean.base":
      "Account status must be true or false splithere حالة الحساب يجب أن تكون true أو false",
  }),

  sortBy: Joi.string()
    .valid("createdAt", "first_name", "last_name", "email")
    .default("createdAt")
    .optional()
    .messages({
      "any.only":
        "Sort field must be one of: createdAt, first_name, last_name, email splithere حقل الترتيب يجب أن يكون أحد: createdAt, first_name, last_name, email",
    }),

  sortOrder: Joi.string()
    .valid("asc", "desc")
    .default("desc")
    .optional()
    .messages({
      "any.only":
        "Sort order must be 'asc' or 'desc' splithere اتجاه الترتيب يجب أن يكون 'asc' أو 'desc'",
    }),
});

export const GetOneValidation = Joi.object({
  target_id: objectIdSchema.required().messages({
    "any.invalid":
      "Invalid target admin ID format splithere صيغة معرف الأدمن المستهدف غير صالحة",
    "any.required":
      "Target admin ID is required splithere معرف الأدمن المستهدف مطلوب",
    "string.base":
      "Target admin ID must be a string splithere معرف الأدمن المستهدف يجب أن يكون نصًا",
  }),
});

export const ToggleStatusValidation = Joi.object({
  target_id: objectIdSchema.required().messages({
    "any.invalid":
      "Invalid target admin ID format splithere صيغة معرف الأدمن المستهدف غير صالحة",
    "any.required":
      "Target admin ID is required splithere معرف الأدمن المستهدف مطلوب",
    "string.base":
      "Target admin ID must be a string splithere معرف الأدمن المستهدف يجب أن يكون نصًا",
  }),
});

export const DeleteValidation = Joi.object({
  target_id: objectIdSchema.required().messages({
    "any.invalid":
      "Invalid target admin ID format splithere صيغة معرف الأدمن المستهدف غير صالحة",
    "any.required":
      "Target admin ID is required splithere معرف الأدمن المستهدف مطلوب",
    "string.base":
      "Target admin ID must be a string splithere معرف الأدمن المستهدف يجب أن يكون نصًا",
  }),
});

export const ChangeAdminPasswordValidation = Joi.object({
  target_id: objectIdSchema.required().messages({
    "any.invalid":
      "Invalid target admin ID format splithere صيغة معرف الأدمن المستهدف غير صالحة",
    "any.required":
      "Target admin ID is required splithere معرف الأدمن المستهدف مطلوب",
    "string.base":
      "Target admin ID must be a string splithere معرف الأدمن المستهدف يجب أن يكون نصًا",
  }),

  new_password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/[a-z]/)
    .pattern(/[A-Z]/)
    .pattern(/[0-9]/)
    .required()
    .messages({
      "string.base":
        "New password must be text splithere كلمة المرور الجديدة يجب أن تكون نصًا",
      "string.empty":
        "New password is required splithere كلمة المرور الجديدة مطلوبة",
      "string.min":
        "New password must be at least 8 characters splithere كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل",
      "string.max":
        "New password must not exceed 128 characters splithere كلمة المرور الجديدة يجب ألا تتجاوز 128 حرفًا",
      "string.pattern.base":
        "New password must contain lowercase, uppercase, and number splithere كلمة المرور الجديدة يجب أن تحتوي حرفًا صغيرًا وكبيرًا ورقمًا",
      "any.required":
        "New password is required splithere كلمة المرور الجديدة مطلوبة",
    }),

  superadmin_password: Joi.string().min(1).max(128).required().messages({
    "string.base":
      "Your password must be text splithere كلمة مرورك يجب أن تكون نصًا",
    "string.empty":
      "Your password is required for confirmation splithere كلمة مرورك مطلوبة للتأكيد",
    "string.max": "Your password is too long splithere كلمة مرورك طويلة جدًا",
    "any.required":
      "Your password is required for confirmation splithere كلمة مرورك مطلوبة للتأكيد",
  }),
});

export const ChangeMyPasswordValidation = Joi.object({
  current_password: Joi.string().min(1).max(128).required().messages({
    "string.base":
      "Current password must be text splithere كلمة المرور الحالية يجب أن تكون نصًا",
    "string.empty":
      "Current password is required splithere كلمة المرور الحالية مطلوبة",
    "string.max":
      "Current password is too long splithere كلمة المرور الحالية طويلة جدًا",
    "any.required":
      "Current password is required splithere كلمة المرور الحالية مطلوبة",
  }),

  new_password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/[a-z]/)
    .pattern(/[A-Z]/)
    .pattern(/[0-9]/)
    .required()
    .messages({
      "string.base":
        "New password must be text splithere كلمة المرور الجديدة يجب أن تكون نصًا",
      "string.empty":
        "New password is required splithere كلمة المرور الجديدة مطلوبة",
      "string.min":
        "New password must be at least 8 characters splithere كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل",
      "string.max":
        "New password must not exceed 128 characters splithere كلمة المرور الجديدة يجب ألا تتجاوز 128 حرفًا",
      "string.pattern.base":
        "New password must contain lowercase, uppercase, and number splithere كلمة المرور الجديدة يجب أن تحتوي حرفًا صغيرًا وكبيرًا ورقمًا",
      "any.required":
        "New password is required splithere كلمة المرور الجديدة مطلوبة",
    }),

  confirm_new_password: Joi.string()
    .valid(Joi.ref("new_password"))
    .required()
    .messages({
      "any.only": "Passwords do not match splithere كلمتا المرور غير متطابقتين",
      "string.empty":
        "Password confirmation is required splithere تأكيد كلمة المرور مطلوب",
      "any.required":
        "Password confirmation is required splithere تأكيد كلمة المرور مطلوب",
    }),
});

export const UpdateAdminDataValidation = Joi.object({
  target_id: objectIdSchema.required().messages({
    "any.invalid":
      "Invalid target admin ID format splithere صيغة معرف الأدمن المستهدف غير صالحة",
    "any.required":
      "Target admin ID is required splithere معرف الأدمن المستهدف مطلوب",
    "string.base":
      "Target admin ID must be a string splithere معرف الأدمن المستهدف يجب أن يكون نصًا",
  }),

  first_name: Joi.string().trim().min(2).max(50).optional().messages({
    "string.base":
      "First name must be text splithere الاسم الأول يجب أن يكون نصًا",
    "string.min":
      "First name must be at least 2 characters splithere الاسم الأول يجب أن يكون حرفين على الأقل",
    "string.max":
      "First name must not exceed 50 characters splithere الاسم الأول يجب ألا يتجاوز 50 حرفًا",
  }),

  last_name: Joi.string().trim().min(2).max(50).optional().messages({
    "string.base":
      "Last name must be text splithere اسم العائلة يجب أن يكون نصًا",
    "string.min":
      "Last name must be at least 2 characters splithere اسم العائلة يجب أن يكون حرفين على الأقل",
    "string.max":
      "Last name must not exceed 50 characters splithere اسم العائلة يجب ألا يتجاوز 50 حرفًا",
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

  birth_date: Joi.date().iso().less("now").optional().messages({
    "date.base":
      "Birth date must be a valid date splithere تاريخ الميلاد يجب أن يكون تاريخًا صالحًا",
    "date.format":
      "Birth date must be in ISO format (YYYY-MM-DD) splithere تاريخ الميلاد يجب أن يكون بصيغة ISO (YYYY-MM-DD)",
    "date.less":
      "Birth date must be in the past splithere تاريخ الميلاد يجب أن يكون في الماضي",
  }),

  gender: Joi.string().valid("male", "female").optional().messages({
    "string.base": "Gender must be text splithere الجنس يجب أن يكون نصًا",
    "any.only":
      "Gender must be 'male' or 'female' splithere الجنس يجب أن يكون 'male' أو 'female'",
  }),
})
  .min(2)
  .messages({
    "object.min":
      "At least one field (besides target_id) must be provided splithere يجب توفير حقل واحد على الأقل (بجانب target_id)",
  });

export const UpdateMyDataValidation = Joi.object({
  first_name: Joi.string().trim().min(2).max(50).optional().messages({
    "string.base":
      "First name must be text splithere الاسم الأول يجب أن يكون نصًا",
    "string.min":
      "First name must be at least 2 characters splithere الاسم الأول يجب أن يكون حرفين على الأقل",
    "string.max":
      "First name must not exceed 50 characters splithere الاسم الأول يجب ألا يتجاوز 50 حرفًا",
  }),

  last_name: Joi.string().trim().min(2).max(50).optional().messages({
    "string.base":
      "Last name must be text splithere اسم العائلة يجب أن يكون نصًا",
    "string.min":
      "Last name must be at least 2 characters splithere اسم العائلة يجب أن يكون حرفين على الأقل",
    "string.max":
      "Last name must not exceed 50 characters splithere اسم العائلة يجب ألا يتجاوز 50 حرفًا",
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

  birth_date: Joi.date().iso().less("now").optional().messages({
    "date.base":
      "Birth date must be a valid date splithere تاريخ الميلاد يجب أن يكون تاريخًا صالحًا",
    "date.format":
      "Birth date must be in ISO format (YYYY-MM-DD) splithere تاريخ الميلاد يجب أن يكون بصيغة ISO (YYYY-MM-DD)",
    "date.less":
      "Birth date must be in the past splithere تاريخ الميلاد يجب أن يكون في الماضي",
  }),
})
  .min(1)
  .messages({
    "object.min":
      "At least one field must be provided to update splithere يجب توفير حقل واحد على الأقل للتحديث",
  });

export default {
  CreateAdminValidation,
  ChangePasswordValidation,
  UpdateAdminValidation,
  AdminQueryValidation,
  AdminIdValidation,
  ToggleStatusValidation,
  GetOneValidation,
  DeleteValidation,
  ChangeMyPasswordValidation,
  ChangeAdminPasswordValidation,
  UpdateAdminDataValidation,
  UpdateMyDataValidation,
};
