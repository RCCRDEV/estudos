const mongoose = require("mongoose");

const VideoSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    title: { type: String, required: true },
    sourceType: { type: String, enum: ["upload", "url"], required: true },
    url: { type: String },
    filePath: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Video", VideoSchema);
