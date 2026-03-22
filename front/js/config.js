(function () {
  var m = document.querySelector('meta[name="api-base"]');
  if (m) {
    var c = (m.getAttribute("content") || "").trim();
    if (c) window.API_BASE = c;
  }
  if (
    typeof location !== "undefined" &&
    location.hostname.indexOf("github.io") !== -1 &&
    !(window.API_BASE && String(window.API_BASE).trim())
  ) {
    console.warn(
      "StudyFlow: no GitHub Pages o backend não roda aqui. Preencha <meta name=\"api-base\" content=\"https://SEU-SERVIDOR\"> nos HTML (URL do Express em produção, sem barra no final)."
    );
  }
})();

function apiUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  var p = path.startsWith("/") ? path : "/" + path;
  var b = (typeof window.API_BASE === "string" && window.API_BASE)
    ? window.API_BASE.replace(/\/$/, "")
    : "";
  return b ? b + p : p;
}
