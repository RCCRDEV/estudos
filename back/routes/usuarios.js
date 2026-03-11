const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Cadastro
router.post("/register", async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) {
      return res.status(400).json({ message: "Preencha todos os campos." });
    }
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email já cadastrado." });
    }
    const hash = await bcrypt.hash(senha, 10);
    const user = new User({ nome, email, senha: hash });
    await user.save();
    res.status(201).json({ message: "Usuário criado com sucesso!" });
  } catch (e) {
    res.status(500).json({ message: "Erro ao cadastrar usuário." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) {
      return res.status(400).json({ message: "Informe email e senha." });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }
    const ok = await bcrypt.compare(senha, user.senha);
    if (!ok) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }
    const secret = process.env.JWT_SECRET || "devsecret";
    const token = jwt.sign({ id: user._id, nome: user.nome }, secret, {
      expiresIn: "2h",
    });
    res.json({ token, user: { id: user._id, nome: user.nome, email: user.email } });
  } catch (e) {
    res.status(500).json({ message: "Erro ao fazer login." });
  }
});

module.exports = router;
