import Admin from "./admin.model.js";
import _ from "lodash";
import { ApiError } from "../../utils/error/ApiError.js";
import {
  comparePassword,
  hashPassword,
} from "../../middleware/password/bcrypt.js";
import { isValidObjectId } from "../../utils/id/id.validations.js";

export const CreateAdmin = async (req, res, next) => {
  try {
    const {
      first_name,
      last_name,
      birth_date,
      gender,
      phone_number,
      email,
      password,
      avatar,
    } = req.validated;

    const existing = await Admin.findOne({ email }).lean();

    if (existing) {
      return next(
        new ApiError(
          {
            en: "Email is already registered",
            ar: "البريد الإلكتروني مسجل مسبقًا",
          },
          409,
        ),
      );
    }

    const hashedPassword = await hashPassword(password);

    const admin = await Admin.create({
      first_name,
      last_name,
      email,
      password: hashedPassword,
      phone_number,
      gender,
      birth_date,
      avatar,
      role: "admin",
      isActive: true,
      createdBy: req.admin._id,
    });

    const { password: _pw, ...safeAdmin } = admin.toObject();

    return res.status(201).json({
      success: true,
      status: "success",
      statusCode: 201,
      message: {
        en: "Admin created successfully",
        ar: "تم إنشاء الأدمن بنجاح",
      },
      data: safeAdmin,
    });
  } catch (error) {
    return next(error);
  }
};

export const GetAll = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      isActive,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.validated;

    const filter = {};

    if (search) {
      filter.$or = [
        { first_name: { $regex: search, $options: "i" } },
        { last_name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role) filter.role = role;
    if (typeof isActive === "boolean") filter.isActive = isActive;

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [data, total] = await Promise.all([
      Admin.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select("-password")
        .lean(),
      Admin.countDocuments(filter),
    ]);

    const pages = Math.ceil(total / limit) || 1;

    return res.status(200).json({
      success: true,
      status: "success",
      statusCode: 200,
      message: {
        en: "Admins retrieved successfully",
        ar: "تم جلب بيانات الأدمنز بنجاح",
      },
      data,
      pagination: {
        total,
        page,
        limit,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const GetOne = async (req, res, next) => {
  try {
    const { target_id } = req.validated;

    const admin = await Admin.findById(target_id).select("-password").lean();

    if (!admin) {
      return next(
        new ApiError(
          {
            en: "Admin not found",
            ar: "الأدمن غير موجود",
          },
          404,
        ),
      );
    }

    console.log(admin);

    return res.status(200).json({
      success: true,
      status: "success",
      statusCode: 200,
      message: {
        en: "Admin retrieved successfully",
        ar: "تم جلب بيانات الأدمن بنجاح",
      },
      data: admin,
    });
  } catch (error) {
    return next(error);
  }
};

export const ToggleStatus = async (req, res, next) => {
  try {
    const { target_id } = req.validated;

    if (!isValidObjectId(target_id)) {
      return next(
        new ApiError(
          {
            en: "Invalid target admin ID format",
            ar: "صيغة معرف الأدمن المستهدف غير صالحة",
          },
          400,
        ),
      );
    }

    if (target_id === req.admin._id.toString()) {
      return next(
        new ApiError(
          {
            en: "You cannot change your own account status.",
            ar: "لا يمكنك تغيير حالة حسابك الخاص.",
          },
          400,
        ),
      );
    }

    const target_admin = await Admin.findById(target_id);

    if (!target_admin) {
      return next(
        new ApiError(
          {
            en: "Target admin not found",
            ar: "الأدمن المستهدف غير موجود",
          },
          404,
        ),
      );
    }

    if (target_admin.role === "super") {
      return next(
        new ApiError(
          {
            en: "Sorry, you cannot change a super admin's account status",
            ar: "عذرًا، لا يمكنك تغيير حالة حساب سوبر أدمن",
          },
          403,
        ),
      );
    }

    target_admin.isActive = !target_admin.isActive;
    await target_admin.save();

    return res.status(200).json({
      success: true,
      status: "success",
      statusCode: 200,
      message: {
        en: `Account ${target_admin.isActive ? "activated" : "deactivated"} successfully`,
        ar: `تم ${target_admin.isActive ? "تفعيل" : "تعطيل"} الحساب بنجاح`,
      },
      data: target_admin.toObject(),
    });
  } catch (error) {
    return next(error);
  }
};

export const Delete = async (req, res, next) => {
  try {
    const { target_id } = req.validated;

    if (!isValidObjectId(target_id)) {
      return next(
        new ApiError(
          {
            en: "Invalid target admin ID format",
            ar: "صيغة معرف الأدمن المستهدف غير صالحة",
          },
          400,
        ),
      );
    }

    if (target_id === req.admin._id.toString()) {
      return next(
        new ApiError(
          {
            en: "You cannot delete your own account.",
            ar: "لا يمكنك حذف حسابك الخاص.",
          },
          400,
        ),
      );
    }

    const target_admin = await Admin.findById(target_id);

    if (!target_admin) {
      return next(
        new ApiError(
          {
            en: "Target admin not found",
            ar: "الأدمن المستهدف غير موجود",
          },
          404,
        ),
      );
    }

    if (target_admin.role === "super") {
      return next(
        new ApiError(
          {
            en: "Sorry, you cannot delete a super admin's account",
            ar: "عذرًا، لا يمكنك حذف حساب سوبر أدمن",
          },
          403,
        ),
      );
    }

    await Admin.findByIdAndDelete(target_id);

    return res.status(200).json({
      success: true,
      status: "success",
      statusCode: 200,
      message: {
        en: "Admin deleted successfully",
        ar: "تم حذف الأدمن بنجاح",
      },
      data: {
        deleted_id: target_id,
        full_name: `${target_admin.first_name} ${target_admin.last_name}`,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const ChangeAdminPassword = async (req, res, next) => {
  try {
    const { target_id, new_password, superadmin_password } = req.validated;

    if (!isValidObjectId(target_id)) {
      return next(
        new ApiError(
          {
            en: "Invalid target admin ID format",
            ar: "صيغة معرف الأدمن المستهدف غير صالحة",
          },
          400,
        ),
      );
    }

    if (target_id === req.admin._id.toString()) {
      return next(
        new ApiError(
          {
            en: "Use the self-service endpoint to change your own password.",
            ar: "استخدم خدمة تغيير كلمة المرور الخاصة بك.",
          },
          400,
        ),
      );
    }

    const target_admin = await Admin.findById(target_id);

    if (!target_admin) {
      return next(
        new ApiError(
          {
            en: "Target admin not found",
            ar: "الأدمن المستهدف غير موجود",
          },
          404,
        ),
      );
    }

    const isSuperPasswordCorrect = await comparePassword(
      superadmin_password,
      req.admin.password,
    );

    if (!isSuperPasswordCorrect) {
      return next(
        new ApiError(
          {
            en: "Your password is incorrect.",
            ar: "كلمة المرور الخاصة بك غير صحيحة.",
          },
          401,
        ),
      );
    }

    const isSamePassword = await comparePassword(
      new_password,
      target_admin.password,
    );

    if (isSamePassword) {
      return next(
        new ApiError(
          {
            en: "New password must be different from the current one.",
            ar: "كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية.",
          },
          400,
        ),
      );
    }

    target_admin.password = await hashPassword(new_password);
    await target_admin.save();

    return res.status(200).json({
      success: true,
      status: "success",
      statusCode: 200,
      message: {
        en: "Password changed successfully",
        ar: "تم تغيير كلمة المرور بنجاح",
      },
      data: {
        target_id: target_admin._id,
        full_name: `${target_admin.first_name} ${target_admin.last_name}`,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const ChangeMyPassword = async (req, res, next) => {
  try {
    const { current_password, new_password, confirm_new_password } =
      req.validated;

    const isCurrentPasswordCorrect = await comparePassword(
      current_password,
      req.admin.password,
    );

    if (!isCurrentPasswordCorrect) {
      return next(
        new ApiError(
          {
            en: "Your current password is incorrect.",
            ar: "كلمة المرور الحالية غير صحيحة.",
          },
          401,
        ),
      );
    }

    if (new_password !== confirm_new_password) {
      return next(
        new ApiError(
          {
            en: "New password and confirmation do not match.",
            ar: "كلمة المرور الجديدة وتأكيدها غير متطابقين.",
          },
          400,
        ),
      );
    }

    const isSamePassword = await comparePassword(
      new_password,
      req.admin.password,
    );

    if (isSamePassword) {
      return next(
        new ApiError(
          {
            en: "New password must be different from the current one.",
            ar: "كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية.",
          },
          400,
        ),
      );
    }

    const admin = await Admin.findById(req.admin._id);
    admin.password = await hashPassword(new_password);
    await admin.save();

    return res.status(200).json({
      success: true,
      status: "success",
      statusCode: 200,
      message: {
        en: "Your password has been changed successfully. Please log in again.",
        ar: "تم تغيير كلمة المرور الخاصة بك بنجاح. يرجى تسجيل الدخول مجددًا.",
      },
      data: {
        admin_id: admin._id,
        full_name: `${admin.first_name} ${admin.last_name}`,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const UpdateAdminData = async (req, res, next) => {
  try {
    const {
      target_id,
      first_name,
      last_name,
      phone_number,
      birth_date,
      gender,
    } = req.validated;

    if (!isValidObjectId(target_id)) {
      return next(
        new ApiError(
          {
            en: "Invalid target admin ID format",
            ar: "صيغة معرف الأدمن المستهدف غير صالحة",
          },
          400,
        ),
      );
    }

    if (target_id === req.admin._id.toString()) {
      return next(
        new ApiError(
          {
            en: "Use the self-update endpoint to update your own data.",
            ar: "استخدم خدمة تحديث بياناتك الخاصة.",
          },
          400,
        ),
      );
    }

    const target_admin = await Admin.findById(target_id);

    if (!target_admin) {
      return next(
        new ApiError(
          {
            en: "Target admin not found",
            ar: "الأدمن المستهدف غير موجود",
          },
          404,
        ),
      );
    }

    if (target_admin.role === "super") {
      return next(
        new ApiError(
          {
            en: "Sorry, you cannot update a super admin's data",
            ar: "عذرًا، لا يمكنك تعديل بيانات سوبر أدمن",
          },
          403,
        ),
      );
    }

    const changes = {};

    if (first_name !== undefined && first_name !== target_admin.first_name) {
      changes.first_name = first_name;
    }

    if (last_name !== undefined && last_name !== target_admin.last_name) {
      changes.last_name = last_name;
    }

    if (
      phone_number !== undefined &&
      phone_number !== target_admin.phone_number
    ) {
      changes.phone_number = phone_number;
    }

    if (birth_date !== undefined) {
      const newDate = new Date(birth_date);
      const oldDate = new Date(target_admin.birth_date);
      if (newDate.getTime() !== oldDate.getTime()) {
        changes.birth_date = birth_date;
      }
    }

    if (gender !== undefined && gender !== target_admin.gender) {
      changes.gender = gender;
    }

    if (Object.keys(changes).length === 0) {
      return next(
        new ApiError(
          {
            en: "No changes detected. The provided data is identical to the current data.",
            ar: "لا توجد تغييرات. البيانات المقدمة مطابقة للبيانات الحالية.",
          },
          400,
        ),
      );
    }

    if (changes.phone_number) {
      const phoneExists = await Admin.findOne({
        phone_number: changes.phone_number,
        _id: { $ne: target_id },
      }).lean();

      if (phoneExists) {
        return next(
          new ApiError(
            {
              en: "Phone number is already used by another admin",
              ar: "رقم الهاتف مستخدم من قبل أدمن آخر",
            },
            409,
          ),
        );
      }
    }

    Object.assign(target_admin, changes);
    await target_admin.save();

    return res.status(200).json({
      success: true,
      status: "success",
      statusCode: 200,
      message: {
        en: "Admin data updated successfully",
        ar: "تم تحديث بيانات الأدمن بنجاح",
      },
      data: target_admin.toObject(),
      meta: {
        updated_fields: Object.keys(changes),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const UpdateMyData = async (req, res, next) => {
  try {
    const { first_name, last_name, phone_number, birth_date } = req.validated;

    const admin = await Admin.findById(req.admin._id);

    if (!admin) {
      return next(
        new ApiError(
          {
            en: "Admin not found",
            ar: "الأدمن غير موجود",
          },
          404,
        ),
      );
    }

    const changes = {};

    if (first_name !== undefined && first_name !== admin.first_name) {
      changes.first_name = first_name;
    }

    if (last_name !== undefined && last_name !== admin.last_name) {
      changes.last_name = last_name;
    }

    if (phone_number !== undefined && phone_number !== admin.phone_number) {
      changes.phone_number = phone_number;
    }

    if (birth_date !== undefined) {
      const newDate = new Date(birth_date);
      const oldDate = new Date(admin.birth_date);
      if (newDate.getTime() !== oldDate.getTime()) {
        changes.birth_date = birth_date;
      }
    }

    if (Object.keys(changes).length === 0) {
      return next(
        new ApiError(
          {
            en: "No changes detected. The provided data is identical to the current data.",
            ar: "لا توجد تغييرات. البيانات المقدمة مطابقة للبيانات الحالية.",
          },
          400,
        ),
      );
    }

    if (changes.phone_number) {
      const phoneExists = await Admin.findOne({
        phone_number: changes.phone_number,
        _id: { $ne: req.admin._id },
      }).lean();

      if (phoneExists) {
        return next(
          new ApiError(
            {
              en: "Phone number is already used by another admin",
              ar: "رقم الهاتف مستخدم من قبل أدمن آخر",
            },
            409,
          ),
        );
      }
    }

    Object.assign(admin, changes);
    await admin.save();

    return res.status(200).json({
      success: true,
      status: "success",
      statusCode: 200,
      message: {
        en: "Your data has been updated successfully",
        ar: "تم تحديث بياناتك بنجاح",
      },
      data: admin.toObject(),
      meta: {
        updated_fields: Object.keys(changes),
      },
    });
  } catch (error) {
    return next(error);
  }
};
