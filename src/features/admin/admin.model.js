import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    last_name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    avatar: {
      type: String,
      required: [true, "Sorry avatar's url is required"],
    },

    birth_date: {
      type: Date,
      required: [true, "Sorry, Birth date is required"],
    },

    gender: {
      type: String,
      required: [true, "Sorry, Gender is required"],
      enum: ["male", "female"],
    },

    phone_number: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^\+?[0-9]{7,15}$/, "Please provide a valid phone number"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false,
    },

    role: {
      type: String,
      enum: ["admin", "super"],
      default: "admin",
    },

    isActive: {
      type: Boolean,
      required: [true, "Sorry, Status is required"],
    },

    permissions: {
      type: [String],
      enum: ["read", "create", "update", "delete"],
      default: ["read"],
    },
  },
  {
    timestamps: true,
  },
);

adminSchema.index({ first_name: "text", last_name: "text" });
adminSchema.index({ role: 1, isActive: 1 });
adminSchema.index({ phone_number: 1 });

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;
