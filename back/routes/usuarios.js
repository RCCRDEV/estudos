const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// Cadastro
router.post("/register", async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ message: "Preencha todos os campos." });
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: "Email já cadastrado." });
  }

  const hash = await bcrypt.hash(senha, 10);

  const user = new User({
    nome,
    email,
    senha: hash,
  });

  await user.save();

  res.status(201).json({ message: "Usuário criado com sucesso!" });
});

module.exports = router;