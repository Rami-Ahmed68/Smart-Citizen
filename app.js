import "dotenv/config";

import express from "express";
import { connectDB } from "./src/db/db.js";
import { Global, notFound } from "./src/middleware/error/globalError.js";
import { seedSuperAdmin } from "./src/features/admin/admin.seeder.js";
import AdminRouter from "./src/features/admin/admin.routes.js";
import CitizenRouter from "./src/features/citizen/citizen.routes.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/admin", AdminRouter);
app.use("/citizen", CitizenRouter);

app.use(notFound);
app.use(Global);

async function start() {
  await connectDB();
  await seedSuperAdmin();

  app.listen(PORT, () => {
    console.log(`############ App listen at port ${PORT} ############`);
  });
}

start();
