import { Router } from "express";
import { validate } from "../../utils/validation/validate.middleware.js";
import { protect } from "../../middleware/protect/protect.js";
import { requirePermission } from "../../middleware/protect/permission.middleware.js";
import {
  createFamilyLimiter,
  getAllFamiliesLimiter,
  getOneFamilyLimiter,
  updateFamilyLimiter,
  deleteFamilyLimiter,
} from "./family.limiter.js";
import {
  CreateFamilyValidation,
  GetAllFamiliesValidation,
  GetFamiliesByCitizenValidation,
  GetOneFamilyValidation,
  UpdateFamilyValidation,
  DeleteFamilyValidation,
} from "./family.validation.js";
import {
  CreateFamily,
  GetAll,
  GetOne,
  UpdateFamily,
  DeleteFamily,
} from "./family.controller.js";

const FamilyRouter = Router();

FamilyRouter.use(protect("admin", "super"));

FamilyRouter.post(
  "/create",
  requirePermission("create"),
  createFamilyLimiter,
  validate(CreateFamilyValidation),
  CreateFamily,
);

FamilyRouter.get(
  "/all",
  requirePermission("read"),
  getAllFamiliesLimiter,
  validate(GetAllFamiliesValidation, "query"),
  GetAll,
);

FamilyRouter.get(
  "/by-citizen",
  requirePermission("read"),
  getAllFamiliesLimiter,
  validate(GetFamiliesByCitizenValidation, "query"),
  GetAll,
);

FamilyRouter.get(
  "/one",
  requirePermission("read"),
  getOneFamilyLimiter,
  validate(GetOneFamilyValidation, "query"),
  GetOne,
);

FamilyRouter.put(
  "/update",
  requirePermission("update"),
  updateFamilyLimiter,
  validate(UpdateFamilyValidation),
  UpdateFamily,
);

FamilyRouter.delete(
  "/delete",
  requirePermission("delete"),
  deleteFamilyLimiter,
  validate(DeleteFamilyValidation, "query"),
  DeleteFamily,
);

export default FamilyRouter;
