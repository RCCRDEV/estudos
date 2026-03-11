const mongoose = require("mongoose");

const NoteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    pageNumber: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "anotacoes" }
);

module.exports = mongoose.model("Note", NoteSchema);
