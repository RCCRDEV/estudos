let subjectId = null;
let currentUser = null;

let flashcards = [];
let fcQueue = [];
let fcIndex = 0;
let fcScore = 0;

let videos = [];

let notesState = { items: [], i: -1, editing: false, creating: false };

let calState = { year: new Date().getFullYear(), month: new Date().getMonth(), activities: [] };

let weeklyState = { weekStart: getWeekStart(new Date()), plannerData: [] };

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function authHeaders() {
  const t = localStorage.getItem("token");
  return { Authorization: `Bearer ${t}` };
}

function apiUrl(path) {
  const base = document.querySelector("meta[name='api-base']")?.content || "";
  return base + path;
}

function fmtDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toLocal(dt) {
  const d = new Date(dt);
  const z = d.getTime() - d.getTimezoneOffset() * 60000;
  return new Date(z);
}

function toLocalStr(dt) {
  const z = toLocal(dt);
  return z.toISOString().slice(0, 16);
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  subjectId = params.get("id");
  if (!subjectId) {
    window.location.href = "dashboard.html";
    return;
  }
  const t = localStorage.getItem("token");
  if (!t) {
    window.location.href = "login.html";
    return;
  }
  const userStr = localStorage.getItem("user");
  if (userStr) {
    currentUser = JSON.parse(userStr);
    document.getElementById("user-name").textContent = currentUser.nome || "Usuário";
    document.getElementById("user-avatar").textContent = (currentUser.nome || "U").charAt(0).toUpperCase();
  }
  await Promise.all([loadSubject(), loadFlashcards(), loadVideos(), loadNotes(), loadActivities(), loadWeeklyData()]);
  initTabs();
}

async function loadSubject() {
  const res = await fetch(apiUrl(`/api/subjects/${subjectId}`), { headers: authHeaders() });
  if (!res.ok) {
    if (res.status === 401) window.location.href = "login.html";
    return;
  }
  const s = await res.json();
  document.getElementById("subject-title").textContent = s.name;
  document.title = `${s.name} - StudyFlow`;
  if (document.getElementById("subject-nav-title")) {
    document.getElementById("subject-nav-title").textContent = s.name;
  }
}

async function loadFlashcards() {
  const res = await fetch(apiUrl(`/api/subjects/${subjectId}/flashcards`), { headers: authHeaders() });
  if (!res.ok) return;
  flashcards = await res.json();
  document.getElementById("fc-total").textContent = `${flashcards.length} flashcards`;
  renderFlashcardInit();
  updateFlashcardStats();
}

function renderFlashcardInit() {
  const emptyState = document.getElementById("fc-empty-state");
  const controls = document.getElementById("flashcard-controls");
  const session = document.getElementById("flashcard-session");
  if (!emptyState) return;
  if (flashcards.length === 0) {
    emptyState.style.display = "flex";
    if (controls) controls.style.display = "none";
    if (session) session.style.display = "none";
    return;
  }
  emptyState.style.display = "none";
  if (controls) controls.style.display = "block";
  if (session) session.style.display = "none";
}

function updateFlashcardStats() {
  const total = document.getElementById("tests-total");
  const avg = document.getElementById("tests-avg");
  if (total) total.textContent = flashcards.length;
  if (avg) avg.textContent = "0%";
}

function startSession() {
  if (flashcards.length === 0) return;
  fcQueue = [...flashcards].sort(() => Math.random() - 0.5);
  fcIndex = 0;
  fcScore = 0;
  document.getElementById("flashcard-controls").style.display = "none";
  document.getElementById("flashcard-session").style.display = "block";
  document.getElementById("fc-empty-state").style.display = "none";
  document.getElementById("fc-summary").style.display = "none";
  showCurrentCard();
}

function showCurrentCard() {
  if (fcIndex >= fcQueue.length) {
    showResults();
    return;
  }
  const card = fcQueue[fcIndex];
  document.getElementById("fc-counter").textContent = `${fcIndex + 1} / ${fcQueue.length}`;
  document.getElementById("score-badge").textContent = `⭐ ${fcScore}`;
  document.getElementById("fc-front-text").textContent = card.front;
  document.getElementById("fc-back-text").textContent = card.back;
  document.getElementById("fc-front-card").style.display = "flex";
  document.getElementById("fc-back-card").style.display = "none";
  document.getElementById("btn-reveal").style.display = "inline-flex";
  document.getElementById("btn-reveal").disabled = false;
  document.getElementById("btn-correct").style.display = "none";
  document.getElementById("btn-correct").disabled = true;
  document.getElementById("btn-wrong").style.display = "none";
  document.getElementById("btn-wrong").disabled = true;
}

function revealCard() {
  document.getElementById("fc-back-card").style.display = "flex";
  document.getElementById("btn-reveal").style.display = "none";
  document.getElementById("btn-correct").style.display = "inline-flex";
  document.getElementById("btn-correct").disabled = false;
  document.getElementById("btn-wrong").style.display = "inline-flex";
  document.getElementById("btn-wrong").disabled = false;
}

function markCorrect() {
  fcScore++;
  fcIndex++;
  showCurrentCard();
}

function markWrong() {
  fcIndex++;
  showCurrentCard();
}

function showResults() {
  const total = fcQueue.length;
  const pct = total > 0 ? Math.round((fcScore / total) * 100) : 0;
  const summary = document.getElementById("fc-summary");
  summary.style.display = "block";
  summary.innerHTML = `
    <div style="font-size: 48px; font-weight: 800; color: var(--accent-primary); margin-bottom: 8px;">${pct}%</div>
    <div>${fcScore} de ${total} corretas</div>
  `;
  document.getElementById("btn-correct").style.display = "none";
  document.getElementById("btn-wrong").style.display = "none";
  document.getElementById("fc-counter").textContent = "Teste Concluído!";
  document.getElementById("result-score").textContent = pct + "%";
  document.getElementById("result-text").textContent = `${fcScore} de ${total} respostas corretas`;
  document.getElementById("result-icon").textContent = pct >= 70 ? "🎉" : pct >= 50 ? "👍" : "💪";
  document.getElementById("result-modal").style.display = "flex";
}

function closeResultModal() {
  document.getElementById("result-modal").style.display = "none";
  document.getElementById("flashcard-session").style.display = "none";
  document.getElementById("flashcard-controls").style.display = "block";
  document.getElementById("fc-empty-state").style.display = "none";
}

async function addFlashcard() {
  const front = document.getElementById("fc-front").value.trim();
  const back = document.getElementById("fc-back").value.trim();
  if (!front || !back) {
    alert("Preencha pergunta e resposta");
    return;
  }
  const res = await fetch(apiUrl(`/api/subjects/${subjectId}/flashcards`), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ front, back }),
  });
  if (res.status === 401) {
    window.location.href = "login.html";
    return;
  }
  if (res.ok) {
    document.getElementById("fc-front").value = "";
    document.getElementById("fc-back").value = "";
    await loadFlashcards();
  }
}

function openFlashcardsModal() {
  document.getElementById("flashcards-modal").style.display = "flex";
  renderFlashcardsManageList();
}

function closeFlashcardsModal() {
  document.getElementById("flashcards-modal").style.display = "none";
}

function renderFlashcardsManageList() {
  const list = document.getElementById("flashcards-manage-list");
  if (!list) return;
  list.innerHTML = "";
  if (flashcards.length === 0) {
    list.innerHTML = '<div class="reminders-empty"><div class="reminders-empty-icon">🃏</div><div class="reminders-empty-text">Nenhum flashcard cadastrado</div></div>';
    return;
  }
  flashcards.forEach((fc, i) => {
    const item = document.createElement("div");
    item.className = "flashcard-manage-item";
    item.innerHTML = `
      <div class="flashcard-manage-num">${i + 1}</div>
      <div class="flashcard-manage-content">
        <div class="flashcard-manage-front">${fc.front}</div>
        <div class="flashcard-manage-back">${fc.back}</div>
      </div>
      <div class="flashcard-manage-actions">
        <button class="btn btn-secondary btn-sm" onclick="editFlashcard('${fc._id}')">✎</button>
        <button class="btn btn-danger btn-sm" onclick="deleteFlashcard('${fc._id}')">✕</button>
      </div>
    `;
    list.appendChild(item);
  });
}

function editFlashcard(id) {
  const fc = flashcards.find(f => f._id === id);
  if (!fc) return;
  const list = document.getElementById("flashcards-manage-list");
  list.innerHTML = `
    <div class="flashcard-manage-item">
      <div class="flashcard-manage-num">Editando</div>
      <div class="flashcard-edit-form">
        <input type="text" id="edit-fc-front" value="${fc.front}" placeholder="Pergunta">
        <input type="text" id="edit-fc-back" value="${fc.back}" placeholder="Resposta">
      </div>
      <div class="flashcard-manage-actions">
        <button class="btn btn-success btn-sm" onclick="saveFlashcard('${id}')">✓</button>
        <button class="btn btn-secondary btn-sm" onclick="renderFlashcardsManageList()">✕</button>
      </div>
    </div>
  `;
}

async function saveFlashcard(id) {
  const front = document.getElementById("edit-fc-front").value.trim();
  const back = document.getElementById("edit-fc-back").value.trim();
  if (!front || !back) return;
  const res = await fetch(apiUrl(`/api/subjects/${subjectId}/flashcards/${id}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ front, back }),
  });
  if (res.ok) {
    await loadFlashcards();
    renderFlashcardsManageList();
  }
}

async function deleteFlashcard(id) {
  if (!confirm("Excluir este flashcard?")) return;
  const res = await fetch(apiUrl(`/api/subjects/${subjectId}/flashcards/${id}`), {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (res.ok) {
    await loadFlashcards();
    renderFlashcardsManageList();
  }
}

async function loadVideos() {
  const res = await fetch(apiUrl(`/api/subjects/${subjectId}/videos`), { headers: authHeaders() });
  if (!res.ok) return;
  videos = await res.json();
  renderVideos();
}

function renderVideos() {
  const container = document.getElementById("videos");
  if (!container) return;
  container.innerHTML = "";
  if (videos.length === 0) {
    container.innerHTML = '<div class="reminders-empty"><div class="reminders-empty-icon">🎬</div><div class="reminders-empty-text">Nenhum vídeo adicionado</div></div>';
    return;
  }
  videos.forEach((v) => {
    const card = document.createElement("div");
    card.className = "video-card";
    card.innerHTML = `
      <div class="video-thumbnail" onclick="window.open('${v.url}', '_blank')">
        ▶️
      </div>
      <div class="video-info">
        <div class="video-title">${v.title}</div>
        <div class="video-meta">${new Date(v.createdAt).toLocaleDateString("pt-BR")}</div>
        <button class="btn btn-danger btn-sm" style="margin-top: 8px;" onclick="deleteVideo('${v._id}')">✕ Excluir</button>
      </div>
    `;
    container.appendChild(card);
  });
}

async function addVideoUrl() {
  const title = document.getElementById("v-title").value.trim();
  const url = document.getElementById("v-url").value.trim();
  if (!title || !url) return;
  const res = await fetch(apiUrl(`/api/subjects/${subjectId}/videos/url`), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ title, url }),
  });
  if (res.ok) {
    document.getElementById("v-title").value = "";
    document.getElementById("v-url").value = "";
    await loadVideos();
  }
}

async function deleteVideo(id) {
  if (!confirm("Excluir vídeo?")) return;
  const res = await fetch(apiUrl(`/api/subjects/${subjectId}/videos/${id}`), {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (res.ok) await loadVideos();
}

async function loadNotes() {
  const res = await fetch(apiUrl(`/api/subjects/${subjectId}/notes`), { headers: authHeaders() });
  if (!res.ok) return;
  notesState.items = await res.json();
  notesState.i = notesState.items.length > 0 ? 0 : -1;
  notesState.editing = false;
  notesState.creating = false;
  renderNotePage();
}

function renderNotePage() {
  const title = document.getElementById("n-title");
  const content = document.getElementById("n-content");
  const page = document.getElementById("note-page");
  const btnSave = document.getElementById("btn-save-page");
  if (!title || !content) return;
  const total = notesState.items.length;
  if (page) page.textContent = total === 0 ? "Nenhuma página" : `Página ${notesState.i + 1} de ${total}`;
  if (total === 0 && !notesState.creating) {
    title.value = "";
    content.value = "";
    title.disabled = true;
    content.disabled = true;
    if (btnSave) btnSave.disabled = true;
    renderPagesList();
    return;
  }
  const cur = notesState.items[notesState.i];
  if (!notesState.creating) {
    title.value = cur?.title || "";
    title.disabled = !notesState.editing;
    content.value = cur?.content || "";
    content.disabled = !notesState.editing;
  } else {
    title.disabled = false;
    content.disabled = false;
  }
  if (btnSave) btnSave.disabled = !notesState.editing && !notesState.creating;
  renderPagesList();
}

function renderPagesList() {
  const container = document.getElementById("pages-list");
  if (!container) return;
  container.innerHTML = "";
  notesState.items.forEach((item, idx) => {
    const btn = document.createElement("button");
    btn.className = "nb-tab" + (idx === notesState.i ? " active" : "");
    btn.textContent = item.title ? item.title.substring(0, 15) + (item.title.length > 15 ? "..." : "") : `Página ${idx + 1}`;
    btn.onclick = () => {
      notesState.i = idx;
      notesState.editing = false;
      notesState.creating = false;
      renderNotePage();
    };
    container.appendChild(btn);
  });
}

function newPage() {
  notesState.creating = true;
  notesState.i = notesState.items.length;
  document.getElementById("n-title").value = "";
  document.getElementById("n-content").value = "";
  document.getElementById("n-title").disabled = false;
  document.getElementById("n-content").disabled = false;
  document.getElementById("btn-save-page").disabled = false;
  document.getElementById("note-page").textContent = "Nova página";
  renderPagesList();
}

function editPage() {
  if (notesState.items.length === 0) return;
  notesState.editing = true;
  notesState.creating = false;
  document.getElementById("n-title").disabled = false;
  document.getElementById("n-content").disabled = false;
  document.getElementById("btn-save-page").disabled = false;
}

async function savePage() {
  const title = document.getElementById("n-title").value.trim();
  const content = document.getElementById("n-content").value.trim();
  if (!title && !content) return;
  if (notesState.creating) {
    const res = await fetch(apiUrl(`/api/subjects/${subjectId}/notes`), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ title, content }),
    });
    if (res.ok) {
      notesState.creating = false;
      await loadNotes();
    }
  } else if (notesState.editing) {
    const cur = notesState.items[notesState.i];
    const res = await fetch(apiUrl(`/api/subjects/${subjectId}/notes/${cur._id}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ title, content }),
    });
    if (res.ok) {
      notesState.editing = false;
      await loadNotes();
    }
  }
}

async function deletePage() {
  if (notesState.items.length === 0) return;
  const cur = notesState.items[notesState.i];
  if (!confirm("Excluir esta página?")) return;
  const res = await fetch(apiUrl(`/api/subjects/${subjectId}/notes/${cur._id}`), {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (res.ok) await loadNotes();
}

function prevPage() {
  if (notesState.i > 0) {
    notesState.i--;
    notesState.editing = false;
    notesState.creating = false;
    renderNotePage();
  }
}

function nextPage() {
  if (notesState.i < notesState.items.length - 1) {
    notesState.i++;
    notesState.editing = false;
    notesState.creating = false;
    renderNotePage();
  }
}

async function loadActivities() {
  const res = await fetch(apiUrl(`/api/subjects/${subjectId}/activities`), { headers: authHeaders() });
  if (!res.ok) return;
  calState.activities = await res.json();
  renderCalendar();
  renderReminders();
}

function renderCalendar() {
  const title = document.getElementById("cal-title");
  const grid = document.getElementById("cal-grid");
  if (!grid || !title) return;
  const first = new Date(calState.year, calState.month, 1);
  const startDay = first.getDay();
  const days = new Date(calState.year, calState.month + 1, 0).getDate();
  title.textContent = `${first.toLocaleDateString("pt-BR", { month: "long" })} ${calState.year}`;
  grid.innerHTML = "";
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === calState.year && today.getMonth() === calState.month;
  for (let i = 0; i < startDay; i++) {
    const empty = document.createElement("div");
    empty.className = "cal-cell other-month";
    grid.appendChild(empty);
  }
  const byDay = {};
  calState.activities.forEach(a => {
    const d = new Date(a.startAt);
    const key = fmtDateKey(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
    (byDay[key] = byDay[key] || []).push(a);
  });
  for (let day = 1; day <= days; day++) {
    const cell = document.createElement("div");
    cell.className = "cal-cell";
    if (isCurrentMonth && day === today.getDate()) cell.classList.add("today");
    const dayLbl = document.createElement("div");
    dayLbl.className = "cal-day";
    dayLbl.textContent = String(day);
    cell.appendChild(dayLbl);
    const key = fmtDateKey(new Date(calState.year, calState.month, day));
    (byDay[key] || []).slice(0, 3).forEach(a => {
      const chip = document.createElement("div");
      chip.className = "cal-chip";
      const icons = { prova: "📝", lembrete: "🔔", atividade: "📋", outro: "📌" };
      chip.textContent = `${icons[a.type] || "📋"} ${a.title}`;
      chip.onclick = () => openActivityEditor(a);
      cell.appendChild(chip);
    });
    const addBtn = document.createElement("button");
    addBtn.className = "add-activity-btn";
    addBtn.textContent = "+";
    addBtn.onclick = (e) => {
      e.stopPropagation();
      openNewActivity(calState.year, calState.month, day);
    };
    cell.appendChild(addBtn);
    cell.onclick = (e) => {
      if (e.target === cell || e.target === dayLbl) openNewActivity(calState.year, calState.month, day);
    };
    grid.appendChild(cell);
  }
}

function renderReminders() {
  const rem = document.getElementById("reminders");
  if (!rem) return;
  rem.innerHTML = "";
  const up = [...calState.activities].sort((a, b) => new Date(a.startAt) - new Date(b.startAt)).slice(0, 12);
  if (up.length === 0) {
    rem.innerHTML = '<div class="reminders-empty"><div class="reminders-empty-icon">📅</div><div class="reminders-empty-text">Nenhuma atividade agendada</div></div>';
    return;
  }
  const typeColors = { prova: "#f59e0b", lembrete: "#ef4444", atividade: "#22c55e", outro: "#8b5cf6" };
  const typeIcons = { prova: "📝", lembrete: "🔔", atividade: "📋", outro: "📌" };
  up.forEach(a => {
    const color = typeColors[a.type] || "#6366f1";
    const icon = typeIcons[a.type] || "📋";
    const el = document.createElement("div");
    el.className = "reminder-card";
    el.style.setProperty("--type-color", color);
    const startDate = new Date(a.startAt);
    const endDate = new Date(a.endAt);
    const dateStr = startDate.toLocaleDateString("pt-BR");
    const startTime = startDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const endTime = endDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    el.innerHTML = `
      <div class="reminder-actions">
        <button class="action-btn edit" data-ed="${a._id}" title="Editar">✎</button>
        <button class="action-btn delete" data-del="${a._id}" title="Excluir">✕</button>
      </div>
      <div class="reminder-type-badge" style="background:${color}20;color:${color}">${icon} ${a.type || "atividade"}</div>
      <div class="reminder-title">${a.title}</div>
      <div class="reminder-time">📅 ${dateStr} ⏰ ${startTime} - ${endTime}</div>
      ${a.tags && a.tags.length ? `<div class="reminder-tags">${a.tags.map(t => `<span class="tag">${t}</span>`).join("")}</div>` : ""}
      ${a.description ? `<p style="margin:8px 0 0 0;font-size:12px;color:var(--text-muted)">${a.description}</p>` : ""}
    `;
    el.querySelector("[data-del]").onclick = (e) => {
      e.stopPropagation();
      deleteActivity(a._id);
    };
    el.querySelector("[data-ed]").onclick = (e) => {
      e.stopPropagation();
      openActivityEditor(a);
    };
    rem.appendChild(el);
  });
}

function prevMonth() {
  calState.month--;
  if (calState.month < 0) {
    calState.month = 11;
    calState.year--;
  }
  renderCalendar();
}

function nextMonth() {
  calState.month++;
  if (calState.month > 11) {
    calState.month = 0;
    calState.year++;
  }
  renderCalendar();
}

let actModalState = { editId: null, baseDate: null, type: "atividade" };

function selectActivityType(type) {
  actModalState.type = type;
  document.querySelectorAll(".type-btn").forEach(btn => {
    btn.classList.toggle("selected", btn.dataset.type === type);
  });
}

function openNewActivity(y, m, d) {
  openActivityModal(new Date(y, m, d));
}

function openActivityModal(date) {
  const m = document.getElementById("activity-modal");
  if (!m) return;
  actModalState = { editId: null, baseDate: date || new Date(), type: "atividade" };
  document.getElementById("am-title").value = "";
  document.getElementById("am-tags").value = "";
  document.getElementById("am-desc").value = "";
  document.getElementById("am-edit-id").value = "";
  const d = date || new Date();
  const startDefault = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 0);
  const endDefault = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 10, 0);
  document.getElementById("am-start").value = toLocalStr(startDefault);
  document.getElementById("am-end").value = toLocalStr(endDefault);
  selectActivityType("atividade");
  m.style.display = "flex";
}

function openActivityEditor(a) {
  const m = document.getElementById("activity-modal");
  if (!m) return;
  actModalState = { editId: a._id, baseDate: new Date(a.startAt), type: a.type || "atividade" };
  document.getElementById("am-title").value = a.title;
  document.getElementById("am-tags").value = (a.tags || []).join(", ");
  document.getElementById("am-desc").value = a.description || "";
  document.getElementById("am-edit-id").value = a._id;
  document.getElementById("am-start").value = toLocalStr(new Date(a.startAt));
  document.getElementById("am-end").value = toLocalStr(new Date(a.endAt));
  selectActivityType(a.type || "atividade");
  m.style.display = "flex";
}

function closeActivityModal() {
  const m = document.getElementById("activity-modal");
  if (m) m.style.display = "none";
}

async function submitActivityModal() {
  const title = document.getElementById("am-title").value.trim();
  const tagsStr = document.getElementById("am-tags").value.trim();
  const start = document.getElementById("am-start").value;
  const end = document.getElementById("am-end").value;
  const desc = document.getElementById("am-desc").value.trim();
  if (!title || !start || !end) {
    alert("Preencha título e horários");
    return;
  }
  const tags = tagsStr ? tagsStr.split(",").map(s => s.trim()).filter(Boolean) : [];
  const type = actModalState.type;
  const payload = { title, description: desc, startAt: new Date(start), endAt: new Date(end), tags, type };
  if (actModalState.editId) {
    await updateActivityAPI(actModalState.editId, payload);
  } else {
    await addActivityAPI(payload);
  }
  closeActivityModal();
}

async function addActivityAPI(payload) {
  const res = await fetch(apiUrl(`/api/subjects/${subjectId}/activities`), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (res.ok) await loadActivities();
}

async function updateActivityAPI(id, payload) {
  const res = await fetch(apiUrl(`/api/subjects/${subjectId}/activities/${id}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (res.ok) await loadActivities();
}

async function deleteActivity(id) {
  if (!confirm("Excluir atividade?")) return;
  const res = await fetch(apiUrl(`/api/subjects/${subjectId}/activities/${id}`), {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (res.ok) await loadActivities();
}

async function loadWeeklyData() {
  const weekEnd = new Date(weeklyState.weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const res = await fetch(apiUrl(`/api/subjects/${subjectId}/planner?start=${weeklyState.weekStart.toISOString()}&end=${weekEnd.toISOString()}`), { headers: authHeaders() });
  if (!res.ok) return;
  weeklyState.plannerData = await res.json();
  renderWeeklyPlanner();
}

function renderWeeklyPlanner() {
  const container = document.getElementById("weekly-agenda-grid");
  const rangeLabel = document.getElementById("weekly-range-label");
  if (!container) return;
  const weekEnd = new Date(weeklyState.weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  if (rangeLabel) {
    rangeLabel.textContent = `${weeklyState.weekStart.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })} - ${weekEnd.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}`;
  }
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  container.innerHTML = "";
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(weeklyState.weekStart);
    d.setDate(d.getDate() + i);
    const key = fmtDateKey(d);
    const plannerItem = weeklyState.plannerData.find(p => fmtDateKey(new Date(p.date)) === key);
    const hours = plannerItem?.hours || 0;
    const tasks = plannerItem?.tasks || [];
    const isToday = d.toDateString() === today.toDateString();
    const dayEl = document.createElement("div");
    dayEl.className = "planner-day" + (isToday ? " today" : "");
    dayEl.innerHTML = `
      <div class="day-header">
        <span class="day-name">${dayNames[i]}</span>
        <span class="day-date">${d.getDate()}</span>
      </div>
      <div class="day-hours-input">
        <input type="number" step="0.5" min="0" value="${hours}" 
          class="input" style="width: 70px; text-align: center; padding: 8px;"
          onchange="saveDayHours('${key}', this.value)"
          placeholder="0h">
        <span style="font-size: 11px; color: var(--text-muted);">horas</span>
      </div>
      <div class="day-checklist">
        ${tasks.map((task, idx) => `
          <div class="check-item${task.status === 'concluido' ? ' done' : ''}" onclick="toggleTask('${key}', ${idx}, '${task._id}')">
            <div class="check-box">${task.status === 'concluido' ? '✓' : ''}</div>
            <span class="check-text">${task.title}</span>
          </div>
        `).join("")}
        <div class="check-item" style="color: var(--accent-primary);" onclick="addTask('${key}')">
          <div class="check-box" style="border-style: dashed;">+</div>
          <span>Adicionar meta</span>
        </div>
      </div>
    `;
    container.appendChild(dayEl);
  }
}

function changeWeek(delta) {
  const d = new Date(weeklyState.weekStart);
  d.setDate(d.getDate() + delta * 7);
  weeklyState.weekStart = d;
  loadWeeklyData();
}

async function saveDayHours(dateKey, hours) {
  const h = parseFloat(hours) || 0;
  const res = await fetch(apiUrl(`/api/subjects/${subjectId}/planner/hours`), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ date: dateKey, hours: h }),
  });
  if (res.ok) {
    await loadWeeklyData();
  }
}

async function toggleTask(dateKey, idx, taskId) {
  const plannerItem = weeklyState.plannerData.find(p => fmtDateKey(new Date(p.date)) === dateKey);
  if (!plannerItem || !plannerItem.tasks[idx]) return;
  const currentStatus = plannerItem.tasks[idx].status;
  const newStatus = currentStatus === 'concluido' ? 'nao feito' : 'concluido';
  const res = await fetch(apiUrl(`/api/subjects/${subjectId}/planner/tasks/${taskId}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ status: newStatus }),
  });
  if (res.ok) {
    await loadWeeklyData();
  }
}

async function addTask(dateKey) {
  const title = prompt("Qual sua meta para hoje?");
  if (!title) return;
  const res = await fetch(apiUrl(`/api/subjects/${subjectId}/planner/tasks`), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ date: dateKey, title }),
  });
  if (res.ok) {
    await loadWeeklyData();
  }
}

function initTabs() {
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const tabId = tab.dataset.tab;
      switchTab(tabId);
    });
  });
}

function switchTab(tabId) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
  const activeTab = document.querySelector(`.tab[data-tab="${tabId}"]`);
  if (activeTab) activeTab.classList.add("active");
  const content = document.getElementById(`tab-${tabId}`);
  if (content) content.classList.add("active");
}

document.addEventListener("DOMContentLoaded", init);
