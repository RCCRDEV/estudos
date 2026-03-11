function authHeaders(){const t=localStorage.getItem("token");return{Authorization:`Bearer ${t}`}}
function getId(){const u=new URLSearchParams(location.search);return u.get("id")}
function setTheme(theme){if(theme==="light"){document.documentElement.setAttribute("data-theme","light");}else{document.documentElement.removeAttribute("data-theme");}localStorage.setItem("theme",theme);}
function toggleTheme(){const cur=localStorage.getItem("theme")==="light"?"dark":"light";setTheme(cur);}
(function(){const saved=localStorage.getItem("theme")||"dark";setTheme(saved);})();
let fcState={cards:[],i:0,revealed:false,score:0,inSession:false,order:[],correct:0,answered:0};
function saveScore(){const id=getId();localStorage.setItem(`score:${id}`,String(fcState.score));document.getElementById("score").textContent=fcState.score;}
function loadScore(){const id=getId();const v=localStorage.getItem(`score:${id}`);fcState.score = v?parseInt(v,10):0;document.getElementById("score").textContent=fcState.score;}
function setTrainerVisible(v){const tr=document.getElementById("trainer");const sb=document.getElementById("btn-start");if(tr){tr.style.display=v?"grid":"none";}if(sb){sb.style.display=v?"none":"inline-flex";}}
function renderFlashcardTrainer(){
  const flip=document.getElementById("flip");const front=document.getElementById("fc-front-view");const back=document.getElementById("fc-back-view");const counter=document.getElementById("fc-counter");
  const has=fcState.cards.length>0&&fcState.inSession;
  if(!has){
    if(front){front.textContent=fcState.cards.length>0?"Clique em Iniciar teste.":"Nenhum flashcard.";}
    if(back){back.textContent="";}
    const br=document.getElementById("btn-reveal"); if(br) br.disabled=true;
    const bc=document.getElementById("btn-correct"); if(bc){bc.disabled=true; bc.style.display="none";}
    const bw=document.getElementById("btn-wrong"); if(bw){bw.disabled=true; bw.style.display="none";}
    if(flip) flip.classList.remove("revealed");
    if(counter) counter.textContent="";
    setTrainerVisible(false);
    return
  }
  setTrainerVisible(true);
  const idx=fcState.order[fcState.i];
  const c=fcState.cards[idx];
  if(front) front.textContent=c.front;
  if(back) back.textContent=c.back;
  if(counter) counter.textContent=`${fcState.i+1}/${fcState.order.length}`;
  const br=document.getElementById("btn-reveal"); if(br){br.disabled=false; br.style.display=fcState.revealed?"none":"inline-flex";}
  const bc=document.getElementById("btn-correct"); if(bc){bc.disabled=!fcState.revealed; bc.style.display=fcState.revealed?"inline-flex":"none";}
  const bw=document.getElementById("btn-wrong"); if(bw){bw.disabled=!fcState.revealed; bw.style.display=fcState.revealed?"inline-flex":"none";}
  flip.classList.toggle("revealed", fcState.revealed);
}
function revealCard(){fcState.revealed=true;renderFlashcardTrainer();}
function markCorrect(){fcState.correct+=1;fcState.answered+=1;fcState.revealed=false;nextCard();}
function markWrong(){fcState.answered+=1;fcState.revealed=false;nextCard();}
function nextCard(){if(!fcState.inSession)return; if(fcState.answered>=fcState.order.length){endSession();return;} fcState.i=Math.min(fcState.i+1, fcState.order.length-1);renderFlashcardTrainer();}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function startSession(){if(fcState.cards.length===0){renderFlashcardTrainer();return;} fcState.order=shuffle([...Array(fcState.cards.length).keys()]);fcState.i=0;fcState.correct=0;fcState.answered=0;fcState.revealed=false;fcState.inSession=true;document.getElementById("fc-summary").textContent="";renderFlashcardTrainer();}
async function endSession(){fcState.inSession=false;const total=fcState.order.length;const pct=total?Math.round((fcState.correct/total)*100):0;const passed=pct>=60;saveScore();await saveTestResult(fcState.correct,total);await loadTests();showResultModal(pct,passed);renderFlashcardTrainer();}
async function loadSubject(){
  const id=getId(); if(!id) return;
  const title=document.getElementById("subject-title");
  const resList=await fetch("/api/subjects",{headers:authHeaders()});
  if(!resList.ok){title.textContent="Matéria";return}
  const items=await resList.json();
  const s=items.find(x=>x._id===id);
  title.textContent=s?`Matéria: ${s.name}`:"Matéria";
}
async function loadFlashcards(){
  const id=getId(); const wrap=document.getElementById("flashcards");
  const r=await fetch(`/api/subjects/${id}/flashcards`,{headers:authHeaders()});
  if(!r.ok){ if(wrap) wrap.innerHTML=""; return }
  const items=await r.json();
  if(wrap){ wrap.innerHTML=""; }
  fcState.cards = items;
  fcState.i = 0;
  fcState.revealed = false;
  fcState.inSession = false;
  document.getElementById("fc-total").textContent = String(items.length);
  loadScore();
  renderFlashcardTrainer();
}
async function addFlashcard(){
  const id=getId();
  const front=document.getElementById("fc-front").value.trim();
  const back=document.getElementById("fc-back").value.trim();
  if(!front||!back){alert("Preencha pergunta e resposta");return}
  const r=await fetch(`/api/subjects/${id}/flashcards`,{
    method:"POST",headers:{ "Content-Type":"application/json",...authHeaders()},body:JSON.stringify({front,back})
  });
  if(r.ok){document.getElementById("fc-front").value="";document.getElementById("fc-back").value="";loadFlashcards()} else {alert("Erro")}
}
async function delFlashcard(fid){
  const id=getId();
  const r=await fetch(`/api/subjects/${id}/flashcards/${fid}`,{method:"DELETE",headers:authHeaders()});
  if(r.ok){ loadFlashcards(); loadFlashcardsManager(); }
}
async function loadVideos(){
  const id=getId(); const wrap=document.getElementById("videos");
  const r=await fetch(`/api/subjects/${id}/videos`,{headers:authHeaders()});
  if(!r.ok){wrap.innerHTML="";return}
  const items=await r.json(); wrap.innerHTML="";
  items.forEach(v=>{
    const isYT = v.url && /youtu\.?be/.test(v.url);
    const ytId = isYT ? (v.url.match(/(?:v=|\.be\/)([A-Za-z0-9_-]{6,})/)||[])[1] : null;
    const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : "";
    const link=v.sourceType==="url"?`<a href="${v.url}" target="_blank">Abrir</a>`:`<a href="${v.filePath}" target="_blank">Baixar</a>`;
    const el=document.createElement("div"); el.className="card";
    el.innerHTML=`<div class="thumb">${thumb?`<img src="${thumb}">`:"Vídeo"}</div>
                  <h3 style="margin-top:8px">${v.title}</h3>
                  <p>${v.sourceType==="url"?"URL":"Upload"} • ${link}</p>
                  <div class="trainer-actions" style="margin-top:8px">
                    <button class="btn btn-reveal" data-ed="${v._id}">Renomear</button>
                    <button class="btn btn-wrong" data-del="${v._id}">Excluir</button>
                  </div>`;
    el.querySelector("[data-del]").onclick=async ()=>{
      const rr=await fetch(`/api/subjects/${id}/videos/${v._id}`,{method:"DELETE",headers:authHeaders()});
      if(rr.ok) loadVideos();
    };
    el.querySelector("[data-ed]").onclick=async ()=>{
      const nt=prompt("Novo título:", v.title); if(!nt) return;
      const rr=await fetch(`/api/subjects/${id}/videos/${v._id}`,{method:"PUT",headers:{ "Content-Type":"application/json",...authHeaders()},body:JSON.stringify({title:nt})});
      if(rr.ok) loadVideos();
    };
    wrap.appendChild(el);
  });
}
async function addVideoUrl(){
  const id=getId();
  const title=document.getElementById("v-title").value.trim();
  const url=document.getElementById("v-url").value.trim();
  if(!title||!url){alert("Informe título e URL");return}
  const r=await fetch(`/api/subjects/${id}/videos/url`,{
    method:"POST",headers:{ "Content-Type":"application/json",...authHeaders()},body:JSON.stringify({title,url})
  });
  if(r.ok){document.getElementById("v-title").value="";document.getElementById("v-url").value="";loadVideos()} else {alert("Erro")}
}
async function uploadVideoFile(){
  const id=getId();
  const f=document.getElementById("v-file").files[0];
  const title=document.getElementById("v-title").value.trim();
  if(!f){alert("Escolha um arquivo de vídeo");return}
  const fd=new FormData();
  if(title) fd.append("title", title);
  fd.append("file", f);
  const r=await fetch(`/api/subjects/${id}/videos/upload`,{method:"POST",headers:{...authHeaders()},body:fd});
  if(r.ok){document.getElementById("v-file").value="";loadVideos()} else {alert("Erro no upload")}
}
async function loadNotes(){
  const id=getId();
  const r=await fetch(`/api/subjects/${id}/notes`,{headers:authHeaders()});
  if(!r.ok){notesState.items=[]; renderNotePage(); return}
  const items=await r.json();
  notesState.items = items;
  notesState.i = items.length?0:-1;
  notesState.editing=false;
  renderNotePage();
}
async function addNote(){
  const id=getId();
  const title=document.getElementById("n-title").value.trim();
  const content=document.getElementById("n-content").value.trim();
  if(!title||!content){alert("Título e conteúdo");return}
  const r=await fetch(`/api/subjects/${id}/notes`,{method:"POST",headers:{ "Content-Type":"application/json",...authHeaders()},body:JSON.stringify({title,content})});
  if(r.ok){loadNotes()} else {alert("Erro")}
}
const notesState={items:[],i:-1,editing:false,creating:false};
function renderNotePage(){
  const title=document.getElementById("n-title");
  const content=document.getElementById("n-content");
  const page=document.getElementById("note-page");
  const btnSave=document.getElementById("btn-save-page");
  const total=notesState.items.length;
  if(page) page.textContent=`Página ${total?notesState.i+1:0}/${total}`;
  if(total===0 && !notesState.creating){ if(title) title.value=""; if(content) content.value=""; if(btnSave) btnSave.disabled=true; return; }
  const cur=notesState.items[notesState.i];
  if(!notesState.creating){
    if(title) { title.value=cur?.title||""; title.disabled=!notesState.editing; }
    if(content) { content.value=cur?.content||""; content.disabled=!notesState.editing; }
  } else {
    if(title) { title.disabled=false; }
    if(content) { content.disabled=false; }
  }
  if(btnSave) btnSave.disabled=!notesState.editing;
}
function prevPage(){ if(notesState.items.length){ notesState.i=(notesState.i-1+notesState.items.length)%notesState.items.length; notesState.editing=false; renderNotePage(); } }
function nextPage(){ if(notesState.items.length){ notesState.i=(notesState.i+1)%notesState.items.length; notesState.editing=false; renderNotePage(); } }
function newPage(){ notesState.creating=true; notesState.editing=true; notesState.i=-1; document.getElementById("n-title").value=""; document.getElementById("n-content").value=""; document.getElementById("btn-save-page").disabled=false; }
function editPage(){ if(notesState.items.length){ notesState.editing=true; renderNotePage(); } }
async function savePage(){
  const title=document.getElementById("n-title").value.trim();
  const content=document.getElementById("n-content").value.trim();
  if(!title||!content){alert("Preencha título e conteúdo");return}
  if(notesState.creating || notesState.i<0){
    const id=getId();
    const r=await fetch(`/api/subjects/${id}/notes`,{method:"POST",headers:{ "Content-Type":"application/json",...authHeaders()},body:JSON.stringify({title,content})});
    if(r.ok){ notesState.creating=false; notesState.editing=false; await loadNotes(); notesState.i=notesState.items.length?notesState.items.length-1:-1; renderNotePage(); }
    else { alert("Erro ao salvar") }
    return;
  }
  const cur=notesState.items[notesState.i];
  const id=getId();
  const r=await fetch(`/api/subjects/${id}/notes/${cur._id}`,{method:"PUT",headers:{ "Content-Type":"application/json",...authHeaders()},body:JSON.stringify({title,content})});
  if(r.ok){notesState.editing=false; await loadNotes();} else {alert("Erro ao salvar")}
}
async function deletePage(){
  if(notesState.i<0) return;
  const cur=notesState.items[notesState.i];
  const id=getId();
  const r=await fetch(`/api/subjects/${id}/notes/${cur._id}`,{method:"DELETE",headers:authHeaders()});
  if(r.ok){loadNotes();} else {alert("Erro ao excluir")}
}

// Activity modal flow
let actModalState={editId:null, baseDate:null};
function openActivityModal(date){
  const m=document.getElementById("activity-modal"); if(!m) return;
  actModalState={editId:null, baseDate:date||new Date()};
  document.getElementById("am-title").value="";
  document.getElementById("am-tags").value="";
  const d = date || new Date();
  const toLocal=(dt)=>{const z=new Date(dt.getTime()-dt.getTimezoneOffset()*60000);return z.toISOString().slice(0,16)}
  document.getElementById("am-start").value=toLocal(new Date(d.getFullYear(),d.getMonth(),d.getDate(),9,0));
  document.getElementById("am-end").value=toLocal(new Date(d.getFullYear(),d.getMonth(),d.getDate(),10,0));
  document.getElementById("am-desc").value="";
  m.style.display="flex";
}
function openActivityEditor(a){
  const m=document.getElementById("activity-modal"); if(!m) return;
  actModalState={editId:a._id, baseDate:new Date(a.startAt)};
  document.getElementById("am-title").value=a.title;
  document.getElementById("am-tags").value=(a.tags||[]).join(", ");
  const toLocal=(dt)=>{const z=new Date(new Date(dt).getTime()-new Date(dt).getTimezoneOffset()*60000);return z.toISOString().slice(0,16)}
  document.getElementById("am-start").value=toLocal(a.startAt);
  document.getElementById("am-end").value=toLocal(a.endAt);
  document.getElementById("am-desc").value=a.description||"";
  m.style.display="flex";
}
function closeActivityModal(){const m=document.getElementById("activity-modal"); if(m) m.style.display="none";}
async function submitActivityModal(){
  const title=document.getElementById("am-title").value.trim();
  const tagsStr=document.getElementById("am-tags").value.trim();
  const start=document.getElementById("am-start").value;
  const end=document.getElementById("am-end").value;
  const desc=document.getElementById("am-desc").value.trim();
  if(!title||!start||!end){alert("Preencha título e horários");return}
  const tags=tagsStr?tagsStr.split(",").map(s=>s.trim()).filter(Boolean):[];
  const payload={title, description:desc, startAt:new Date(start), endAt:new Date(end), tags};
  if(actModalState.editId){ await updateActivityAPI(actModalState.editId,payload); }
  else{ await addActivityAPI(payload); }
  closeActivityModal();
}
function toLocal(dt){const d=new Date(dt);return d.toLocaleString()}
let calState={month:new Date().getMonth(),year:new Date().getFullYear(),activities:[]};
function parseLocalDateTime(s){const [d,t]=s.split("T");const [Y,M,D]=d.split("-").map(Number);const [h,m]=t.split(":").map(Number);return new Date(Y,M-1,D,h,m)}
function fmtDateKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function renderCalendar(){
  const title=document.getElementById("cal-title");
  const grid=document.getElementById("cal-grid");
  if(!grid||!title) return;
  const first=new Date(calState.year, calState.month, 1);
  const startDay=first.getDay();
  const days=new Date(calState.year, calState.month+1, 0).getDate();
  title.textContent=`${first.toLocaleDateString(undefined,{month:"long"})} ${calState.year}`;
  grid.innerHTML="";
  for(let i=0;i<startDay;i++){const empty=document.createElement("div"); grid.appendChild(empty);}
  const byDay={};
  calState.activities.forEach(a=>{const d=new Date(a.startAt);const key=fmtDateKey(new Date(d.getFullYear(),d.getMonth(),d.getDate()));(byDay[key]=byDay[key]||[]).push(a)});
  for(let day=1;day<=days;day++){
    const cell=document.createElement("div"); cell.className="cal-cell";
    const dayLbl=document.createElement("div"); dayLbl.className="cal-day"; dayLbl.textContent=String(day); cell.appendChild(dayLbl);
    const key=fmtDateKey(new Date(calState.year,calState.month,day));
    (byDay[key]||[]).slice(0,3).forEach(a=>{
      const chip=document.createElement("div"); chip.className="cal-chip"; chip.textContent=`${a.title}${a.tags&&a.tags.length?` • ${a.tags.join(", ")}`:""}`;
      chip.onclick=()=>openActivityEditor(a);
      cell.appendChild(chip);
    });
    cell.onclick=(e)=>{ if(e.target===cell||e.target===dayLbl) openNewActivity(calState.year,calState.month,day); };
    grid.appendChild(cell);
  }
  renderReminders();
}
function renderReminders(){
  const rem=document.getElementById("reminders"); if(!rem) return;
  rem.innerHTML="";
  const up=[...calState.activities].sort((a,b)=>new Date(a.startAt)-new Date(b.startAt)).slice(0,5);
  up.forEach(a=>{
    const el=document.createElement("div"); el.className="card"; el.style.width="260px";
    el.innerHTML=`<h3>${a.title}</h3><p>${toLocal(a.startAt)} - ${toLocal(a.endAt)}</p>
                  <p class="muted">${a.tags&&a.tags.length?`Tags: ${a.tags.join(", ")}`:""}</p>
                  <div class="trainer-actions" style="margin-top:8px">
                    <a href="${a.googleLink}" target="_blank">Google Agenda</a>
                    <button class="btn btn-reveal" data-ed="${a._id}">Editar</button>
                    <button class="btn btn-wrong" data-del="${a._id}">Excluir</button>
                  </div>`;
    el.querySelector("[data-del]").onclick=()=>deleteActivity(a._id);
    el.querySelector("[data-ed]").onclick=()=>openActivityEditor(a);
    rem.appendChild(el);
  });
}
async function loadActivities(){
  const id=getId();
  const r=await fetch(`/api/subjects/${id}/activities`,{headers:authHeaders()});
  if(!r.ok){calState.activities=[];renderCalendar();return}
  calState.activities=await r.json();
  renderCalendar();
}
function openNewActivity(y,m,d){
  const start=new Date(y,m,d,9,0); const end=new Date(y,m,d,10,0);
  const title=prompt("Título da atividade:");
  if(!title) return;
  const desc=prompt("Descrição (opcional):")||"";
  const tagsStr=prompt("Tags (ex.: prova, lembrete, atividade):")||"";
  const tags=tagsStr.split(",").map(s=>s.trim()).filter(Boolean);
  addActivityAPI({title: title, description: desc, startAt: start, endAt: end, tags});
}
function openActivityEditor(a){
  const title=prompt("Título:", a.title); if(!title) return;
  const desc=prompt("Descrição:", a.description||"")||"";
  const startStr=prompt("Início (YYYY-MM-DD HH:MM):", new Date(a.startAt).toISOString().slice(0,16).replace("T"," "));
  const endStr=prompt("Fim (YYYY-MM-DD HH:MM):", new Date(a.endAt).toISOString().slice(0,16).replace("T"," "));
  const parse=(s)=>{const [date,time]=s.split(" ");const [Y,M,D]=date.split("-").map(Number);const [h,mi]=time.split(":").map(Number);return new Date(Y,M-1,D,h,mi)};
  const startAt=startStr?parse(startStr):new Date(a.startAt);
  const endAt=endStr?parse(endStr):new Date(a.endAt);
  const tagsStr=prompt("Tags (vírgulas):", (a.tags||[]).join(", "))||"";
  const tags=tagsStr.split(",").map(s=>s.trim()).filter(Boolean);
  updateActivityAPI(a._id,{title,description:desc,startAt,endAt,tags});
}
async function addActivityAPI(payload){
  const id=getId();
  const r=await fetch(`/api/subjects/${id}/activities`,{method:"POST",headers:{ "Content-Type":"application/json",...authHeaders()},body:JSON.stringify(payload)});
  if(r.ok){loadActivities()} else {alert("Erro ao criar atividade")}
}
async function updateActivityAPI(activityId,payload){
  const id=getId();
  const r=await fetch(`/api/subjects/${id}/activities/${activityId}`,{method:"PUT",headers:{ "Content-Type":"application/json",...authHeaders()},body:JSON.stringify(payload)});
  if(r.ok){loadActivities()} else {alert("Erro ao atualizar atividade")}
}
async function deleteActivity(activityId){
  const id=getId();
  const r=await fetch(`/api/subjects/${id}/activities/${activityId}`,{method:"DELETE",headers:authHeaders()});
  if(r.ok){loadActivities()} else {alert("Erro ao excluir atividade")}
}
function prevMonth(){calState.month--; if(calState.month<0){calState.month=11;calState.year--;} renderCalendar();}
function nextMonth(){calState.month++; if(calState.month>11){calState.month=0;calState.year++;} renderCalendar();}
function initTabs(){
  const tabs=document.querySelectorAll(".tab");
  tabs.forEach(t=>t.addEventListener("click",()=>{
    tabs.forEach(x=>x.classList.remove("active"));
    t.classList.add("active");
    const id=t.getAttribute("data-tab");
    document.querySelectorAll(".tab-content").forEach(c=>c.classList.remove("active"));
    document.getElementById(`tab-${id}`).classList.add("active");
  }));
}
async function saveTestResult(correct,total){
  const id=getId();
  await fetch(`/api/subjects/${id}/tests`,{method:"POST",headers:{ "Content-Type":"application/json",...authHeaders()},body:JSON.stringify({correct,total})});
}
async function loadTests(){
  const id=getId();
  const r=await fetch(`/api/subjects/${id}/tests`,{headers:authHeaders()});
  if(!r.ok) return;
  const data=await r.json();
  const tbody=document.querySelector("#tests-table tbody");
  const avg=document.getElementById("tests-avg");
  if(avg) avg.textContent=String(data.avg||0);
  if(tbody){
    tbody.innerHTML="";
    (data.items||[]).forEach(it=>{
      const tr=document.createElement("tr");
      tr.innerHTML=`<td style="padding:10px;border-bottom:1px solid rgba(255,255,255,.06)">${toLocal(it.createdAt)}</td>
                    <td style="padding:10px;border-bottom:1px solid rgba(255,255,255,.06)">${it.correct}</td>
                    <td style="padding:10px;border-bottom:1px solid rgba(255,255,255,.06)">${it.total}</td>
                    <td style="padding:10px;border-bottom:1px solid rgba(255,255,255,.06)">${it.percentage}%</td>
                    <td style="padding:10px;border-bottom:1px solid rgba(255,255,255,.06)">${it.percentage>=60?"Aprovado":"Reprovado"}</td>`;
      tbody.appendChild(tr);
    });
  }
}
document.addEventListener("DOMContentLoaded",()=>{initTabs();loadSubject();loadFlashcards();loadVideos();loadNotes();loadActivities();loadTests();renderFlashcardTrainer();});
function showResultModal(pct,passed){
  const modal=document.getElementById("result-modal");
  const txt=document.getElementById("result-text");
  if(txt) txt.textContent = passed ? `Parabéns! Você acertou ${pct}%.` : `Você acertou ${pct}%. Continue praticando!`;
  if(modal) modal.style.display="flex";
}
function closeResultModal(){
  const modal=document.getElementById("result-modal");
  if(modal) modal.style.display="none";
}

function openFlashcardsModal(){
  const modal=document.getElementById("flashcards-modal");
  if(modal){ modal.style.display="flex"; loadFlashcardsManager(); }
}
function closeFlashcardsModal(){
  const modal=document.getElementById("flashcards-modal");
  if(modal){ modal.style.display="none"; }
}
async function loadFlashcardsManager(){
  const id=getId();
  const r=await fetch(`/api/subjects/${id}/flashcards`,{headers:authHeaders()});
  if(!r.ok) return;
  const items=await r.json();
  const tbody=document.querySelector("#fc-manage-table tbody");
  if(!tbody) return;
  tbody.innerHTML="";
  items.forEach(fc=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td style="padding:10px;border-bottom:1px solid rgba(255,255,255,.06)">${fc.front}</td>
                  <td style="padding:10px;border-bottom:1px solid rgba(255,255,255,.06)">${fc.back}</td>
                  <td style="padding:10px;border-bottom:1px solid rgba(255,255,255,.06)">
                    <button class="btn btn-reveal" data-ed="${fc._id}">Editar</button>
                    <button class="btn btn-wrong" data-del="${fc._id}">Excluir</button>
                  </td>`;
    tr.querySelector("[data-del]").onclick=async ()=>{
      const rr=await fetch(`/api/subjects/${id}/flashcards/${fc._id}`,{method:"DELETE",headers:authHeaders()});
      if(rr.ok){ loadFlashcards(); loadFlashcardsManager(); }
    };
    tr.querySelector("[data-ed]").onclick=()=>{
      tr.innerHTML=`<td style="padding:10px;border-bottom:1px solid rgba(255,255,255,.06)"><input id="ed-front" value="${fc.front}" style="width:100%;padding:8px"></td>
                    <td style="padding:10px;border-bottom:1px solid rgba(255,255,255,.06)"><input id="ed-back" value="${fc.back}" style="width:100%;padding:8px"></td>
                    <td style="padding:10px;border-bottom:1px solid rgba(255,255,255,.06)">
                      <button class="btn btn-next" id="save-ed">Salvar</button>
                      <button class="btn btn-wrong" id="cancel-ed">Cancelar</button>
                    </td>`;
      tr.querySelector("#save-ed").onclick=async ()=>{
        const nf=tr.querySelector("#ed-front").value.trim();
        const nb=tr.querySelector("#ed-back").value.trim();
        if(!nf||!nb){alert("Preencha frente e verso");return}
        const rr=await fetch(`/api/subjects/${id}/flashcards/${fc._id}`,{method:"PUT",headers:{ "Content-Type":"application/json",...authHeaders()},body:JSON.stringify({front:nf,back:nb})});
        if(rr.ok){ loadFlashcards(); loadFlashcardsManager(); } else { alert("Erro ao salvar"); }
      };
      tr.querySelector("#cancel-ed").onclick=()=>loadFlashcardsManager();
    };
    tbody.appendChild(tr);
  });
}
