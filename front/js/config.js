(function () {
  var m = document.querySelector('meta[name="api-base"]');
  if (m) {
    var c = (m.getAttribute("content") || "").trim();
    if (c) window.API_BASE = c;
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
