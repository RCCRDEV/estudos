const mongoose = require("mongoose");

const PlannerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    date: { type: Date, required: true },
    hours: { type: Number, default: 0 },
    tasks: [
      {
        title: String,
        status: { 
          type: String, 
          enum: ["concluido", "nao feito", "em andamento", "procrastinado", "aguardando", "cancelado"], 
          default: "nao feito" 
        }
      }
    ],
  },
  { timestamps: true, collection: "planner" }
);

module.exports = mongoose.model("Planner", PlannerSchema);
