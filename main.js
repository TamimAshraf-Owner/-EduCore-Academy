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
