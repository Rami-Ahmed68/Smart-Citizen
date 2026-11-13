import Citizen from "./citizen.model.js";
import Family from "../family/family.model.js";
import { ApiError } from "../../utils/error/ApiError.js";
import { analyzeCitizenPhoto } from "../../services/vision.service.js";
import {
  deleteUploadedFile,
  toStoredPath,
  toDiskPath,
} from "../../utils/upload/multer.upload.js";

const MIN_PARENT_CHILD_AGE_GAP = 20;
const MIN_MARRIAGE_AGE = 18;

function parseBirthDateStart(str) {
  if (/^\d{4}$/.test(str)) {
    return new Date(`${str}-01-01T00:00:00.000Z`);
  }
  const d = new Date(str);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function parseBirthDateEnd(str) {
  if (/^\d{4}$/.test(str)) {
    return new Date(`${str}-12-31T23:59:59.999Z`);
  }
  const d = new Date(str);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

function withCitizenshipType(citizen) {
  return {
    ...citizen,
    citizenship_type:
      citizen.original_nationality === "Syria" ? "by_birth" : "naturalized",
  };
}

function yearsDiff(olderDate, youngerDate) {
  const older = new Date(olderDate);
  const younger = new Date(youngerDate);
  let years = younger.getFullYear() - older.getFullYear();
  const monthDiff = younger.getMonth() - older.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && younger.getDate() < older.getDate())
  ) {
    years--;
  }
  return years;
}

export const CreateCitizen = async (req, res, next) => {
  const photoStored = toStoredPath(req.file);
  const photoDiskPath = req.file?.path || null;
  let isSuccess = false;

  try {
    if (!req.file) {
      return next(
        new ApiError(
          { en: "Citizen photo is required", ar: "صورة المواطن مطلوبة" },
          400,
        ),
      );
    }

    const {
      first_name,
      last_name,
      birth_date,
      gender,
      phone_number,
      email,
      religion,
      original_nationality,
      location,
      marital_status,
    } = req.validated;

    if (marital_status && marital_status !== "Single") {
      await deleteUploadedFile(photoDiskPath);
      return next(
        new ApiError(
          {
            en: "New citizens must be created with 'Single' marital status. Use the Family module to establish marriages.",
            ar: "يجب إنشاء المواطن الجديد بحالة 'أعزب'. استخدم وحدة العائلة لتوثيق الزواج.",
          },
          400,
        ),
      );
    }

    const analysis = await analyzeCitizenPhoto(photoDiskPath);

    if (!analysis.hasHuman) {
      await deleteUploadedFile(photoDiskPath);
      return next(
        new ApiError(
          {
            en: "The uploaded photo does not contain a human face. Please upload a clear personal photo.",
            ar: "الصورة المرفوعة لا تحتوي على وجه إنسان. يرجى رفع صورة شخصية واضحة.",
          },
          400,
        ),
      );
    }

    if (analysis.gender !== "unknown" && analysis.gender !== gender) {
      await deleteUploadedFile(photoDiskPath);
      return next(
        new ApiError(
          {
            en: "The gender in the photo does not match the selected gender in the request.",
            ar: "الجنس في الصورة لا يطابق الجنس المحدد في الطلب.",
          },
          400,
        ),
      );
    }

    const birthDate = new Date(birth_date);
    const now = new Date();
    let calculatedAge = now.getFullYear() - birthDate.getFullYear();
    const monthDiff = now.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && now.getDate() < birthDate.getDate())
    ) {
      calculatedAge--;
    }

    if (
      analysis.estimatedAge !== null &&
      Math.abs(analysis.estimatedAge - calculatedAge) > 10
    ) {
      await deleteUploadedFile(photoDiskPath);
      return next(
        new ApiError(
          {
            en: `The estimated age in the photo (${analysis.estimatedAge}) significantly differs from the calculated age (${calculatedAge}).`,
            ar: `العمر التقريبي في الصورة (${analysis.estimatedAge}) يختلف بشكل كبير عن العمر المحسوب (${calculatedAge}).`,
          },
          400,
        ),
      );
    }

    const existingEmail = await Citizen.findOne({ email }).lean();
    if (existingEmail) {
      await deleteUploadedFile(photoDiskPath);
      return next(
        new ApiError(
          {
            en: "Email is already registered for another citizen",
            ar: "البريد الإلكتروني مسجل مسبقًا لمواطن آخر",
          },
          409,
        ),
      );
    }

    const citizen = await Citizen.create({
      first_name,
      last_name,
      photo: photoStored,
      birth_date,
      gender,
      phone_number,
      email,
      religion,
      original_nationality,
      location,
      marital_status: "Single",
      parents_family_id: null,
      own_family_ids: [],
      added_by: req.admin._id,
    });

    isSuccess = true;

    return res.status(201).json({
      success: true,
      status: "success",
      statusCode: 201,
      message: {
        en: "Citizen created successfully",
        ar: "تم إنشاء المواطن بنجاح",
      },
      data: {
        citizen: citizen.toObject(),
        ai_analysis: {
          has_human: analysis.hasHuman,
          detected_gender: analysis.gender,
          estimated_age: analysis.estimatedAge,
          confidence: analysis.confidence,
        },
      },
    });
  } catch (error) {
    if (!isSuccess) {
      await deleteUploadedFile(photoDiskPath);
    }
    return next(error);
  }
};

export const GetAll = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      target_id,
      location,
      gender,
      marital_status,
      religion,
      original_nationality,
      citizenship_type,
      birth_date_from,
      birth_date_to,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.validated;

    const filter = {};

    if (target_id) filter._id = target_id;
    if (location) filter.location = location;
    if (gender) filter.gender = gender;
    if (marital_status) filter.marital_status = marital_status;
    if (religion) filter.religion = religion;

    if (original_nationality) {
      filter.original_nationality = original_nationality;
    } else if (citizenship_type === "naturalized") {
      filter.original_nationality = { $ne: "Syria" };
    } else if (citizenship_type === "by_birth") {
      filter.original_nationality = "Syria";
    }

    if (birth_date_from || birth_date_to) {
      filter.birth_date = {};

      if (birth_date_from) {
        filter.birth_date.$gte = parseBirthDateStart(birth_date_from);
      }

      if (birth_date_to) {
        filter.birth_date.$lte = parseBirthDateEnd(birth_date_to);
      }

      if (
        filter.birth_date.$gte &&
        filter.birth_date.$lte &&
        filter.birth_date.$gte > filter.birth_date.$lte
      ) {
        return next(
          new ApiError(
            {
              en: "birth_date_from must be before or equal to birth_date_to",
              ar: "تاريخ الميلاد (من) يجب أن يكون قبل أو يساوي تاريخ الميلاد (إلى)",
            },
            400,
          ),
        );
      }
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [rows, total] = await Promise.all([
      Citizen.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select("-__v")
        .lean(),
      Citizen.countDocuments(filter),
    ]);

    const data = rows.map(withCitizenshipType);
    const pages = Math.ceil(total / limit) || 1;

    return res.status(200).json({
      success: true,
      status: "success",
      statusCode: 200,
      message: {
        en: "Citizens retrieved successfully",
        ar: "تم جلب بيانات المواطنين بنجاح",
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

    const familyPopulateOptions = [
      {
        path: "father",
        select: "first_name last_name photo gender birth_date",
      },
      {
        path: "mother",
        select: "first_name last_name photo gender birth_date",
      },
      {
        path: "children_ids",
        select: "first_name last_name photo gender birth_date",
      },
    ];

    const citizen = await Citizen.findById(target_id)
      .populate({
        path: "parents_family_id",
        populate: familyPopulateOptions,
      })
      .populate({
        path: "own_family_ids",
        populate: familyPopulateOptions,
      })
      .lean();

    if (!citizen) {
      return next(
        new ApiError({ en: "Citizen not found", ar: "المواطن غير موجود" }, 404),
      );
    }

    return res.status(200).json({
      success: true,
      status: "success",
      statusCode: 200,
      message: {
        en: "Citizen retrieved successfully",
        ar: "تم جلب بيانات المواطن بنجاح",
      },
      data: withCitizenshipType(citizen),
    });
  } catch (error) {
    return next(error);
  }
};

export const UpdateCitizen = async (req, res, next) => {
  try {
    const {
      target_id,
      first_name,
      last_name,
      birth_date,
      email,
      phone_number,
      original_nationality,
      religion,
      location,
    } = req.validated;

    const citizen = await Citizen.findById(target_id);
    if (!citizen) {
      return next(
        new ApiError({ en: "Citizen not found", ar: "المواطن غير موجود" }, 404),
      );
    }

    const changes = {};

    if (first_name !== undefined && first_name !== citizen.first_name) {
      changes.first_name = first_name;
    }

    if (last_name !== undefined && last_name !== citizen.last_name) {
      changes.last_name = last_name;
    }

    if (phone_number !== undefined && phone_number !== citizen.phone_number) {
      changes.phone_number = phone_number;
    }

    if (
      original_nationality !== undefined &&
      original_nationality !== citizen.original_nationality
    ) {
      changes.original_nationality = original_nationality;
    }

    if (religion !== undefined && religion !== citizen.religion) {
      changes.religion = religion;
    }

    if (location !== undefined && location !== citizen.location) {
      changes.location = location;
    }

    if (birth_date !== undefined) {
      const newDate = new Date(birth_date);
      const oldDate = new Date(citizen.birth_date);
      if (newDate.getTime() !== oldDate.getTime()) {
        changes.birth_date = birth_date;
      }
    }

    if (email !== undefined && email !== citizen.email) {
      changes.email = email;
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

    if (changes.email) {
      const existing = await Citizen.findOne({
        email: changes.email,
        _id: { $ne: target_id },
      }).lean();

      if (existing) {
        return next(
          new ApiError(
            {
              en: "Email is already registered for another citizen",
              ar: "البريد الإلكتروني مسجل مسبقًا لمواطن آخر",
            },
            409,
          ),
        );
      }
    }

    if (changes.birth_date) {
      const newBirthDate = new Date(changes.birth_date);
      const now = new Date();

      if (newBirthDate > now) {
        return next(
          new ApiError(
            {
              en: "Birth date cannot be in the future",
              ar: "تاريخ الميلاد لا يمكن أن يكون في المستقبل",
            },
            400,
          ),
        );
      }

      let newAge = now.getFullYear() - newBirthDate.getFullYear();
      const monthDiff = now.getMonth() - newBirthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && now.getDate() < newBirthDate.getDate())
      ) {
        newAge--;
      }

      const hasOwnFamilies =
        Array.isArray(citizen.own_family_ids) &&
        citizen.own_family_ids.length > 0;
      const hasParentsFamily = !!citizen.parents_family_id;

      if (hasOwnFamilies && newAge < MIN_MARRIAGE_AGE) {
        return next(
          new ApiError(
            {
              en: `A citizen with a family must be at least ${MIN_MARRIAGE_AGE} years old`,
              ar: `المواطن الذي لديه عائلة يجب أن يكون عمره ${MIN_MARRIAGE_AGE} سنة على الأقل`,
            },
            400,
          ),
        );
      }

      const familyIds = [];
      if (hasParentsFamily) familyIds.push(citizen.parents_family_id);
      if (hasOwnFamilies) familyIds.push(...citizen.own_family_ids);

      if (familyIds.length > 0) {
        const families = await Family.find({ _id: { $in: familyIds } })
          .select("father mother children_ids")
          .lean();
        const familyMap = new Map(families.map((f) => [f._id.toString(), f]));

        if (hasParentsFamily) {
          const pf = familyMap.get(citizen.parents_family_id.toString());
          if (pf) {
            const parentIds = [];
            if (pf.father) parentIds.push(pf.father);
            if (pf.mother) parentIds.push(pf.mother);

            if (parentIds.length > 0) {
              const parents = await Citizen.find({ _id: { $in: parentIds } })
                .select("birth_date _id")
                .lean();

              for (const p of parents) {
                if (
                  p.birth_date &&
                  yearsDiff(p.birth_date, newBirthDate) <
                    MIN_PARENT_CHILD_AGE_GAP
                ) {
                  return next(
                    new ApiError(
                      {
                        en: `Parent ${p._id} must be at least ${MIN_PARENT_CHILD_AGE_GAP} years older than the citizen`,
                        ar: `الوالد ${p._id} يجب أن يكون أكبر من المواطن بـ ${MIN_PARENT_CHILD_AGE_GAP} سنة على الأقل`,
                      },
                      400,
                    ),
                  );
                }
              }
            }
          }
        }

        if (hasOwnFamilies) {
          const childIds = new Set();
          const spouseIds = new Set();

          for (const fid of citizen.own_family_ids) {
            const f = familyMap.get(fid.toString());
            if (!f) continue;

            for (const c of f.children_ids || []) childIds.add(String(c));

            if (citizen.gender === "male" && f.mother)
              spouseIds.add(String(f.mother));
            if (citizen.gender === "female" && f.father)
              spouseIds.add(String(f.father));
          }

          if (childIds.size > 0) {
            const children = await Citizen.find({
              _id: { $in: [...childIds] },
            })
              .select("birth_date _id")
              .lean();

            for (const c of children) {
              if (
                c.birth_date &&
                yearsDiff(newBirthDate, c.birth_date) < MIN_PARENT_CHILD_AGE_GAP
              ) {
                return next(
                  new ApiError(
                    {
                      en: `Child ${c._id} must be at least ${MIN_PARENT_CHILD_AGE_GAP} years younger than the citizen`,
                      ar: `الابن ${c._id} يجب أن يكون أصغر من المواطن بـ ${MIN_PARENT_CHILD_AGE_GAP} سنة على الأقل`,
                    },
                    400,
                  ),
                );
              }
            }
          }

          if (spouseIds.size > 0) {
            const spouses = await Citizen.find({
              _id: { $in: [...spouseIds] },
            })
              .select("birth_date _id")
              .lean();

            for (const s of spouses) {
              if (
                s.birth_date &&
                Math.abs(
                  newBirthDate.getTime() - new Date(s.birth_date).getTime(),
                ) >
                  100 * 365.25 * 24 * 60 * 60 * 1000
              ) {
                return next(
                  new ApiError(
                    {
                      en: "Age difference with spouse exceeds 100 years",
                      ar: "فرق العمر مع الزوج/الزوجة يتجاوز 100 سنة",
                    },
                    400,
                  ),
                );
              }
            }
          }
        }
      }
    }

    Object.assign(citizen, changes);
    await citizen.save();

    return res.status(200).json({
      success: true,
      status: "success",
      statusCode: 200,
      message: {
        en: "Citizen updated successfully",
        ar: "تم تحديث بيانات المواطن بنجاح",
      },
      data: {
        citizen: citizen.toObject(),
        updated_fields: Object.keys(changes),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const DeleteCitizen = async (req, res, next) => {
  try {
    const { target_id } = req.validated;

    const citizen = await Citizen.findById(target_id);
    if (!citizen) {
      return next(
        new ApiError({ en: "Citizen not found", ar: "المواطن غير موجود" }, 404),
      );
    }

    const familiesAsParent = await Family.find({
      $or: [{ father: citizen._id }, { mother: citizen._id }],
    })
      .select("father mother")
      .lean();

    const formerSpouses = new Set();
    for (const f of familiesAsParent) {
      if (citizen.gender === "male" && f.mother)
        formerSpouses.add(String(f.mother));
      if (citizen.gender === "female" && f.father)
        formerSpouses.add(String(f.father));
    }

    const ops = [];

    ops.push(
      Family.updateMany({ father: citizen._id }, { $set: { father: null } }),
    );

    ops.push(
      Family.updateMany({ mother: citizen._id }, { $set: { mother: null } }),
    );

    ops.push(
      Family.updateMany(
        { children_ids: citizen._id },
        { $pull: { children_ids: citizen._id } },
      ),
    );

    await Promise.all(ops);

    for (const spId of formerSpouses) {
      await Citizen.updateOne(
        { _id: spId },
        { $set: { marital_status: "Widowed" } },
      );
    }

    if (citizen.photo) {
      await deleteUploadedFile(toDiskPath(citizen.photo));
    }

    await Citizen.findByIdAndDelete(target_id);

    return res.status(200).json({
      success: true,
      status: "success",
      statusCode: 200,
      message: {
        en: "Citizen deleted successfully",
        ar: "تم حذف المواطن بنجاح",
      },
      data: {
        deleted_id: citizen._id,
        full_name: `${citizen.first_name} ${citizen.last_name}`,
        unlinked: {
          was_child_in_family: !!citizen.parents_family_id,
          own_families_count: Array.isArray(citizen.own_family_ids)
            ? citizen.own_family_ids.length
            : 0,
          former_spouses_count: formerSpouses.size,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};
