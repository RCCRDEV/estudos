const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const header = req.headers.authorization || "";
  const parts = header.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ message: "Não autorizado" });
  }
  try {
    const secret = process.env.JWT_SECRET || "devsecret";
    const payload = jwt.verify(parts[1], secret);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Token inválido" });
  }
};
