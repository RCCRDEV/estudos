const mongoose = require("mongoose");

const ActivitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    title: { type: String, required: true },
    description: { type: String },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    googleLink: { type: String },
    tags: [{ type: String }],
  },
  { timestamps: true, collection: "atividades" }
);

module.exports = mongoose.model("Activity", ActivitySchema);
