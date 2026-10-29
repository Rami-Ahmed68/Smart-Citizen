import Joi from "joi";

export const LogInValidation = Joi.object({
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

  password: Joi.string().min(1).max(128).required().messages({
    "string.base":
      "Password must be text splithere كلمة المرور يجب أن تكون نصًا",
    "string.empty": "Password is required splithere كلمة المرور مطلوبة",
    "string.min": "Password is required splithere كلمة المرور مطلوبة",
    "string.max":
      "Password must not exceed 128 characters splithere كلمة المرور يجب ألا تتجاوز 128 حرفًا",
    "any.required": "Password is required splithere كلمة المرور مطلوبة",
  }),
}).strict();

export const LogOutValidation = Joi.object({
  refresh_token: Joi.string().trim().required().messages({
    "string.base":
      "Refresh token must be text splithere توكن التجديد يجب أن يكون نصًا",
    "string.empty": "Refresh token is required splithere توكن التجديد مطلوب",
    "any.required": "Refresh token is required splithere توكن التجديد مطلوب",
  }),
}).strict();
