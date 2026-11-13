import Citizen from "../citizen/citizen.model.js";
import Family from "../family/family.model.js";
import { ApiError } from "../../utils/error/ApiError.js";

export const GetDashboardStats = async (req, res, next) => {
  try {
    const [citizenFacets, totalFamilies] = await Promise.all([
      Citizen.aggregate([
        {
          $facet: {
            totals: [{ $count: "count" }],
            byGender: [{ $group: { _id: "$gender", count: { $sum: 1 } } }],
            byGovernorate: [
              { $group: { _id: "$location", count: { $sum: 1 } } },
            ],
          },
        },
      ]),
      Family.countDocuments(),
    ]);

    const facets = citizenFacets[0] || {};
    const totalCitizens = facets.totals?.[0]?.count || 0;

    const genderMap = {};
    (facets.byGender || []).forEach(({ _id, count }) => {
      if (_id) genderMap[_id] = count;
    });

    const byGovernorate = {};
    (facets.byGovernorate || []).forEach(({ _id, count }) => {
      if (_id) byGovernorate[_id] = count;
    });

    return res.status(200).json({
      success: true,
      status: "success",
      statusCode: 200,
      message: {
        en: "Dashboard statistics retrieved successfully",
        ar: "تم جلب إحصائيات لوحة التحكم بنجاح",
      },
      data: {
        totalCitizens,
        males: genderMap.male || 0,
        females: genderMap.female || 0,
        totalFamilies,
        byGovernorate,
      },
    });
  } catch (error) {
    return next(error);
  }
};
