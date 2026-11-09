import { Router } from "express";
import { validate } from "../../utils/validation/validate.middleware.js";
import { protect } from "../../middleware/protect/protect.js";
import { requirePermission } from "../../middleware/protect/permission.middleware.js";
import { uploadCitizenPhoto } from "../../utils/upload/multer.upload.js";
import {
  createCitizenLimiter,
  getAllCitizensLimiter,
  getOneCitizenLimiter,
  updateCitizenLimiter,
  deleteCitizenLimiter,
} from "./citizen.limiter.js";
import {
  CreateCitizenValidation,
  GetAllCitizensValidation,
  GetOneCitizenValidation,
  UpdateCitizenValidation,
  DeleteCitizenValidation,
} from "./citizen.validation.js";
import {
  CreateCitizen,
  GetAll,
  GetOne,
  UpdateCitizen,
  DeleteCitizen,
} from "./citizen.controller.js";

const CitizenRouter = Router();

CitizenRouter.use(protect("admin", "super"));

CitizenRouter.post(
  "/create",
  requirePermission("create"),
  createCitizenLimiter,
  uploadCitizenPhoto,
  validate(CreateCitizenValidation),
  CreateCitizen,
);

CitizenRouter.get(
  "/all",
  requirePermission("read"),
  getAllCitizensLimiter,
  validate(GetAllCitizensValidation, "query"),
  GetAll,
);

CitizenRouter.get(
  "/one",
  requirePermission("read"),
  getOneCitizenLimiter,
  validate(GetOneCitizenValidation, "query"),
  GetOne,
);

CitizenRouter.put(
  "/update",
  requirePermission("update"),
  updateCitizenLimiter,
  validate(UpdateCitizenValidation),
  UpdateCitizen,
);

CitizenRouter.delete(
  "/delete",
  requirePermission("delete"),
  deleteCitizenLimiter,
  validate(DeleteCitizenValidation, "query"),
  DeleteCitizen,
);

export default CitizenRouter;
