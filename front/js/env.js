(function () {
  if (typeof window.API_BASE === "string" && window.API_BASE.trim()) return;
  if (typeof location !== "undefined") {
    if (
      location.protocol === "file:" ||
      ((location.hostname === "localhost" || location.hostname === "127.0.0.1") && location.port && location.port !== "3000")
    ) {
      window.API_BASE = "http://localhost:3000";
      return;
    }
  }
  window.API_BASE = "";
})();
