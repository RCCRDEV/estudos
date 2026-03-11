const mongoose = require("mongoose");

const FlashcardSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    front: { type: String, required: true },
    back: { type: String, required: true },
    tags: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Flashcard", FlashcardSchema);
