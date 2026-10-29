import { Router } from "express";
import { validate } from "../../utils/validation/validate.middleware.js";
import {
  CreateAdmin,
  GetAll,
  GetOne,
  ToggleStatus,
  Delete,
  ChangeAdminPassword,
  ChangeMyPassword,
  UpdateAdminData,
  UpdateMyData,
} from "./admin.controller.js";
import {
  CreateAdminValidation,
  AdminQueryValidation,
  ToggleStatusValidation,
  GetOneValidation,
  DeleteValidation,
  ChangeMyPasswordValidation,
  ChangeAdminPasswordValidation,
  UpdateAdminDataValidation,
  UpdateMyDataValidation,
} from "./admin.validation.js";
import {
  createAdminLimiter,
  getAllLimiter,
  getOneLimiter,
  ToggleStatusLimiter,
  deleteAdminLimiter,
  changeAdminPasswordLimiter,
  changeMyPasswordLimiter,
  updateAdminDataLimiter,
  updateMyDataLimiter,
} from "./admin.limiter.js";
import { protect } from "../../middleware/protect/protect.js";

const AdminRouter = Router();

AdminRouter.post(
  "/create",
  protect("super"),
  createAdminLimiter,
  validate(CreateAdminValidation),
  CreateAdmin,
);

AdminRouter.get(
  "/all",
  getAllLimiter,
  protect("super"),
  validate(AdminQueryValidation, "query"),
  GetAll,
);

AdminRouter.get(
  "/one",
  getOneLimiter,
  protect("super", "admin"),
  validate(GetOneValidation, "query"),
  GetOne,
);

AdminRouter.put(
  "/toggle-status",
  protect("super"),
  ToggleStatusLimiter,
  validate(ToggleStatusValidation),
  ToggleStatus,
);

AdminRouter.delete(
  "/delete",
  protect("super"),
  deleteAdminLimiter,
  validate(DeleteValidation),
  Delete,
);

AdminRouter.put(
  "/change-admin-password",
  protect("super"),
  changeAdminPasswordLimiter,
  validate(ChangeAdminPasswordValidation),
  ChangeAdminPassword,
);

AdminRouter.put(
  "/change-my-password",
  protect("super"),
  changeMyPasswordLimiter,
  validate(ChangeMyPasswordValidation),
  ChangeMyPassword,
);

AdminRouter.put(
  "/update-admin-data",
  protect("super"),
  validate(UpdateAdminDataValidation),
  updateAdminDataLimiter,
  UpdateAdminData,
);

AdminRouter.put(
  "/update-my-data",
  protect("super"),
  validate(UpdateMyDataValidation),
  updateMyDataLimiter,
  UpdateMyData,
);

export default AdminRouter;
