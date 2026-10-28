import Citizen from "./citizen.model.js";
import { ApiError } from "../../utils/error/ApiError.js";
import { analyzeCitizenPhoto } from "../../services/vision.service.js";
import { isValidObjectId } from "../../utils/id/id.validations.js";
import {
  deleteUploadedFile,
  toStoredPath,
  toDiskPath,
} from "../../utils/upload/multer.upload.js";

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

export const CreateCitizen = async (req, res, next) => {
  const photoStored = toStoredPath(req.file);
  const photoDiskPath = req.file?.path || null;
  let isSuccess = false;

  try {
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
      spouse_id,
    } = req.validated;

    if (!req.file) {
      return next(
        new ApiError(
          { en: "Citizen photo is required", ar: "صورة المواطن مطلوبة" },
          400,
        ),
      );
    }

    if (marital_status === "Married" && !spouse_id) {
      await deleteUploadedFile(photoDiskPath);
      return next(
        new ApiError(
          {
            en: "Cannot set marital_status to 'Married' without a spouse_id",
            ar: "لا يمكن ضبط الحالة الاجتماعية على 'Married' بدون معرف الزوج/الزوجة",
          },
          400,
        ),
      );
    }

    if (spouse_id && marital_status !== "Married") {
      await deleteUploadedFile(photoDiskPath);
      return next(
        new ApiError(
          {
            en: "marital_status must be 'Married' when spouse_id is provided",
            ar: "يجب أن تكون الحالة الاجتماعية 'Married' عند توفير معرف الزوج/الزوجة",
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
            en: `The gender in the photo (${analysis.gender}) does not match the selected gender (${gender}).`,
            ar: `الجنس في الصورة (${analysis.gender}) لا يطابق الجنس المحدد (${gender}).`,
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

    if (spouse_id) {
      if (!isValidObjectId(spouse_id)) {
        await deleteUploadedFile(photoDiskPath);
        return next(
          new ApiError(
            {
              en: "Invalid spouse ID format",
              ar: "صيغة معرف الزوج/الزوجة غير صالحة",
            },
            400,
          ),
        );
      }

      const spouse = await Citizen.findById(spouse_id)
        .select("_id gender spouse_id marital_status")
        .lean();

      if (!spouse) {
        await deleteUploadedFile(photoDiskPath);
        return next(
          new ApiError(
            { en: "Spouse not found", ar: "الزوج/الزوجة غير موجود" },
            404,
          ),
        );
      }

      if (spouse.gender === gender) {
        await deleteUploadedFile(photoDiskPath);
        return next(
          new ApiError(
            {
              en: "Spouse must be of the opposite gender",
              ar: "يجب أن يكون الزوج/الزوجة من الجنس المعاكس",
            },
            400,
          ),
        );
      }

      if (spouse.spouse_id) {
        await deleteUploadedFile(photoDiskPath);
        return next(
          new ApiError(
            {
              en: "Spouse is already married to another citizen",
              ar: "الزوج/الزوجة متزوج/ة من مواطن آخر بالفعل",
            },
            409,
          ),
        );
      }
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
      marital_status,
      spouse_id: spouse_id || null,
      added_by: req.admin._id,
    });

    isSuccess = true;

    if (spouse_id) {
      try {
        await Citizen.updateOne(
          { _id: spouse_id },
          { $set: { spouse_id: citizen._id, marital_status: "Married" } },
        );
      } catch (linkError) {
        console.error("🔴 Failed to link spouse:", linkError.message);
      }
    }

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
      location,
      gender,
      marital_status,
      original_nationality,
      citizenship_type,
      birth_date_from,
      birth_date_to,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.validated;

    const filter = {};

    if (location) filter.location = location;
    if (gender) filter.gender = gender;
    if (marital_status) filter.marital_status = marital_status;

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

    const citizen = await Citizen.findById(target_id)
      .select("-__v")
      .populate("father", "first_name last_name photo")
      .populate("mother", "first_name last_name photo")
      .populate("spouse_id", "first_name last_name photo")
      .populate("children_ids", "first_name last_name photo birth_date gender")
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

export const UpdateRelations = async (req, res, next) => {
  try {
    const {
      citizen_id,
      father,
      mother,
      children_ids,
      spouse_id,
      marital_status,
    } = req.validated;

    const citizen = await Citizen.findById(citizen_id);
    if (!citizen) {
      return next(
        new ApiError({ en: "Citizen not found", ar: "المواطن غير موجود" }, 404),
      );
    }

    if (father && father === citizen_id) {
      return next(
        new ApiError(
          {
            en: "A citizen cannot be their own father",
            ar: "لا يمكن أن يكون المواطن أبًا لنفسه",
          },
          400,
        ),
      );
    }

    if (mother && mother === citizen_id) {
      return next(
        new ApiError(
          {
            en: "A citizen cannot be their own mother",
            ar: "لا يمكن أن تكون المواطنة أمًا لنفسها",
          },
          400,
        ),
      );
    }

    if (children_ids && children_ids.includes(citizen_id)) {
      return next(
        new ApiError(
          {
            en: "A citizen cannot be their own child",
            ar: "لا يمكن أن يكون المواطن ابنًا لنفسه",
          },
          400,
        ),
      );
    }

    if (spouse_id && spouse_id === citizen_id) {
      return next(
        new ApiError(
          {
            en: "A citizen cannot marry themselves",
            ar: "لا يمكن للمواطن أن يتزوج نفسه",
          },
          400,
        ),
      );
    }

    if (father !== undefined && father !== null) {
      if (citizen.children_ids.map(String).includes(father)) {
        return next(
          new ApiError(
            {
              en: "Circular relation: father cannot be a child of this citizen",
              ar: "علاقة دائرية: لا يمكن أن يكون الأب ابنًا لهذا المواطن",
            },
            400,
          ),
        );
      }

      const fatherDoc = await Citizen.findById(father);
      if (!fatherDoc) {
        return next(
          new ApiError({ en: "Father not found", ar: "الأب غير موجود" }, 404),
        );
      }
      if (fatherDoc.gender !== "male") {
        return next(
          new ApiError(
            { en: "Father must be male", ar: "يجب أن يكون الأب ذكرًا" },
            400,
          ),
        );
      }
      if (
        fatherDoc.birth_date &&
        new Date(fatherDoc.birth_date) >= new Date(citizen.birth_date)
      ) {
        return next(
          new ApiError(
            {
              en: "Father must be older than the citizen",
              ar: "يجب أن يكون الأب أكبر سنًا من المواطن",
            },
            400,
          ),
        );
      }
    }

    if (mother !== undefined && mother !== null) {
      if (citizen.children_ids.map(String).includes(mother)) {
        return next(
          new ApiError(
            {
              en: "Circular relation: mother cannot be a child of this citizen",
              ar: "علاقة دائرية: لا يمكن أن تكون الأم ابنة لهذا المواطن",
            },
            400,
          ),
        );
      }

      const motherDoc = await Citizen.findById(mother);
      if (!motherDoc) {
        return next(
          new ApiError({ en: "Mother not found", ar: "الأم غير موجودة" }, 404),
        );
      }
      if (motherDoc.gender !== "female") {
        return next(
          new ApiError(
            { en: "Mother must be female", ar: "يجب أن تكون الأم أنثى" },
            400,
          ),
        );
      }
      if (
        motherDoc.birth_date &&
        new Date(motherDoc.birth_date) >= new Date(citizen.birth_date)
      ) {
        return next(
          new ApiError(
            {
              en: "Mother must be older than the citizen",
              ar: "يجب أن تكون الأم أكبر سنًا من المواطن",
            },
            400,
          ),
        );
      }
    }

    if (children_ids !== undefined && children_ids.length > 0) {
      const childrenDocs = await Citizen.find({
        _id: { $in: children_ids },
      })
        .select("_id birth_date gender father mother")
        .lean();

      if (childrenDocs.length !== children_ids.length) {
        return next(
          new ApiError(
            {
              en: "One or more children were not found",
              ar: "واحد أو أكثر من الأبناء غير موجود",
            },
            404,
          ),
        );
      }

      for (const child of childrenDocs) {
        if (new Date(child.birth_date) >= new Date(citizen.birth_date)) {
          return next(
            new ApiError(
              {
                en: `Child ${child._id} must be younger than the citizen`,
                ar: `الابن ${child._id} يجب أن يكون أصغر سنًا من المواطن`,
              },
              400,
            ),
          );
        }

        if (
          citizen.father?.toString() === child._id.toString() ||
          citizen.mother?.toString() === child._id.toString()
        ) {
          return next(
            new ApiError(
              {
                en: "Circular relation: child cannot be a parent of this citizen",
                ar: "علاقة دائرية: لا يمكن أن يكون الابن أبًا/أمًا لهذا المواطن",
              },
              400,
            ),
          );
        }
      }
    }

    if (spouse_id !== undefined && spouse_id !== null) {
      if (
        citizen.father?.toString() === spouse_id ||
        citizen.mother?.toString() === spouse_id
      ) {
        return next(
          new ApiError(
            {
              en: "A citizen cannot marry their parent",
              ar: "لا يمكن للمواطن الزواج من أحد والديه",
            },
            400,
          ),
        );
      }

      if (citizen.children_ids.map(String).includes(spouse_id)) {
        return next(
          new ApiError(
            {
              en: "A citizen cannot marry their child",
              ar: "لا يمكن للمواطن الزواج من أحد أبنائه",
            },
            400,
          ),
        );
      }

      const spouseDoc = await Citizen.findById(spouse_id)
        .select("_id gender spouse_id father mother children_ids")
        .lean();

      if (!spouseDoc) {
        return next(
          new ApiError(
            { en: "Spouse not found", ar: "الزوج/الزوجة غير موجود" },
            404,
          ),
        );
      }

      if (spouseDoc.gender === citizen.gender) {
        return next(
          new ApiError(
            {
              en: "Spouse must be of the opposite gender",
              ar: "يجب أن يكون الزوج/الزوجة من الجنس المعاكس",
            },
            400,
          ),
        );
      }

      if (
        spouseDoc.spouse_id &&
        spouseDoc.spouse_id.toString() !== citizen_id
      ) {
        return next(
          new ApiError(
            {
              en: "Spouse is already married to someone else",
              ar: "الزوج/الزوجة متزوج/ة من شخص آخر بالفعل",
            },
            409,
          ),
        );
      }

      if (
        spouseDoc.father?.toString() === citizen_id ||
        spouseDoc.mother?.toString() === citizen_id
      ) {
        return next(
          new ApiError(
            {
              en: "Circular relation: citizen is the spouse's parent",
              ar: "علاقة دائرية: لا يمكن أن يكون المواطن والد الزوج/الزوجة",
            },
            400,
          ),
        );
      }

      if (spouseDoc.children_ids?.map(String).includes(citizen_id)) {
        return next(
          new ApiError(
            {
              en: "Circular relation: citizen is the spouse's child",
              ar: "علاقة دائرية: لا يمكن أن يكون المواطن ابن الزوج/الزوجة",
            },
            400,
          ),
        );
      }
    }

    if (father === null && !citizen.father) {
      return next(
        new ApiError(
          {
            en: "This citizen has no father to remove",
            ar: "هذا المواطن ليس لديه أب لإزالته",
          },
          400,
        ),
      );
    }

    if (mother === null && !citizen.mother) {
      return next(
        new ApiError(
          {
            en: "This citizen has no mother to remove",
            ar: "هذه المواطنة ليس لديها أم لإزالتها",
          },
          400,
        ),
      );
    }

    if (
      children_ids !== undefined &&
      children_ids.length === 0 &&
      citizen.children_ids.length === 0
    ) {
      return next(
        new ApiError(
          {
            en: "This citizen has no children to remove",
            ar: "هذا المواطن ليس لديه أبناء لإزالتهم",
          },
          400,
        ),
      );
    }

    if (spouse_id === null && !citizen.spouse_id) {
      return next(
        new ApiError(
          {
            en: "This citizen has no spouse to remove",
            ar: "هذا المواطن ليس لديه زوج/زوجة لإزالته",
          },
          400,
        ),
      );
    }

    if (
      marital_status === "Married" &&
      spouse_id === undefined &&
      !citizen.spouse_id
    ) {
      return next(
        new ApiError(
          {
            en: "Cannot set marital_status to 'Married' without a spouse_id",
            ar: "لا يمكن ضبط الحالة الاجتماعية على 'Married' بدون معرف الزوج/الزوجة",
          },
          400,
        ),
      );
    }

    if (
      marital_status &&
      ["Single", "Divorced", "Widowed"].includes(marital_status) &&
      spouse_id === undefined &&
      citizen.spouse_id
    ) {
      return next(
        new ApiError(
          {
            en: `Cannot set marital_status to '${marital_status}' while still linked to a spouse. Use spouse_id: null first`,
            ar: `لا يمكن ضبط الحالة الاجتماعية على '${marital_status}' مع وجود زوج/زوجة. استخدم spouse_id: null أولًا`,
          },
          400,
        ),
      );
    }

    if (citizen.father) {
      const oldFatherDoc = await Citizen.findById(citizen.father)
        .select("_id")
        .lean();
      if (!oldFatherDoc) {
        console.warn(
          `⚠️ Data integrity: citizen ${citizen._id} references non-existent father ${citizen.father}`,
        );
        citizen.father = null;
      }
    }

    if (citizen.mother) {
      const oldMotherDoc = await Citizen.findById(citizen.mother)
        .select("_id")
        .lean();
      if (!oldMotherDoc) {
        console.warn(
          `⚠️ Data integrity: citizen ${citizen._id} references non-existent mother ${citizen.mother}`,
        );
        citizen.mother = null;
      }
    }

    if (citizen.spouse_id) {
      const oldSpouseDoc = await Citizen.findById(citizen.spouse_id)
        .select("_id")
        .lean();
      if (!oldSpouseDoc) {
        console.warn(
          `⚠️ Data integrity: citizen ${citizen._id} references non-existent spouse ${citizen.spouse_id}`,
        );
        citizen.spouse_id = null;
      }
    }

    const ops = [];

    if (father !== undefined) {
      const oldFather = citizen.father ? citizen.father.toString() : null;
      const newFather = father ? father.toString() : null;

      if (oldFather && oldFather !== newFather) {
        ops.push(
          Citizen.updateOne(
            { _id: oldFather },
            { $pull: { children_ids: citizen._id } },
          ),
        );
      }

      if (newFather && oldFather !== newFather) {
        ops.push(
          Citizen.updateOne(
            { _id: newFather },
            { $addToSet: { children_ids: citizen._id } },
          ),
        );
      }

      citizen.father = newFather ? newFather : null;
    }

    if (mother !== undefined) {
      const oldMother = citizen.mother ? citizen.mother.toString() : null;
      const newMother = mother ? mother.toString() : null;

      if (oldMother && oldMother !== newMother) {
        ops.push(
          Citizen.updateOne(
            { _id: oldMother },
            { $pull: { children_ids: citizen._id } },
          ),
        );
      }

      if (newMother && oldMother !== newMother) {
        ops.push(
          Citizen.updateOne(
            { _id: newMother },
            { $addToSet: { children_ids: citizen._id } },
          ),
        );
      }

      citizen.mother = newMother ? newMother : null;
    }

    if (children_ids !== undefined) {
      const oldChildren = citizen.children_ids.map(String);
      const newChildren = children_ids.map(String);

      const added = newChildren.filter((id) => !oldChildren.includes(id));
      const removed = oldChildren.filter((id) => !newChildren.includes(id));

      const parentField = citizen.gender === "male" ? "father" : "mother";

      for (const childId of added) {
        ops.push(
          Citizen.updateOne(
            { _id: childId },
            { $set: { [parentField]: citizen._id } },
          ),
        );
      }

      for (const childId of removed) {
        ops.push(
          Citizen.updateOne(
            { _id: childId, [parentField]: citizen._id },
            { $set: { [parentField]: null } },
          ),
        );
      }

      citizen.children_ids = newChildren;
    }

    if (spouse_id !== undefined) {
      const oldSpouse = citizen.spouse_id ? citizen.spouse_id.toString() : null;
      const newSpouse = spouse_id ? spouse_id.toString() : null;

      if (oldSpouse && oldSpouse !== newSpouse) {
        const endStatus = marital_status || "Divorced";
        ops.push(
          Citizen.updateOne(
            { _id: oldSpouse },
            { $set: { spouse_id: null, marital_status: endStatus } },
          ),
        );
      }

      if (newSpouse) {
        ops.push(
          Citizen.updateOne(
            { _id: newSpouse },
            { $set: { spouse_id: citizen._id, marital_status: "Married" } },
          ),
        );
        citizen.spouse_id = newSpouse;
        citizen.marital_status = "Married";
      } else {
        citizen.spouse_id = null;
        citizen.marital_status = marital_status || "Divorced";
      }
    } else if (marital_status !== undefined) {
      citizen.marital_status = marital_status;
    }

    await Promise.all(ops);
    await citizen.save();

    return res.status(200).json({
      success: true,
      status: "success",
      statusCode: 200,
      message: {
        en: "Citizen relations updated successfully",
        ar: "تم تحديث علاقات المواطن بنجاح",
      },
      data: {
        citizen_id: citizen._id,
        father: citizen.father,
        mother: citizen.mother,
        children_ids: citizen.children_ids,
        spouse_id: citizen.spouse_id,
        marital_status: citizen.marital_status,
      },
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

      const hasChildren =
        Array.isArray(citizen.children_ids) && citizen.children_ids.length > 0;
      const hasSpouse = !!citizen.spouse_id;

      if ((hasChildren || hasSpouse) && newAge < 18) {
        return next(
          new ApiError(
            {
              en: "A citizen with children or a spouse must be at least 18 years old",
              ar: "المواطن الذي لديه أبناء أو زوج/زوجة يجب أن يكون عمره 18 سنة على الأقل",
            },
            400,
          ),
        );
      }

      if (citizen.father) {
        const father = await Citizen.findById(citizen.father)
          .select("birth_date")
          .lean();
        if (father && new Date(father.birth_date) >= newBirthDate) {
          return next(
            new ApiError(
              {
                en: "Birth date cannot be earlier than or equal to the father's birth date",
                ar: "تاريخ الميلاد لا يمكن أن يكون قبل أو يساوي تاريخ ميلاد الأب",
              },
              400,
            ),
          );
        }
      }

      if (citizen.mother) {
        const mother = await Citizen.findById(citizen.mother)
          .select("birth_date")
          .lean();
        if (mother && new Date(mother.birth_date) >= newBirthDate) {
          return next(
            new ApiError(
              {
                en: "Birth date cannot be earlier than or equal to the mother's birth date",
                ar: "تاريخ الميلاد لا يمكن أن يكون قبل أو يساوي تاريخ ميلاد الأم",
              },
              400,
            ),
          );
        }
      }

      if (citizen.children_ids && citizen.children_ids.length > 0) {
        const children = await Citizen.find({
          _id: { $in: citizen.children_ids },
        })
          .select("birth_date _id")
          .lean();

        for (const child of children) {
          if (new Date(child.birth_date) <= newBirthDate) {
            return next(
              new ApiError(
                {
                  en: `Birth date cannot be later than or equal to child ${child._id}'s birth date`,
                  ar: `تاريخ الميلاد لا يمكن أن يكون بعد أو يساوي تاريخ ميلاد الابن ${child._id}`,
                },
                400,
              ),
            );
          }
        }
      }

      if (citizen.spouse_id) {
        const spouse = await Citizen.findById(citizen.spouse_id)
          .select("birth_date")
          .lean();
        if (
          spouse &&
          Math.abs(
            newBirthDate.getTime() - new Date(spouse.birth_date).getTime(),
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

    const ops = [];

    if (citizen.father) {
      ops.push(
        Citizen.updateOne(
          { _id: citizen.father },
          { $pull: { children_ids: citizen._id } },
        ),
      );
    }

    if (citizen.mother) {
      ops.push(
        Citizen.updateOne(
          { _id: citizen.mother },
          { $pull: { children_ids: citizen._id } },
        ),
      );
    }

    if (
      Array.isArray(citizen.children_ids) &&
      citizen.children_ids.length > 0
    ) {
      const parentField = citizen.gender === "male" ? "father" : "mother";
      ops.push(
        Citizen.updateMany(
          { _id: { $in: citizen.children_ids }, [parentField]: citizen._id },
          { $set: { [parentField]: null } },
        ),
      );
    }

    if (citizen.spouse_id) {
      ops.push(
        Citizen.updateOne(
          { _id: citizen.spouse_id, spouse_id: citizen._id },
          { $set: { spouse_id: null, marital_status: "Widowed" } },
        ),
      );
    }

    await Promise.all(ops);

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
          father: !!citizen.father,
          mother: !!citizen.mother,
          children_count: citizen.children_ids?.length || 0,
          spouse: !!citizen.spouse_id,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};
