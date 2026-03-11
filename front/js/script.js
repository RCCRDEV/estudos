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

function authHeaders() {
  const t = localStorage.getItem("token");
  return { Authorization: `Bearer ${t}` };
}

async function loadSubjects() {
  const list = document.getElementById("subjects");
  if (!list) return;
  const res = await fetch("/api/subjects", { headers: authHeaders() });
  if (!res.ok) {
    if (res.status === 401) {
      window.location.href = "login.html";
      return;
    }
    list.innerHTML = "<p>Não foi possível carregar suas matérias.</p>";
    return;
  }
  const items = await res.json();
  list.innerHTML = "";
  items.forEach((s) => {
    const el = document.createElement("div");
    el.className = "card";
    el.innerHTML = `
      <h3>${s.name}</h3>
      <p>${s.description || ""}</p>
      <button data-id="${s._id}">Abrir</button>
    `;
    el.querySelector("button").onclick = () => {
      window.location.href = `subject.html?id=${s._id}`;
    };
    list.appendChild(el);
  });
}

async function createSubject() {
  const name = document.getElementById("subject-name").value.trim();
  const description = document.getElementById("subject-desc").value.trim();
  if (!name) {
    alert("Informe o nome da matéria");
    return;
  }
  const res = await fetch("/api/subjects", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ name, description }),
  });
  if (res.status === 401) {
    window.location.href = "login.html";
    return;
  }
  if (res.ok) {
    document.getElementById("subject-name").value = "";
    document.getElementById("subject-desc").value = "";
    loadSubjects();
  } else {
    const data = await res.json().catch(() => ({}));
    alert(data.message || "Erro ao criar matéria");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const t = localStorage.getItem("token");
  if (!t && document.getElementById("subjects")) {
    window.location.href = "login.html";
    return;
  }
  loadSubjects();
});
function setTheme(theme){
  if(theme==="light"){document.documentElement.setAttribute("data-theme","light");}
  else{document.documentElement.removeAttribute("data-theme");}
  localStorage.setItem("theme",theme);
}
function toggleTheme(){
  const cur=localStorage.getItem("theme")==="light"?"dark":"light";
  setTheme(cur);
}
(() => {
  const saved=localStorage.getItem("theme")||"dark";
  setTheme(saved);
})();
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
