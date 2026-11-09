import "dotenv/config";

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./src/db/db.js";
import { Global, notFound } from "./src/middleware/error/globalError.js";
import { seedSuperAdmin } from "./src/features/admin/admin.seeder.js";
import AdminRouter from "./src/features/admin/admin.routes.js";
import CitizenRouter from "./src/features/citizen/citizen.routes.js";
import AdminAuthRouter from "./src/features/admin/auth/auth.routes.js";
import FamilyRouter from "./src/features/family/family.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, "uploads");

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = ["http://localhost:3001", "http://127.0.0.1:3001"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Set-Cookie"],
    maxAge: 86400,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const setStaticHeaders = (req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
};

const staticOptions = {
  etag: false,
  lastModified: false,
  index: false,
  dotfiles: "deny",
  redirect: false,
};

app.use(
  "/uploads/admins",
  setStaticHeaders,
  express.static(path.join(UPLOADS_DIR, "admins"), staticOptions),
);

app.use(
  "/uploads/citizens",
  setStaticHeaders,
  express.static(path.join(UPLOADS_DIR, "citizens"), staticOptions),
);

app.use("/admin/auth", AdminAuthRouter);
app.use("/admin", AdminRouter);
app.use("/citizen", CitizenRouter);
app.use("/family", FamilyRouter);

app.use(notFound);
app.use(Global);

async function start() {
  await connectDB();
  await seedSuperAdmin();

  app.listen(PORT, () => {
    console.log(`############ App listen at port ${PORT} ############`);
    console.log(`📂 Admin files:   /uploads/admins/`);
    console.log(`📂 Citizen files: /uploads/citizens/`);
  });
}

start();
