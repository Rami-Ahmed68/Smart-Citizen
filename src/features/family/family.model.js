import mongoose from "mongoose";

const familySchema = new mongoose.Schema(
  {
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

    children_ids: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Citizen",
      default: [],
    },

    added_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: [true, "The employee who created the family is required"],
    },
  },
  {
    timestamps: true,
  },
);

familySchema.index({ father: 1 });
familySchema.index({ mother: 1 });
familySchema.index({ children_ids: 1 });

const Family = mongoose.model("Family", familySchema);

export default Family;
