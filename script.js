/* =========================================================
   EduCore Shared Script
   Utility, storage, validation, theme and reusable helpers
   ========================================================= */

const EDUCORE_STORAGE_KEY = "educore_result_system_v2";

function readAppStorage() {
  try {
    return JSON.parse(localStorage.getItem(EDUCORE_STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

function writeAppStorage(value) {
  localStorage.setItem(EDUCORE_STORAGE_KEY, JSON.stringify(value));
}

function round(value, digits = 2) {
  const n = Number(value) || 0;
  const factor = 10 ** digits;
  return Math.round(n * factor) / factor;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function createId(prefix = "ID") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

function createCertificateId() {
  return `CERT-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function formatDate(value = new Date()) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit", month: "short", year: "numeric"
  }).format(new Date(value));
}

function average(numbers) {
  const valid = numbers.map(Number).filter(Number.isFinite);
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
}

function gradeFromMark(mark) {
  const n = Number(mark) || 0;
  if (n >= 80) return { grade: "A+", point: 5 };
  if (n >= 70) return { grade: "A", point: 4 };
  if (n >= 60) return { grade: "A-", point: 3.5 };
  if (n >= 50) return { grade: "B", point: 3 };
  if (n >= 40) return { grade: "C", point: 2 };
  if (n >= 33) return { grade: "D", point: 1 };
  return { grade: "F", point: 0 };
}

function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.dataset.type = type;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}

function printHtml(title, html) {
  const win = window.open("", "_blank", "width=1000,height=800");
  if (!win) {
    showToast("Allow pop-ups to print the certificate.", "error");
    return;
  }

  win.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>${escapeHtml(title)}</title>
        <link rel="stylesheet" href="style.css">
        <style>
          body { background:#fff !important; padding:24px !important; }
          @media print { body { padding:0 !important; } }
        </style>
      </head>
      <body>${html}</body>
    </html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 350);
}

function applyTheme(theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  const button = document.getElementById("themeToggle");
  if (button) button.textContent = theme === "dark" ? "☀" : "☾";
}

function toggleTheme() {
  const current = localStorage.getItem("educore_theme") === "dark" ? "dark" : "light";
  const next = current === "dark" ? "light" : "dark";
  localStorage.setItem("educore_theme", next);
  applyTheme(next);
}

function setupTheme() {
  applyTheme(localStorage.getItem("educore_theme") || "light");
  document.getElementById("themeToggle")?.addEventListener("click", toggleTheme);
}

function validMark(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 100;
}

function collectMarks(ids) {
  return ids.map(id => Number(document.getElementById(id)?.value || 0));
}

function resultSummary(marks) {
  const total = marks.reduce((a, b) => a + b, 0);
  const avg = average(marks);
  const points = marks.map(m => gradeFromMark(m).point);
  const gpa = round(average(points), 2);
  const overall = gradeFromMark(avg);
  return { total, average: round(avg, 2), gpa, grade: overall.grade };
}
