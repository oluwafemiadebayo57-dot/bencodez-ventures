// ============================================================
// API CONFIG — Auto-detects environment
// Local dev  → http://localhost:3000
// Production → https://bencodez-api.onrender.com
// ============================================================

const API = (window.location.hostname === "localhost" ||
             window.location.hostname === "127.0.0.1" ||
             window.location.protocol === "file:")
    ? "http://localhost:3000"
    : "https://bencodez-api.onrender.com";