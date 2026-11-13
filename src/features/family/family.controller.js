import Family from "./family.model.js";
import Citizen from "../citizen/citizen.model.js";
import { ApiError } from "../../utils/error/ApiError.js";

const MAX_SPOUSES_FOR_MALE = 4;
const MAX_SPOUSES_FOR_FEMALE = 1;
const MIN_MARRIAGE_AGE = 18;

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

async function ensureParentExistsAndGender(id, expectedGender) {
  const doc = await Citizen.findById(id);
  if (!doc) {
    return {
      error: new ApiError(
        {
          en:
            expectedGender === "male" ? "Father not found" : "Mother not found",
          ar: expectedGender === "male" ? "الأب غير موجود" : "الأم غير موجودة",
        },
        404,
      ),
    };
  }
  if (doc.gender !== expectedGender) {
    return {
      error: new ApiError(
        {
          en:
            expectedGender === "male"
              ? "Father must be male"
              : "Mother must be female",
          ar:
            expectedGender === "male"
              ? "يجب أن يكون الأب ذكرًا"
              : "يجب أن تكون الأم أنثى",
        },
        400,
      ),
    };
  }
  return { doc };
}

async function ensureChildrenValid(childrenIds, fatherId, motherId) {
  if (childrenIds.length === 0) return { docs: [], deduped: [] };

  const deduped = [...new Set(childrenIds.map(String))];

  if (fatherId && deduped.includes(String(fatherId))) {
    return {
      error: new ApiError(
        {
          en: "A father cannot be listed as his own child",
          ar: "لا يمكن أن يكون الأب ابنًا لنفسه",
        },
        400,
      ),
    };
  }

  if (motherId && deduped.includes(String(motherId))) {
    return {
      error: new ApiError(
        {
          en: "A mother cannot be listed as her own child",
          ar: "لا يمكن أن تكون الأم ابنة لنفسها",
        },
        400,
      ),
    };
  }

  const docs = await Citizen.find({ _id: { $in: deduped } })
    .select("_id gender parents_family_id birth_date")
    .lean();

  if (docs.length !== deduped.length) {
    return {
      error: new ApiError(
        {
          en: "One or more children were not found",
          ar: "واحد أو أكثر من الأبناء غير موجود",
        },
        404,
      ),
    };
  }

  return { docs, deduped };
}

async function ensureNoBloodRelation(fatherDoc, motherDoc) {
  const fatherId = fatherDoc._id.toString();
  const motherId = motherDoc._id.toString();

  const fatherParentsFamilyId = fatherDoc.parents_family_id;
  const motherParentsFamilyId = motherDoc.parents_family_id;

  const [fatherParentsFamily, motherParentsFamily] = await Promise.all([
    fatherParentsFamilyId
      ? Family.findById(fatherParentsFamilyId).select("father mother").lean()
      : null,
    motherParentsFamilyId
      ? Family.findById(motherParentsFamilyId).select("father mother").lean()
      : null,
  ]);

  if (motherParentsFamily) {
    if (
      motherParentsFamily.father?.toString() === fatherId ||
      motherParentsFamily.mother?.toString() === fatherId
    ) {
      return {
        error: new ApiError(
          {
            en: "A parent cannot marry their own child",
            ar: "لا يمكن للوالد الزواج من ابنه أو ابنته",
          },
          400,
        ),
      };
    }
  }

  if (fatherParentsFamily) {
    if (
      fatherParentsFamily.father?.toString() === motherId ||
      fatherParentsFamily.mother?.toString() === motherId
    ) {
      return {
        error: new ApiError(
          {
            en: "A parent cannot marry their own child",
            ar: "لا يمكن للوالد الزواج من ابنه أو ابنته",
          },
          400,
        ),
      };
    }
  }

  if (fatherParentsFamily && motherParentsFamily) {
    const fFather = fatherParentsFamily.father?.toString() || null;
    const fMother = fatherParentsFamily.mother?.toString() || null;
    const mFather = motherParentsFamily.father?.toString() || null;
    const mMother = motherParentsFamily.mother?.toString() || null;

    const sameFather = !!(fFather && mFather && fFather === mFather);
    const sameMother = !!(fMother && mMother && fMother === mMother);

    if (sameFather || sameMother) {
      return {
        error: new ApiError(
          {
            en: "Siblings cannot marry each other (sharing the same father or mother, or both)",
            ar: "لا يمكن الزواج بين الإخوة (من الأب أو الأم أو كليهما)",
          },
          400,
        ),
      };
    }
  }

  return { ok: true };
}

async function ensureNoDuplicateParents(
  fatherId,
  motherId,
  excludeFamilyId = null,
) {
  const filter = {
    father: fatherId || null,
    mother: motherId || null,
  };

  if (excludeFamilyId) {
    filter._id = { $ne: excludeFamilyId };
  }

  const duplicate = await Family.findOne(filter).select("_id").lean();
  return !!duplicate;
}

export const CreateFamily = async (req, res, next) => {
  try {
    const { father, mother, children_ids } = req.validated;

    if (!father && !mother) {
      return next(
        new ApiError(
          {
            en: "At least one parent (father or mother) is required",
            ar: "يجب توفير الأب أو الأم على الأقل",
          },
          400,
        ),
      );
    }

    if (father && mother && String(father) === String(mother)) {
      return next(
        new ApiError(
          {
            en: "Father and mother must be different people",
            ar: "يجب أن يكون الأب والأم شخصين مختلفين",
          },
          400,
        ),
      );
    }

    let fatherDoc = null;
    let motherDoc = null;

    if (father) {
      const { doc, error } = await ensureParentExistsAndGender(father, "male");
      if (error) return next(error);
      fatherDoc = doc;

      const familyCount = Array.isArray(doc.own_family_ids)
        ? doc.own_family_ids.length
        : 0;
      if (familyCount >= MAX_SPOUSES_FOR_MALE) {
        return next(
          new ApiError(
            {
              en: `The father already has the maximum of ${MAX_SPOUSES_FOR_MALE} families`,
              ar: `الأب لديه بالفعل الحد الأقصى وهو ${MAX_SPOUSES_FOR_MALE} عائلات`,
            },
            400,
          ),
        );
      }

      if (
        doc.birth_date &&
        yearsDiff(doc.birth_date, new Date()) < MIN_MARRIAGE_AGE
      ) {
        return next(
          new ApiError(
            {
              en: `The father must be at least ${MIN_MARRIAGE_AGE} years old`,
              ar: `يجب أن يكون عمر الأب ${MIN_MARRIAGE_AGE} سنة على الأقل`,
            },
            400,
          ),
        );
      }
    }

    if (mother) {
      const { doc, error } = await ensureParentExistsAndGender(
        mother,
        "female",
      );
      if (error) return next(error);
      motherDoc = doc;

      const familyCount = Array.isArray(doc.own_family_ids)
        ? doc.own_family_ids.length
        : 0;
      if (familyCount >= MAX_SPOUSES_FOR_FEMALE) {
        return next(
          new ApiError(
            {
              en: `The mother already has the maximum of ${MAX_SPOUSES_FOR_FEMALE} family`,
              ar: `الأم لديها بالفعل الحد الأقصى وهو ${MAX_SPOUSES_FOR_FEMALE} عائلة`,
            },
            400,
          ),
        );
      }

      if (
        doc.birth_date &&
        yearsDiff(doc.birth_date, new Date()) < MIN_MARRIAGE_AGE
      ) {
        return next(
          new ApiError(
            {
              en: `The mother must be at least ${MIN_MARRIAGE_AGE} years old`,
              ar: `يجب أن يكون عمر الأم ${MIN_MARRIAGE_AGE} سنة على الأقل`,
            },
            400,
          ),
        );
      }
    }

    if (fatherDoc && motherDoc) {
      const bloodCheck = await ensureNoBloodRelation(fatherDoc, motherDoc);
      if (bloodCheck.error) return next(bloodCheck.error);
    }

    const isDuplicate = await ensureNoDuplicateParents(father, mother);
    if (isDuplicate) {
      return next(
        new ApiError(
          {
            en: "A family with the same father and mother already exists. Each spouse pair can only have one family record.",
            ar: "توجد عائلة بالفعل بنفس الأب والأم. لا يمكن أن يكون لكل زوجين أكثر من سجل عائلي واحد.",
          },
          409,
        ),
      );
    }

    const {
      docs: childDocs,
      deduped,
      error: childErr,
    } = await ensureChildrenValid(children_ids || [], father, mother);
    if (childErr) return next(childErr);

    for (const child of childDocs) {
      if (child.parents_family_id) {
        return next(
          new ApiError(
            {
              en: `Child ${child._id} already belongs to another family. Remove them from that family first.`,
              ar: `الابن ${child._id} ينتمي بالفعل إلى عائلة أخرى. أزله منها أولًا.`,
            },
            400,
          ),
        );
      }
    }

    const family = await Family.create({
      father: father || null,
      mother: mother || null,
      children_ids: deduped || [],
      added_by: req.admin._id,
    });

    const ops = [];

    if (father) {
      ops.push(
        Citizen.updateOne(
          { _id: father },
          {
            $addToSet: { own_family_ids: family._id },
            ...(mother ? { $set: { marital_status: "Married" } } : {}),
          },
        ),
      );
    }

    if (mother) {
      ops.push(
        Citizen.updateOne(
          { _id: mother },
          {
            $addToSet: { own_family_ids: family._id },
            ...(father ? { $set: { marital_status: "Married" } } : {}),
          },
        ),
      );
    }

    for (const childId of deduped || []) {
      ops.push(
        Citizen.updateOne(
          { _id: childId },
          { $set: { parents_family_id: family._id } },
        ),
      );
    }

    await Promise.all(ops);

    return res.status(201).json({
      success: true,
      status: "success",
      statusCode: 201,
      message: {
        en: "Family created successfully",
        ar: "تم إنشاء العائلة بنجاح",
      },
      data: family,
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
      target_id,
      citizen_id,
      relation,
      father,
      mother,
      added_by,
      has_father,
      has_mother,
      has_children,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.validated;

    const filter = {};

    if (target_id) filter._id = target_id;
    if (added_by) filter.added_by = added_by;

    if (citizen_id) {
      if (relation === "father") {
        filter.father = citizen_id;
      } else if (relation === "mother") {
        filter.mother = citizen_id;
      } else if (relation === "child") {
        filter.children_ids = citizen_id;
      } else {
        filter.$or = [
          { father: citizen_id },
          { mother: citizen_id },
          { children_ids: citizen_id },
        ];
      }
    } else {
      if (father) filter.father = father;
      if (mother) filter.mother = mother;

      if (has_father === true) filter.father = { $ne: null };
      if (has_father === false) filter.father = null;
      if (has_mother === true) filter.mother = { $ne: null };
      if (has_mother === false) filter.mother = null;
    }

    if (has_children === true) filter["children_ids.0"] = { $exists: true };
    if (has_children === false) filter.children_ids = { $size: 0 };

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [rows, total] = await Promise.all([
      Family.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate("father", "first_name last_name photo gender birth_date")
        .populate("mother", "first_name last_name photo gender birth_date")
        .populate(
          "children_ids",
          "first_name last_name photo gender birth_date",
        )
        .lean(),
      Family.countDocuments(filter),
    ]);

    const pages = Math.ceil(total / limit) || 1;

    return res.status(200).json({
      success: true,
      status: "success",
      statusCode: 200,
      message: {
        en: "Families retrieved successfully",
        ar: "تم جلب بيانات العائلات بنجاح",
      },
      data: rows,
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

    const family = await Family.findById(target_id)
      .populate("father", "first_name last_name photo gender birth_date")
      .populate("mother", "first_name last_name photo gender birth_date")
      .populate("children_ids", "first_name last_name photo gender birth_date")
      .lean();

    if (!family) {
      return next(
        new ApiError({ en: "Family not found", ar: "العائلة غير موجودة" }, 404),
      );
    }

    return res.status(200).json({
      success: true,
      status: "success",
      statusCode: 200,
      message: {
        en: "Family retrieved successfully",
        ar: "تم جلب بيانات العائلة بنجاح",
      },
      data: family,
    });
  } catch (error) {
    return next(error);
  }
};

export const UpdateFamily = async (req, res, next) => {
  try {
    const { target_id, father, mother, children_ids } = req.validated;

    const family = await Family.findById(target_id);
    if (!family) {
      return next(
        new ApiError({ en: "Family not found", ar: "العائلة غير موجودة" }, 404),
      );
    }

    const oldFather = family.father ? family.father.toString() : null;
    const oldMother = family.mother ? family.mother.toString() : null;
    const oldChildren = (family.children_ids || []).map(String);

    const newFather =
      father !== undefined ? (father ? father.toString() : null) : oldFather;

    const newMother =
      mother !== undefined ? (mother ? mother.toString() : null) : oldMother;

    if (!newFather && !newMother) {
      return next(
        new ApiError(
          {
            en: "At least one parent (father or mother) is required",
            ar: "يجب توفير الأب أو الأم على الأقل",
          },
          400,
        ),
      );
    }

    if (newFather && newMother && newFather === newMother) {
      return next(
        new ApiError(
          {
            en: "Father and mother must be different people",
            ar: "يجب أن يكون الأب والأم شخصين مختلفين",
          },
          400,
        ),
      );
    }

    if (newFather !== oldFather && newFather) {
      const { doc, error } = await ensureParentExistsAndGender(
        newFather,
        "male",
      );
      if (error) return next(error);

      const currentIds = Array.isArray(doc.own_family_ids)
        ? doc.own_family_ids.map(String)
        : [];

      if (!currentIds.includes(String(family._id))) {
        if (currentIds.length >= MAX_SPOUSES_FOR_MALE) {
          return next(
            new ApiError(
              {
                en: `The father already has the maximum of ${MAX_SPOUSES_FOR_MALE} families`,
                ar: `الأب لديه بالفعل الحد الأقصى وهو ${MAX_SPOUSES_FOR_MALE} عائلات`,
              },
              400,
            ),
          );
        }
      }
    }

    if (newMother !== oldMother && newMother) {
      const { doc, error } = await ensureParentExistsAndGender(
        newMother,
        "female",
      );
      if (error) return next(error);

      const currentIds = Array.isArray(doc.own_family_ids)
        ? doc.own_family_ids.map(String)
        : [];

      if (!currentIds.includes(String(family._id))) {
        if (currentIds.length >= MAX_SPOUSES_FOR_FEMALE) {
          return next(
            new ApiError(
              {
                en: `The mother already has the maximum of ${MAX_SPOUSES_FOR_FEMALE} family`,
                ar: `الأم لديها بالفعل الحد الأقصى وهو ${MAX_SPOUSES_FOR_FEMALE} عائلة`,
              },
              400,
            ),
          );
        }
      }
    }

    if (newFather && newMother) {
      const [fatherDocForBlood, motherDocForBlood] = await Promise.all([
        Citizen.findById(newFather)
          .select("_id gender parents_family_id birth_date")
          .lean(),
        Citizen.findById(newMother)
          .select("_id gender parents_family_id birth_date")
          .lean(),
      ]);

      if (fatherDocForBlood && motherDocForBlood) {
        const bloodCheck = await ensureNoBloodRelation(
          fatherDocForBlood,
          motherDocForBlood,
        );
        if (bloodCheck.error) return next(bloodCheck.error);
      }
    }

    if (newFather !== oldFather || newMother !== oldMother) {
      const isDuplicate = await ensureNoDuplicateParents(
        newFather,
        newMother,
        family._id,
      );
      if (isDuplicate) {
        return next(
          new ApiError(
            {
              en: "Another family with the same father and mother already exists. Each spouse pair can only have one family record.",
              ar: "توجد عائلة أخرى بنفس الأب والأم. لا يمكن أن يكون لكل زوجين أكثر من سجل عائلي واحد.",
            },
            409,
          ),
        );
      }
    }

    const newChildren =
      children_ids !== undefined
        ? [...new Set(children_ids.map(String))]
        : oldChildren;

    const { docs: childDocs, error: childErr } = await ensureChildrenValid(
      newChildren,
      newFather,
      newMother,
    );
    if (childErr) return next(childErr);

    const addedChildren = newChildren.filter((id) => !oldChildren.includes(id));
    const removedChildren = oldChildren.filter(
      (id) => !newChildren.includes(id),
    );

    for (const child of childDocs) {
      const childId = child._id.toString();
      if (
        addedChildren.includes(childId) &&
        child.parents_family_id &&
        child.parents_family_id.toString() !== String(family._id)
      ) {
        return next(
          new ApiError(
            {
              en: `Child ${childId} already belongs to another family. Remove them from that family first.`,
              ar: `الابن ${childId} ينتمي بالفعل إلى عائلة أخرى. أزله منها أولًا.`,
            },
            400,
          ),
        );
      }
    }

    const ops = [];

    if (newFather !== oldFather) {
      if (oldFather && oldFather !== newFather) {
        ops.push(
          Citizen.updateOne(
            { _id: oldFather },
            { $pull: { own_family_ids: family._id } },
          ),
        );
      }
      if (newFather && oldFather !== newFather) {
        ops.push(
          Citizen.updateOne(
            { _id: newFather },
            { $addToSet: { own_family_ids: family._id } },
          ),
        );
      }
      family.father = newFather || null;
    }

    if (newMother !== oldMother) {
      if (oldMother && oldMother !== newMother) {
        ops.push(
          Citizen.updateOne(
            { _id: oldMother },
            { $pull: { own_family_ids: family._id } },
          ),
        );
      }
      if (newMother && oldMother !== newMother) {
        ops.push(
          Citizen.updateOne(
            { _id: newMother },
            { $addToSet: { own_family_ids: family._id } },
          ),
        );
      }
      family.mother = newMother || null;
    }

    if (children_ids !== undefined) {
      for (const childId of addedChildren) {
        ops.push(
          Citizen.updateOne(
            { _id: childId },
            { $set: { parents_family_id: family._id } },
          ),
        );
      }

      for (const childId of removedChildren) {
        ops.push(
          Citizen.updateOne(
            { _id: childId, parents_family_id: family._id },
            { $set: { parents_family_id: null } },
          ),
        );
      }

      family.children_ids = newChildren;
    }

    if (newFather && newMother) {
      ops.push(
        Citizen.updateOne(
          { _id: newFather },
          { $set: { marital_status: "Married" } },
        ),
      );
      ops.push(
        Citizen.updateOne(
          { _id: newMother },
          { $set: { marital_status: "Married" } },
        ),
      );
    }

    await Promise.all(ops);
    await family.save();

    return res.status(200).json({
      success: true,
      status: "success",
      statusCode: 200,
      message: {
        en: "Family updated successfully",
        ar: "تم تحديث بيانات العائلة بنجاح",
      },
      data: family,
    });
  } catch (error) {
    return next(error);
  }
};

export const DeleteFamily = async (req, res, next) => {
  try {
    const { target_id } = req.validated;

    const family = await Family.findById(target_id);
    if (!family) {
      return next(
        new ApiError({ en: "Family not found", ar: "العائلة غير موجودة" }, 404),
      );
    }

    const fatherId = family.father ? family.father.toString() : null;
    const motherId = family.mother ? family.mother.toString() : null;
    const childrenIds = (family.children_ids || []).map(String);

    const ops = [];

    if (fatherId) {
      ops.push(
        Citizen.updateOne(
          { _id: fatherId },
          { $pull: { own_family_ids: family._id } },
        ),
      );
    }

    if (motherId) {
      ops.push(
        Citizen.updateOne(
          { _id: motherId },
          { $pull: { own_family_ids: family._id } },
        ),
      );
    }

    for (const childId of childrenIds) {
      ops.push(
        Citizen.updateOne(
          { _id: childId, parents_family_id: family._id },
          { $set: { parents_family_id: null } },
        ),
      );
    }

    await Promise.all(ops);

    if (fatherId) {
      const fatherDoc = await Citizen.findById(fatherId)
        .select("own_family_ids marital_status")
        .lean();
      if (
        fatherDoc &&
        (!Array.isArray(fatherDoc.own_family_ids) ||
          fatherDoc.own_family_ids.length === 0) &&
        fatherDoc.marital_status === "Married"
      ) {
        await Citizen.updateOne(
          { _id: fatherId },
          { $set: { marital_status: "Divorced" } },
        );
      }
    }

    if (motherId) {
      const motherDoc = await Citizen.findById(motherId)
        .select("own_family_ids marital_status")
        .lean();
      if (
        motherDoc &&
        (!Array.isArray(motherDoc.own_family_ids) ||
          motherDoc.own_family_ids.length === 0) &&
        motherDoc.marital_status === "Married"
      ) {
        await Citizen.updateOne(
          { _id: motherId },
          { $set: { marital_status: "Divorced" } },
        );
      }
    }

    await Family.findByIdAndDelete(target_id);

    return res.status(200).json({
      success: true,
      status: "success",
      statusCode: 200,
      message: {
        en: "Family deleted successfully",
        ar: "تم حذف العائلة بنجاح",
      },
      data: {
        deleted_id: family._id,
        unlinked: {
          father: !!fatherId,
          mother: !!motherId,
          children_count: childrenIds.length,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};
