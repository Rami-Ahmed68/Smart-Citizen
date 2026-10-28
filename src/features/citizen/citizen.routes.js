import { Router } from "express";
import { validate } from "../../utils/validation/validate.middleware.js";
import { protect } from "../../middleware/auth/auth.middleware.js";
import { uploadCitizenPhoto } from "../../utils/upload/multer.upload.js";
import {
  createCitizenLimiter,
  getAllCitizensLimiter,
  getOneCitizenLimiter,
  updateRelationsLimiter,
  updateCitizenLimiter,
  deleteCitizenLimiter,
} from "./citizen.limiter.js";
import {
  CreateCitizenValidation,
  GetAllCitizensValidation,
  GetOneCitizenValidation,
  UpdateRelationsValidation,
  UpdateCitizenValidation,
  DeleteCitizenValidation,
} from "./citizen.validation.js";
import {
  CreateCitizen,
  GetAll,
  GetOne,
  UpdateRelations,
  UpdateCitizen,
  DeleteCitizen,
} from "./citizen.controller.js";

const CitizenRouter = Router();

CitizenRouter.use(protect("admin", "super"));

CitizenRouter.post(
  "/create",
  createCitizenLimiter,
  uploadCitizenPhoto,
  validate(CreateCitizenValidation),
  CreateCitizen,
);

CitizenRouter.get(
  "/all",
  getAllCitizensLimiter,
  validate(GetAllCitizensValidation, "query"),
  GetAll,
);

CitizenRouter.get(
  "/",
  getOneCitizenLimiter,
  validate(GetOneCitizenValidation, "query"),
  GetOne,
);

CitizenRouter.put(
  "/relations",
  updateRelationsLimiter,
  validate(UpdateRelationsValidation),
  UpdateRelations,
);

CitizenRouter.put(
  "/update",
  updateCitizenLimiter,
  validate(UpdateCitizenValidation),
  UpdateCitizen,
);

CitizenRouter.delete(
  "/delete",
  deleteCitizenLimiter,
  validate(DeleteCitizenValidation, "query"),
  DeleteCitizen,
);

export default CitizenRouter;
