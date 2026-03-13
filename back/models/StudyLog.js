const mongoose = require("mongoose");

const StudyLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    date: { type: Date, required: true },
    hours: { type: Number, required: true, default: 0 },
  },
  { timestamps: true, collection: "study_logs" }
);

module.exports = mongoose.model("StudyLog", StudyLogSchema);
