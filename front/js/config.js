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
      "StudyFlow: defina a variável PUBLIC_API_URL no GitHub (Settings → Secrets and variables → Actions → Variables) ou o secret PUBLIC_API_URL, depois rode o deploy do Pages. A URL deve ser a do backend (Render etc.), sem barra no final."
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
