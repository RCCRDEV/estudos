const mongoose = require("mongoose");

const TestResultSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    correct: { type: Number, required: true },
    total: { type: Number, required: true },
    percentage: { type: Number, required: true },
  },
  { timestamps: true, collection: "testes" }
);

module.exports = mongoose.model("TestResult", TestResultSchema);
