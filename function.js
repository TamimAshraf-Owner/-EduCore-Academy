/* EduCore combined function.js
   This file contains the shared utilities and main application in one file.
   The app itself loads script.js + main.js so the architecture remains modular.
*/

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


/* =========================================================
   EduCore Main Application
   Core UI, state, students, results and certificates
   ========================================================= */

const APP = {
  institution: {
    name: "EduCore Academy",
    subtitle: "Academic Result & Certificate System",
    logo: "EC"
  },
  subjects: ["Subject 1", "Subject 2", "Subject 3", "Subject 4", "Subject 5"]
};

let state = readAppStorage() || {
  students: [],
  results: [],
  certificates: [],
  settings: { ...APP.institution }
};

function saveState() {
  writeAppStorage(state);
  updateDashboard();
}

function navigate(page) {
  document.querySelectorAll(".page").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));

  const target = document.getElementById(`${page}Page`);
  const nav = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (target) target.classList.add("active");
  if (nav) nav.classList.add("active");

  if (page === "students") renderStudents();
  if (page === "results") renderResultStudentOptions();
  if (page === "certificate") renderCertificateStudentOptions();
  if (page === "settings") loadSettingsForm();
}

function addStudent() {
  const name = prompt("Student name:");
  if (!name?.trim()) return;

  const studentClass = prompt("Class / Grade:", "Class 10") || "Class 10";
  const roll = prompt("Roll number:", String(state.students.length + 1)) || String(state.students.length + 1);

  const student = {
    id: createId("STU"),
    name: name.trim(),
    className: studentClass.trim(),
    roll: roll.trim(),
    createdAt: new Date().toISOString()
  };

  state.students.unshift(student);
  saveState();
  renderStudents();
  renderResultStudentOptions();
  renderCertificateStudentOptions();
  showToast("Student added successfully.", "success");
}

function deleteStudent(id) {
  const student = state.students.find(s => s.id === id);
  if (!student) return;
  if (!confirm(`Delete ${student.name}?`)) return;

  state.students = state.students.filter(s => s.id !== id);
  state.results = state.results.filter(r => r.studentId !== id);
  state.certificates = state.certificates.filter(c => c.studentId !== id);
  saveState();
  renderStudents();
  renderResultStudentOptions();
  renderCertificateStudentOptions();
  showToast("Student deleted.", "success");
}

function renderStudents() {
  const box = document.getElementById("studentsTable");
  if (!box) return;

  const query = (document.getElementById("studentSearch")?.value || "").toLowerCase().trim();
  const rows = state.students.filter(s =>
    `${s.name} ${s.id} ${s.className} ${s.roll}`.toLowerCase().includes(query)
  );

  if (!rows.length) {
    box.innerHTML = `<div class="empty">No students found. Add your first student.</div>`;
    return;
  }

  box.innerHTML = `
    <table>
      <thead><tr><th>Name</th><th>ID</th><th>Class</th><th>Roll</th><th>Action</th></tr></thead>
      <tbody>
        ${rows.map(s => `
          <tr>
            <td><strong>${escapeHtml(s.name)}</strong></td>
            <td>${escapeHtml(s.id)}</td>
            <td>${escapeHtml(s.className)}</td>
            <td>${escapeHtml(s.roll)}</td>
            <td><button class="danger-btn" data-delete-student="${escapeAttribute(s.id)}">Delete</button></td>
          </tr>`).join("")}
      </tbody>
    </table>`;
}

function renderRecentStudents() {
  const box = document.getElementById("recentStudents");
  if (!box) return;

  const rows = state.students.slice(0, 5);
  if (!rows.length) {
    box.innerHTML = `<div class="empty">No students yet.</div>`;
    return;
  }

  box.innerHTML = `
    <table>
      <thead><tr><th>Name</th><th>Class</th><th>Roll</th><th>Added</th></tr></thead>
      <tbody>${rows.map(s => `
        <tr>
          <td>${escapeHtml(s.name)}</td>
          <td>${escapeHtml(s.className)}</td>
          <td>${escapeHtml(s.roll)}</td>
          <td>${formatDate(s.createdAt)}</td>
        </tr>`).join("")}</tbody>
    </table>`;
}

function renderResultStudentOptions() {
  const select = document.getElementById("resultStudent");
  if (!select) return;
  select.innerHTML = state.students.length
    ? state.students.map(s => `<option value="${escapeAttribute(s.id)}">${escapeHtml(s.name)} — ${escapeHtml(s.className)}</option>`).join("")
    : `<option value="">No students available</option>`;
  renderResultPreview();
}

function renderCertificateStudentOptions() {
  const select = document.getElementById("certificateStudent");
  if (!select) return;
  select.innerHTML = state.students.length
    ? state.students.map(s => `<option value="${escapeAttribute(s.id)}">${escapeHtml(s.name)} — ${escapeHtml(s.className)}</option>`).join("")
    : `<option value="">No students available</option>`;
}

function renderResultPreview() {
  const box = document.getElementById("resultPreview");
  if (!box) return;
  const marks = collectMarks(["mark1","mark2","mark3","mark4","mark5"]);
  const summary = resultSummary(marks);
  box.innerHTML = `
    <div class="result-card">
      <div class="metric"><span>Total</span><strong>${summary.total}/500</strong></div>
      <div class="metric"><span>Average</span><strong>${summary.average}%</strong></div>
      <div class="metric"><span>GPA</span><strong>${summary.gpa}</strong></div>
      <div class="metric"><span>Grade</span><strong>${summary.grade}</strong></div>
    </div>`;
}

function saveResult() {
  const studentId = document.getElementById("resultStudent")?.value;
  if (!studentId) {
    showToast("Add a student first.", "error");
    return;
  }

  const ids = ["mark1","mark2","mark3","mark4","mark5"];
  const marks = collectMarks(ids);
  if (marks.some(m => !validMark(m))) {
    showToast("Each mark must be between 0 and 100.", "error");
    return;
  }

  const summary = resultSummary(marks);
  const existing = state.results.find(r => r.studentId === studentId);

  const result = {
    id: existing?.id || createId("RES"),
    studentId,
    marks,
    ...summary,
    updatedAt: new Date().toISOString()
  };

  if (existing) Object.assign(existing, result);
  else state.results.unshift(result);

  saveState();
  showToast("Result saved successfully.", "success");
}

function generateCertificate() {
  const studentId = document.getElementById("certificateStudent")?.value;
  const student = state.students.find(s => s.id === studentId);
  if (!student) {
    showToast("Select a student first.", "error");
    return;
  }

  const title = document.getElementById("certificateTitle")?.value.trim() ||
    "Certificate of Academic Achievement";

  const result = state.results.find(r => r.studentId === studentId);
  const cert = {
    id: createCertificateId(),
    studentId,
    title,
    date: new Date().toISOString()
  };

  state.certificates.unshift(cert);
  saveState();

  const box = document.getElementById("certificatePreview");
  box.innerHTML = `
    <div class="certificate" id="printableCertificate">
      <div class="cert-logo">${escapeHtml(state.settings.logo)}</div>
      <div class="cert-meta">${escapeHtml(state.settings.name)}</div>
      <h2>${escapeHtml(title)}</h2>
      <div>This certificate is proudly presented to</div>
      <div class="student-name">${escapeHtml(student.name)}</div>
      <div>for academic achievement in ${escapeHtml(student.className)}</div>
      <div class="cert-meta">
        ${result ? `GPA: ${result.gpa} · Grade: ${escapeHtml(result.grade)} · Average: ${result.average}%` : "Academic result record"}
      </div>
      <div class="cert-meta">Certificate ID: ${escapeHtml(cert.id)} · ${formatDate(cert.date)}</div>
      <button class="primary-btn no-print" id="printCertificateBtn">Print Certificate</button>
    </div>`;

  document.getElementById("printCertificateBtn")?.addEventListener("click", () => {
    const printable = document.getElementById("printableCertificate").cloneNode(true);
    printable.querySelector(".no-print")?.remove();
    printHtml(title, printable.outerHTML);
  });

  showToast("Certificate generated.", "success");
}

function updateDashboard() {
  document.getElementById("studentCount").textContent = state.students.length;
  document.getElementById("resultCount").textContent = state.results.length;
  document.getElementById("certificateCount").textContent = state.certificates.length;

  const avg = average(state.results.map(r => r.gpa));
  document.getElementById("averageGpa").textContent = round(avg, 2);
  renderRecentStudents();
}

function loadSettingsForm() {
  document.getElementById("institutionName").value = state.settings.name;
  document.getElementById("institutionSubtitle").value = state.settings.subtitle;
  document.getElementById("logoText").value = state.settings.logo;
}

function saveSettings() {
  state.settings.name = document.getElementById("institutionName").value.trim() || "EduCore Academy";
  state.settings.subtitle = document.getElementById("institutionSubtitle").value.trim() || "Academic Result & Certificate System";
  state.settings.logo = document.getElementById("logoText").value.trim().slice(0, 4).toUpperCase() || "EC";
  saveState();
  showToast("Settings saved.", "success");
}

function resetData() {
  if (!confirm("Reset all demo data? This cannot be undone.")) return;
  state = {
    students: [],
    results: [],
    certificates: [],
    settings: { ...APP.institution }
  };
  saveState();
  renderStudents();
  renderResultStudentOptions();
  renderCertificateStudentOptions();
  loadSettingsForm();
  showToast("Demo data reset.", "success");
}

function seedDemoData() {
  if (state.students.length) return;

  state.students = [
    { id: "STU-DEMO-001", name: "Ariana Rahman", className: "Class 10", roll: "01", createdAt: new Date().toISOString() },
    { id: "STU-DEMO-002", name: "Rayan Ahmed", className: "Class 9", roll: "07", createdAt: new Date().toISOString() }
  ];
  state.results = [{
    id: "RES-DEMO-001",
    studentId: "STU-DEMO-001",
    marks: [88, 79, 91, 84, 86],
    total: 428,
    average: 85.6,
    gpa: 4.8,
    grade: "A+",
    updatedAt: new Date().toISOString()
  }];
  saveState();
}

function init() {
  state.settings ||= { ...APP.institution };

  seedDemoData();
  setupTheme();

  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => navigate(btn.dataset.page));
  });

  document.querySelectorAll("[data-page-link]").forEach(btn => {
    btn.addEventListener("click", () => navigate(btn.dataset.pageLink));
  });

  document.getElementById("quickAddStudent")?.addEventListener("click", () => {
    navigate("students");
    addStudent();
  });
  document.getElementById("addStudentBtn")?.addEventListener("click", addStudent);
  document.getElementById("studentSearch")?.addEventListener("input", renderStudents);

  document.getElementById("saveResultBtn")?.addEventListener("click", saveResult);
  ["mark1","mark2","mark3","mark4","mark5"].forEach(id =>
    document.getElementById(id)?.addEventListener("input", renderResultPreview)
  );

  document.getElementById("generateCertificateBtn")?.addEventListener("click", generateCertificate);
  document.getElementById("saveSettingsBtn")?.addEventListener("click", saveSettings);
  document.getElementById("resetBtn")?.addEventListener("click", resetData);

  document.addEventListener("click", event => {
    const button = event.target.closest("[data-delete-student]");
    if (button) deleteStudent(button.dataset.deleteStudent);
  });

  updateDashboard();
  renderStudents();
  renderResultStudentOptions();
  renderCertificateStudentOptions();
  loadSettingsForm();
}

document.addEventListener("DOMContentLoaded", init);
