const mongoose = require("mongoose");

const WeeklyTaskSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    title: { type: String, required: true },
    status: { 
      type: String, 
      enum: ["concluido", "nao feito", "em andamento", "procrastinado"], 
      default: "nao feito" 
    },
    date: { type: Date, required: true }, // Data específica da tarefa na agenda
  },
  { timestamps: true, collection: "weekly_tasks" }
);

module.exports = mongoose.model("WeeklyTask", WeeklyTaskSchema);
