const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const app = express();
const usuariosRoutes = require("./routes/usuarios");

app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/estudos";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB conectado"))
  .catch((err) => console.log("Erro ao conectar MongoDB:", err));

app.use("/api", usuariosRoutes);

app.use(express.static(path.join(__dirname, "../front")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../front/login.html"));
});

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});
