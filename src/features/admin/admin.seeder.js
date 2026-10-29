import Admin from "./admin.model.js";
import { hashPassword } from "../../middleware/password/bcrypt.js";

const DEFAULT_AVATARS = {
  male: "https://example.com/avatars/default-male.png",
  female: "https://example.com/avatars/default-female.png",
};

const REQUIRED_ENV = [
  "SUPERADMIN_FIRST_NAME",
  "SUPERADMIN_LAST_NAME",
  "SUPERADMIN_EMAIL",
  "SUPERADMIN_PASSWORD",
  "SUPERADMIN_PHONE",
  "SUPERADMIN_GENDER",
  "SUPERADMIN_BIRTH_DATE",
];

export async function seedSuperAdmin() {
  try {
    const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      console.error(`❌ Missing env vars: ${missing.join(", ")}`);
      return;
    }

    const existing = await Admin.findOne({ role: "super" }).lean();
    if (existing) {
      console.log("ℹ️  Super admin already exists");
      return;
    }

    const gender = process.env.SUPERADMIN_GENDER;
    const avatar =
      gender == "male"
        ? process.env.DEFAULT_MALE_AVATAR
        : process.env.DEFAULT_FEMALE_AVATAR;

    const superAdmin = await Admin.create({
      first_name: process.env.SUPERADMIN_FIRST_NAME,
      last_name: process.env.SUPERADMIN_LAST_NAME,
      email: process.env.SUPERADMIN_EMAIL,
      password: await hashPassword(process.env.SUPERADMIN_PASSWORD),
      phone_number: process.env.SUPERADMIN_PHONE,
      gender,
      birth_date: new Date(process.env.SUPERADMIN_BIRTH_DATE),
      avatar,
      role: "super",
      isActive: true,
      permissions: ["read", "create", "update", "delete"],
    });

    console.log(`✅ Superadmin created: ${superAdmin.email}`);
  } catch (error) {
    console.error("❌ Seed failed:", error.message);
  }
}
