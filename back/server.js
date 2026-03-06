const express = require("express");
const app = express();
const usuariosRoutes = require("./routes/usuarios");

app.use("/api", usuariosRoutes);

app.get("/", (req, res) => {
  res.send("Servidor rodando!");
});

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});

const mongoURI = "mongodb://localhost:27017/estudos";

const mongoose = require("mongoose");

const mongoURI = "177.159.72.180/32";

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB conectado"))
  .catch(err => console.log("Erro ao conectar MongoDB:", err));