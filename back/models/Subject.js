const mongoose = require("mongoose");

const SubjectSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    description: { type: String },
  },
  { timestamps: true, collection: "materias" }
);

module.exports = mongoose.model("Subject", SubjectSchema);
