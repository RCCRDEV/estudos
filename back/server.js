const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const app = express();
const usuariosRoutes = require("./routes/usuarios");
const subjectsRoutes = require("./routes/subjects");

app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/estudos";

app.use((req, _res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB conectado"))
  .catch((err) => console.log("Erro ao conectar MongoDB:", err));

app.use("/api", usuariosRoutes);
app.use("/api/subjects", subjectsRoutes);

app.use(express.static(path.join(__dirname, "../front")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../front/login.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../front/login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "../front/register.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../front/dashboard.html"));
});

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});
