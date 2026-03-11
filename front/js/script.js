async function login() {
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;
  if (!email || !senha) {
    alert("Informe email e senha.");
    return;
  }
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
  });
  const data = await res.json();
  if (res.ok) {
    localStorage.setItem("token", data.token);
    window.location.href = "dashboard.html";
  } else {
    alert(data.message || "Falha no login.");
  }
}

async function register() {
  const nome = document.getElementById("nome").value;
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;

  if (!nome || !email || !senha) {
    alert("Por favor, preencha todos os campos.");
    return;
  }

  const res = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, email, senha }),
  });

  const data = await res.json();

  if (res.status === 201) {
    alert(data.message);
    window.location.href = "login.html";
  } else {
    alert(data.message);
  }
}
