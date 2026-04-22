const express = require("express");
const mongoose = require("mongoose");
const Subject = require("../models/Subject");
const Flashcard = require("../models/Flashcard");
const Note = require("../models/Note");
const Video = require("../models/Video");
const Activity = require("../models/Activity");
const TestResult = require("../models/TestResult");
const Planner = require("../models/Planner");
const auth = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();

router.use(auth);

router.get("/", async (req, res) => {
  try {
    const items = await Subject.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    console.error("Erro listar matérias", e);
    res.status(500).json({ message: "Erro ao listar matérias" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: "Nome é obrigatório" });
    const item = await Subject.create({ userId: req.user.id, name, description });
    res.status(201).json(item);
  } catch (e) {
    console.error("Erro criar matéria", e);
    res.status(500).json({ message: "Erro ao criar matéria" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await Subject.deleteOne({ _id: id, userId: req.user.id });
    await Flashcard.deleteMany({ subjectId: id, userId: req.user.id });
    await Note.deleteMany({ subjectId: id, userId: req.user.id });
    await Video.deleteMany({ subjectId: id, userId: req.user.id });
    await Activity.deleteMany({ subjectId: id, userId: req.user.id });
    await TestResult.deleteMany({ subjectId: id, userId: req.user.id });
    res.json({ ok: true });
  } catch (e) {
    console.error("Erro excluir matéria", e);
    res.status(500).json({ message: "Erro ao excluir matéria" });
  }
});

router.get("/:id/flashcards", async (req, res) => {
  try {
    const items = await Flashcard.find({ userId: req.user.id, subjectId: req.params.id }).sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    console.error("Erro listar flashcards", e);
    res.status(500).json({ message: "Erro ao listar flashcards" });
  }
});

router.post("/:id/flashcards", async (req, res) => {
  try {
    const { front, back, tags } = req.body;
    if (!front || !back) return res.status(400).json({ message: "Frente e verso são obrigatórios" });
    const item = await Flashcard.create({
      userId: req.user.id,
      subjectId: req.params.id,
      front,
      back,
      tags: tags || [],
    });
    res.status(201).json(item);
  } catch (e) {
    console.error("Erro criar flashcard", e);
    res.status(500).json({ message: "Erro ao criar flashcard" });
  }
});

router.delete("/:id/flashcards/:flashId", async (req, res) => {
  try {
    await Flashcard.deleteOne({ _id: req.params.flashId, userId: req.user.id, subjectId: req.params.id });
    res.json({ ok: true });
  } catch (e) {
    console.error("Erro excluir flashcard", e);
    res.status(500).json({ message: "Erro ao excluir flashcard" });
  }
});

router.put("/:id/flashcards/:flashId", async (req, res) => {
  try {
    const { front, back, tags } = req.body;
    if (!front || !back) return res.status(400).json({ message: "Frente e verso são obrigatórios" });
    const item = await Flashcard.findOneAndUpdate(
      { _id: req.params.flashId, userId: req.user.id, subjectId: req.params.id },
      { front, back, tags: tags || [] },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: "Flashcard não encontrado" });
    res.json(item);
  } catch (e) {
    console.error("Erro atualizar flashcard", e);
    res.status(500).json({ message: "Erro ao atualizar flashcard" });
  }
});

router.get("/:id/notes", async (req, res) => {
  try {
    const items = await Note.find({ userId: req.user.id, subjectId: req.params.id }).sort({ pageNumber: 1, createdAt: 1 });
    res.json(items);
  } catch (e) {
    console.error("Erro listar notas", e);
    res.status(500).json({ message: "Erro ao listar notas" });
  }
});

router.post("/:id/notes", async (req, res) => {
  try {
    const { title, content, pageNumber } = req.body;
    if (!title || !content) return res.status(400).json({ message: "Título e conteúdo são obrigatórios" });
    let pn = pageNumber;
    if (typeof pn !== "number") {
      const last = await Note.findOne({ userId: req.user.id, subjectId: req.params.id }).sort({ pageNumber: -1 });
      pn = last && typeof last.pageNumber === "number" ? last.pageNumber + 1 : 1;
    }
    const item = await Note.create({ userId: req.user.id, subjectId: req.params.id, title, content, pageNumber: pn });
    res.status(201).json(item);
  } catch (e) {
    console.error("Erro criar nota", e);
    res.status(500).json({ message: "Erro ao criar anotação" });
  }
});

router.delete("/:id/notes/:noteId", async (req, res) => {
  try {
    await Note.deleteOne({ _id: req.params.noteId, userId: req.user.id, subjectId: req.params.id });
    res.json({ ok: true });
  } catch (e) {
    console.error("Erro excluir anotação", e);
    res.status(500).json({ message: "Erro ao excluir anotação" });
  }
});

router.put("/:id/notes/:noteId", async (req, res) => {
  try {
    const { title, content, pageNumber } = req.body;
    if (!title || !content) return res.status(400).json({ message: "Título e conteúdo são obrigatórios" });
    const item = await Note.findOneAndUpdate(
      { _id: req.params.noteId, userId: req.user.id, subjectId: req.params.id },
      { title, content, ...(typeof pageNumber === "number" ? { pageNumber } : {}) },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: "Anotação não encontrada" });
    res.json(item);
  } catch (e) {
    console.error("Erro atualizar anotação", e);
    res.status(500).json({ message: "Erro ao atualizar anotação" });
  }
});

router.get("/:id/videos", async (req, res) => {
  try {
    const items = await Video.find({ userId: req.user.id, subjectId: req.params.id }).sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    console.error("Erro listar vídeos", e);
    res.status(500).json({ message: "Erro ao listar vídeos" });
  }
});

router.post("/:id/videos/url", async (req, res) => {
  try {
    const { title, url } = req.body;
    if (!title || !url) return res.status(400).json({ message: "Título e URL são obrigatórios" });
    const item = await Video.create({
      userId: req.user.id,
      subjectId: req.params.id,
      title,
      sourceType: "url",
      url,
    });
    res.status(201).json(item);
  } catch (e) {
    console.error("Erro salvar vídeo por URL", e);
    res.status(500).json({ message: "Erro ao salvar vídeo" });
  }
});

router.get("/:id/activities", async (req, res) => {
  try {
    const items = await Activity.find({ userId: req.user.id, subjectId: req.params.id }).sort({ startAt: 1 });
    res.json(items);
  } catch (e) {
    console.error("Erro listar atividades", e);
    res.status(500).json({ message: "Erro ao listar atividades" });
  }
});

function googleCalendarLink({ title, details, startAt, endAt }) {
  const pad = (n) => String(n).padStart(2, "0");
  const fmt = (date) => {
    const d = new Date(date);
    const y = d.getUTCFullYear();
    const m = pad(d.getUTCMonth() + 1);
    const da = pad(d.getUTCDate());
    const h = pad(d.getUTCHours());
    const mi = pad(d.getUTCMinutes());
    const s = pad(d.getUTCSeconds());
    return `${y}${m}${da}T${h}${mi}${s}Z`;
  };
  const dates = `${fmt(startAt)}/${fmt(endAt)}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    details: details || "",
    dates,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

router.post("/:id/activities", async (req, res) => {
  try {
    const { title, description, startAt, endAt, tags, type, done } = req.body;
    if (!title || !startAt || !endAt) return res.status(400).json({ message: "Dados insuficientes" });
    const link = googleCalendarLink({ title, details: description, startAt, endAt });
    const item = await Activity.create({
      userId: req.user.id,
      subjectId: req.params.id,
      title,
      type: type || "atividade",
      description,
      startAt,
      endAt,
      done: Boolean(done),
      googleLink: link,
      tags: Array.isArray(tags) ? tags : [],
    });
    res.status(201).json(item);
  } catch (e) {
    console.error("Erro criar atividade", e);
    res.status(500).json({ message: "Erro ao criar atividade" });
  }
});

router.put("/:id/activities/:activityId", async (req, res) => {
  try {
    const { title, description, startAt, endAt, tags, type, done } = req.body;
    if (!title || !startAt || !endAt) return res.status(400).json({ message: "Dados insuficientes" });
    const link = googleCalendarLink({ title, details: description, startAt, endAt });
    const item = await Activity.findOneAndUpdate(
      { _id: req.params.activityId, userId: req.user.id, subjectId: req.params.id },
      {
        title,
        description,
        startAt,
        endAt,
        googleLink: link,
        ...(Array.isArray(tags) ? { tags } : {}),
        ...(type ? { type } : {}),
        ...(typeof done === "boolean" ? { done } : {}),
      },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: "Atividade não encontrada" });
    res.json(item);
  } catch (e) {
    console.error("Erro atualizar atividade", e);
    res.status(500).json({ message: "Erro ao atualizar atividade" });
  }
});

router.delete("/:id/activities/:activityId", async (req, res) => {
  try {
    await Activity.deleteOne({ _id: req.params.activityId, userId: req.user.id, subjectId: req.params.id });
    res.json({ ok: true });
  } catch (e) {
    console.error("Erro excluir atividade", e);
    res.status(500).json({ message: "Erro ao excluir atividade" });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads/videos");
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({ storage });

router.post("/:id/videos/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Arquivo obrigatório" });
  const title = req.body.title || req.file.originalname;
  const relPath = `/uploads/videos/${req.file.filename}`;
  const item = await Video.create({
    userId: req.user.id,
    subjectId: req.params.id,
    title,
    sourceType: "upload",
    filePath: relPath,
  });
  res.status(201).json(item);
});

router.put("/:id/videos/:videoId", async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ message: "Título é obrigatório" });
    const item = await Video.findOneAndUpdate(
      { _id: req.params.videoId, userId: req.user.id, subjectId: req.params.id },
      { title },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: "Vídeo não encontrado" });
    res.json(item);
  } catch (e) {
    console.error("Erro atualizar vídeo", e);
    res.status(500).json({ message: "Erro ao atualizar vídeo" });
  }
});

router.delete("/:id/videos/:videoId", async (req, res) => {
  try {
    await Video.deleteOne({ _id: req.params.videoId, userId: req.user.id, subjectId: req.params.id });
    res.json({ ok: true });
  } catch (e) {
    console.error("Erro excluir vídeo", e);
    res.status(500).json({ message: "Erro ao excluir vídeo" });
  }
});

router.get("/:id/tests", async (req, res) => {
  try {
    const items = await TestResult.find({ userId: req.user.id, subjectId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(50);
    const agg = await TestResult.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.user.id), subjectId: new mongoose.Types.ObjectId(req.params.id) } },
      { $group: { _id: null, avg: { $avg: "$percentage" }, count: { $sum: 1 } } },
    ]);
    const avg = agg.length ? Math.round(agg[0].avg) : 0;
    const count = agg.length ? agg[0].count : 0;
    res.json({ items, avg, count });
  } catch (e) {
    console.error("Erro listar testes", e);
    res.status(500).json({ message: "Erro ao listar testes" });
  }
});

router.post("/:id/tests", async (req, res) => {
  try {
    const { correct, total, title, takenAt } = req.body;
    if (typeof correct !== "number" || typeof total !== "number" || total <= 0) {
      return res.status(400).json({ message: "Dados inválidos" });
    }
    const percentage = Math.round((correct / total) * 100);
    const item = await TestResult.create({
      userId: req.user.id,
      subjectId: req.params.id,
      title: typeof title === "string" ? title : "",
      correct,
      total,
      percentage,
      ...(takenAt ? { takenAt } : {}),
    });
    res.status(201).json(item);
  } catch (e) {
    console.error("Erro salvar teste", e);
    res.status(500).json({ message: "Erro ao salvar teste" });
  }
});

router.put("/:id/tests/:testId", async (req, res) => {
  try {
    const { correct, total, title, takenAt } = req.body;
    const existing = await TestResult.findOne({ _id: req.params.testId, userId: req.user.id, subjectId: req.params.id });
    if (!existing) return res.status(404).json({ message: "Teste não encontrado" });

    const nextCorrect = typeof correct === "number" ? correct : existing.correct;
    const nextTotal = typeof total === "number" ? total : existing.total;
    if (typeof nextCorrect !== "number" || typeof nextTotal !== "number" || nextTotal <= 0) {
      return res.status(400).json({ message: "Dados inválidos" });
    }
    if (nextCorrect < 0 || nextCorrect > nextTotal) {
      return res.status(400).json({ message: "Dados inválidos" });
    }

    const update = {
      correct: nextCorrect,
      total: nextTotal,
      percentage: Math.round((nextCorrect / nextTotal) * 100),
      ...(typeof title === "string" ? { title } : {}),
      ...(takenAt ? { takenAt } : {}),
    };

    const item = await TestResult.findOneAndUpdate(
      { _id: req.params.testId, userId: req.user.id, subjectId: req.params.id },
      update,
      { new: true }
    );
    if (!item) return res.status(404).json({ message: "Teste não encontrado" });
    res.json(item);
  } catch (e) {
    console.error("Erro atualizar teste", e);
    res.status(500).json({ message: "Erro ao atualizar teste" });
  }
});

router.delete("/:id/tests/:testId", async (req, res) => {
  try {
    await TestResult.deleteOne({ _id: req.params.testId, userId: req.user.id, subjectId: req.params.id });
    res.json({ ok: true });
  } catch (e) {
    console.error("Erro excluir teste", e);
    res.status(500).json({ message: "Erro ao excluir teste" });
  }
});

// --- Planner (Horas e Checklist unificado) ---

router.get("/:id/study-stats", async (req, res) => {
  try {
    const agg = await Planner.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.user.id), subjectId: new mongoose.Types.ObjectId(req.params.id) } },
      { $group: { _id: null, avg: { $avg: "$hours" }, total: { $sum: "$hours" }, count: { $sum: 1 } } }
    ]);
    const stats = agg.length ? { avg: agg[0].avg, total: agg[0].total, count: agg[0].count } : { avg: 0, total: 0, count: 0 };
    res.json(stats);
  } catch (e) {
    console.error("Erro stats estudo", e);
    res.status(500).json({ message: "Erro ao buscar estatísticas" });
  }
});

router.get("/:id/planner", async (req, res) => {
  try {
    const { start, end } = req.query;
    const query = { userId: req.user.id, subjectId: req.params.id };
    if (start && end) {
      query.date = { $gte: new Date(start), $lte: new Date(end) };
    }
    const items = await Planner.find(query).sort({ date: 1 });
    res.json(items);
  } catch (e) {
    console.error("Erro ao carregar planner", e);
    res.status(500).json({ message: "Erro ao carregar planner" });
  }
});

function parsePlannerDate(input) {
  if (!input) return null;
  if (typeof input === "string") {
    const m = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
      d.setHours(0, 0, 0, 0);
      return d;
    }
  }
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

router.post("/:id/planner/hours", async (req, res) => {
  try {
    const { date, hours } = req.body;
    const subjectId = req.params.id;
    const userId = req.user.id;

    if (!date || hours === undefined) return res.status(400).json({ message: "Dados incompletos" });

    const d = parsePlannerDate(date);
    if (!d) return res.status(400).json({ message: "Data inválida" });

    const result = await Planner.findOneAndUpdate(
      { userId, subjectId, date: d },
      { hours: Number(hours) },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json(result);
  } catch (e) {
    console.error("Erro ao salvar horas", e);
    res.status(500).json({ message: "Erro ao salvar horas" });
  }
});

router.post("/:id/planner/tasks", async (req, res) => {
  try {
    const { date, title } = req.body;
    const subjectId = req.params.id;
    const userId = req.user.id;

    if (!date || !title) return res.status(400).json({ message: "Dados incompletos" });

    const d = parsePlannerDate(date);
    if (!d) return res.status(400).json({ message: "Data inválida" });

    const result = await Planner.findOneAndUpdate(
      { userId, subjectId, date: d },
      { $push: { tasks: { title, status: "nao feito" } } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json(result);
  } catch (e) {
    console.error("Erro ao adicionar tarefa", e);
    res.status(500).json({ message: "Erro ao adicionar tarefa" });
  }
});

router.put("/:id/planner/tasks/:taskId", async (req, res) => {
  try {
    const { status } = req.body;
    const { taskId } = req.params;
    const userId = req.user.id;
    const subjectId = req.params.id;

    if (!status) return res.status(400).json({ message: "Status é obrigatório" });
    const allowed = new Set(["concluido", "nao feito", "em andamento", "procrastinado", "aguardando", "cancelado"]);
    if (!allowed.has(String(status))) return res.status(400).json({ message: "Status inválido" });

    const doc = await Planner.findOne({ userId, subjectId, "tasks._id": taskId });
    if (!doc) return res.status(404).json({ message: "Tarefa não encontrada" });

    const task = doc.tasks.id(taskId);
    if (!task) return res.status(404).json({ message: "Tarefa não encontrada" });
    task.status = String(status);
    await doc.save();
    res.json(doc);
  } catch (e) {
    console.error("Erro ao atualizar status", e);
    res.status(500).json({ message: "Erro ao atualizar status" });
  }
});

router.delete("/:id/planner/tasks/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    const subjectId = req.params.id;

    const doc = await Planner.findOne({ userId, subjectId, "tasks._id": taskId });
    if (!doc) return res.status(404).json({ message: "Tarefa não encontrada" });

    const task = doc.tasks.id(taskId);
    if (!task) return res.status(404).json({ message: "Tarefa não encontrada" });
    task.deleteOne();
    await doc.save();
    res.json(doc);
  } catch (e) {
    console.error("Erro ao excluir tarefa", e);
    res.status(500).json({ message: "Erro ao excluir tarefa" });
  }
});

function getWeekStartLocal(date) {
  const d = new Date(date);
  const day = d.getDay();
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  start.setDate(start.getDate() - day);
  start.setHours(0, 0, 0, 0);
  return start;
}

router.get("/:id/planner/stats", async (req, res) => {
  try {
    const { period, date } = req.query;
    const subjectId = new mongoose.Types.ObjectId(req.params.id);
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const base = date ? new Date(date) : new Date();
    if (Number.isNaN(base.getTime())) return res.status(400).json({ message: "Data inválida" });

    let start;
    let end;
    const p = String(period || "week");
    if (p === "month") {
      start = new Date(base.getFullYear(), base.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      end = new Date(base.getFullYear(), base.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
    } else if (p === "year") {
      start = new Date(base.getFullYear(), 0, 1);
      start.setHours(0, 0, 0, 0);
      end = new Date(base.getFullYear(), 11, 31);
      end.setHours(23, 59, 59, 999);
    } else {
      start = getWeekStartLocal(base);
      end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    }

    const agg = await Planner.aggregate([
      { $match: { userId, subjectId, date: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: null,
          total: { $sum: "$hours" },
          daysWithHours: { $sum: { $cond: [{ $gt: ["$hours", 0] }, 1, 0] } },
        },
      },
    ]);
    const total = agg.length ? agg[0].total : 0;
    const daysWithHours = agg.length ? agg[0].daysWithHours : 0;
    const avg = daysWithHours > 0 ? total / daysWithHours : 0;

    res.json({ period: p, start, end, total: Number(total || 0), daysWithHours, avg: Number(avg || 0) });
  } catch (e) {
    console.error("Erro stats planner", e);
    res.status(500).json({ message: "Erro ao buscar estatísticas" });
  }
});

router.use((req, res) => {
  console.log("ROTA NÃO ENCONTRADA EM SUBJECTS:", req.method, req.url);
  res.status(404).json({ message: "Rota não encontrada em subjects" });
});

module.exports = router;
