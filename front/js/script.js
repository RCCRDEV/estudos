async function login() {
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;
  if (!email || !senha) {
    alert("Informe email e senha.");
    return;
  }
  const res = await fetch(apiUrl("/api/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
  });
  const data = await res.json();
  if (res.ok) {
    localStorage.setItem("token", data.token);
    if(data.user) {
      localStorage.setItem("user", JSON.stringify(data.user));
    }
    window.location.href = "dashboard.html";
  } else {
    alert(data.message || "Falha no login.");
  }
}

function authHeaders() {
  const t = localStorage.getItem("token");
  return { Authorization: `Bearer ${t}` };
}

function renderUserInfo() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (document.getElementById("user-name")) {
    document.getElementById("user-name").textContent = user.nome || "Usuário";
  }
  if (document.getElementById("user-avatar")) {
    const initial = (user.nome || "U").charAt(0).toUpperCase();
    document.getElementById("user-avatar").textContent = initial;
  }
}

async function loadSubjects() {
  const grid = document.getElementById("subjects-grid");
  const sidebarSubjects = document.getElementById("sidebar-subjects");
  if (!grid) return;
  
  const res = await fetch(apiUrl("/api/subjects"), { headers: authHeaders() });
  if (!res.ok) {
    if (res.status === 401) {
      window.location.href = "login.html";
      return;
    }
    grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📚</div><div class="empty-state-title">Erro ao carregar</div></div>';
    return;
  }
  
  const items = await res.json();
  grid.innerHTML = "";
  
  if (items.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">📚</div>
        <div class="empty-state-title">Nenhuma matéria ainda</div>
        <div class="empty-state-desc">Clique em "Nova Matéria" para começar</div>
        <button class="btn btn-primary" onclick="showCreateSubjectModal()">+ Criar Primeira Matéria</button>
      </div>
    `;
    if (sidebarSubjects) sidebarSubjects.innerHTML = "";
    document.getElementById("stat-subjects").textContent = "0";
    document.getElementById("stat-flashcards").textContent = "0";
    document.getElementById("stat-hours").textContent = "0h";
    document.getElementById("stat-streak").textContent = "0";
    return;
  }
  
  let totalFlashcards = 0;
  let totalHours = 0;
  
  items.forEach((s) => {
    const icons = ["📐", "📊", "🔬", "🌍", "📖", "🎨", "🎵", "💻", "🧮", "📝"];
    const icon = icons[Math.floor(Math.random() * icons.length)];
    
    const el = document.createElement("div");
    el.className = "subject-card";
    el.innerHTML = `
      <div class="subject-card-icon">${icon}</div>
      <div class="subject-card-title">${s.name}</div>
      <div class="subject-card-desc">${s.description || "Sem descrição"}</div>
      <div class="subject-card-stats">
        <span class="subject-stat">📚 Matéria</span>
      </div>
    `;
    el.onclick = () => {
      window.location.href = `subject.html?id=${s._id}`;
    };
    grid.appendChild(el);
    
    if (sidebarSubjects) {
      const sideEl = document.createElement("a");
      sideEl.className = "sidebar-link";
      sideEl.href = `subject.html?id=${s._id}`;
      sideEl.innerHTML = `<span class="sidebar-link-icon">${icon}</span>${s.name}`;
      sidebarSubjects.appendChild(sideEl);
    }
    
    totalFlashcards += (s.flashcardsCount || 0);
    totalHours += (s.totalHours || 0);
  });
  
  document.getElementById("stat-subjects").textContent = items.length;
  document.getElementById("stat-flashcards").textContent = totalFlashcards;
  document.getElementById("stat-hours").textContent = totalHours + "h";
  document.getElementById("stat-streak").textContent = items.length > 0 ? "1" : "0";
}

function showCreateSubjectModal() {
  const modal = document.getElementById("create-subject-modal");
  if (modal) modal.style.display = "flex";
}

function closeCreateSubjectModal() {
  const modal = document.getElementById("create-subject-modal");
  if (modal) {
    modal.style.display = "none";
    document.getElementById("subject-name").value = "";
    document.getElementById("subject-desc").value = "";
  }
}

async function createSubject() {
  const name = document.getElementById("subject-name").value.trim();
  const description = document.getElementById("subject-desc").value.trim();
  if (!name) {
    alert("Informe o nome da matéria");
    return;
  }
  const res = await fetch(apiUrl("/api/subjects"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ name, description }),
  });
  if (res.status === 401) {
    window.location.href = "login.html";
    return;
  }
  if (res.ok) {
    closeCreateSubjectModal();
    loadSubjects();
  } else {
    const data = await res.json().catch(() => ({}));
    alert(data.message || "Erro ao criar matéria");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const t = localStorage.getItem("token");
  const isAuthPage = window.location.pathname.includes("login") || window.location.pathname.includes("register");
  
  if (!t && !isAuthPage && document.getElementById("subjects-grid")) {
    window.location.href = "login.html";
    return;
  }
  
  if (!isAuthPage) {
    renderUserInfo();
    loadSubjects();
    
    document.querySelectorAll(".sidebar-section-title").forEach(el => {
      el.style.display = "";
    });
  }
});

function dashboardSwitchTab(tabId) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
  const activeTab = document.querySelector(`.tab[data-tab="${tabId}"]`);
  if (activeTab) activeTab.classList.add("active");
  const content = document.getElementById(`tab-${tabId}`);
  if (content) content.classList.add("active");
}

function setTheme(theme) {
  if (theme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  localStorage.setItem("theme", theme);
}

function toggleTheme() {
  const cur = localStorage.getItem("theme") === "light" ? "dark" : "light";
  setTheme(cur);
}

(function() {
  const saved = localStorage.getItem("theme") || "dark";
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

  const res = await fetch(apiUrl("/api/register"), {
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
