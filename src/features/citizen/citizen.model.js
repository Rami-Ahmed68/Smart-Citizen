import mongoose from "mongoose";
import { COUNTRIES } from "../../utils/countries/countries.js";

const citizenSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    last_name: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    photo: {
      type: String,
      required: [true, "You must add a photo of the citizen's face"],
    },

    birth_date: {
      type: Date,
      required: [true, "Birth date is required"],
    },

    gender: {
      type: String,
      required: [true, "Gender is required"],
      enum: ["male", "female"],
    },

    father: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Citizen",
      default: null,
    },

    mother: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Citizen",
      default: null,
    },

    spouse_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Citizen",
      default: null,
    },

    children_ids: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Citizen",
      default: [],
    },

    phone_number: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [
        /^09[0-9]{8}$/,
        "Phone number must be exactly 10 digits starting with 09",
      ],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
      maxlength: [254, "Email is too long"],
    },

    religion: {
      type: String,
      required: [true, "Religion is required"],
      enum: ["Muslim", "Christian"],
    },

    original_nationality: {
      type: String,
      required: [true, "Original nationality is required"],
      default: "Syria",
      trim: true,
      enum: {
        values: COUNTRIES,
        message: "{VALUE} is not a valid country name",
      },
    },

    location: {
      type: String,
      required: [true, "Location is required"],
      enum: [
        "Damascus",
        "Rif Dimashq",
        "Aleppo",
        "Homs",
        "Hama",
        "Latakia",
        "Tartus",
        "Idlib",
        "Deir ez-Zor",
        "Raqqa",
        "Al-Hasakah",
        "Daraa",
        "As-Suwayda",
        "Quneitra",
      ],
    },

    marital_status: {
      type: String,
      required: [true, "Marital status is required"],
      enum: ["Single", "Married", "Divorced", "Widowed"],
      default: "Single",
    },

    added_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: [true, "The employee who added the citizen is required"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

citizenSchema.virtual("citizenship_type").get(function () {
  return this.original_nationality === "Syria" ? "by_birth" : "naturalized";
});

citizenSchema.set("toJSON", { virtuals: true });
citizenSchema.set("toObject", { virtuals: true });

citizenSchema.index({ father: 1 });
citizenSchema.index({ mother: 1 });
citizenSchema.index({ spouse_id: 1 });
citizenSchema.index({ added_by: 1 });
citizenSchema.index({ birth_date: 1 });
citizenSchema.index({ location: 1, gender: 1 });
citizenSchema.index({ marital_status: 1, gender: 1 });

const Citizen = mongoose.model("Citizen", citizenSchema);

export default Citizen;
