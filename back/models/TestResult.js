const mongoose = require("mongoose");

const TestResultSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    title: { type: String, default: "" },
    correct: { type: Number, required: true },
    total: { type: Number, required: true },
    percentage: { type: Number, required: true },
    takenAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: "testes" }
);

module.exports = mongoose.model("TestResult", TestResultSchema);
