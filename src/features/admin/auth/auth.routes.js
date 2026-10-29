import { Router } from "express";
import { LogIn, RefreshTokenMethod, LogOut } from "./auth.controller.js";
import { validate } from "../../../utils/validation/validate.middleware.js";
import { LogInLimiter, RefreshTokenLimiter } from "./auth.limiter.js";
import { LogInValidation, LogOutValidation } from "./auth.validation.js";
import { NotFound } from "../../../middleware/notFound/notFound.js";

const AdminAuthRouter = Router();

AdminAuthRouter.post("/log-in", LogInLimiter, validate(LogInValidation), LogIn);

AdminAuthRouter.post("/refresh-token", RefreshTokenLimiter, RefreshTokenMethod);

AdminAuthRouter.post("/log-out", validate(LogOutValidation), LogOut);

AdminAuthRouter.use(NotFound);

export default AdminAuthRouter;
