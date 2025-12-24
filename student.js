var studentName = localStorage.getItem("selectedStudent") || "Student Name";
document.getElementById("studentName").textContent = studentName;

var goalsKey = "goals_" + studentName;
var summariesKey = "summaries_" + studentName;

function showMsg(el, text, type) {
  if (!el) return;
  el.textContent = text;
  el.className = "form-msg " + type; // "error" / "success"
  el.style.display = "block";
}

function hideMsg(el) {
  if (!el) return;
  el.style.display = "none";
  el.textContent = "";
  el.className = "form-msg";
}

renderStudentProfile();

function renderStudentProfile() {
  var profile = {};
  try {
    profile = JSON.parse(localStorage.getItem("student_profile_" + studentName) || "{}");
  } catch (e) {
    profile = {};
  }

  document.getElementById("profileEmail").textContent = profile.email || "—";
  document.getElementById("profilePhone").textContent = profile.phone || "—";
  document.getElementById("profileGrade").textContent = profile.grade || "—";
}

function closeModalById(id) {
  var m = document.getElementById(id);
  if (m) m.style.display = "none";
}

function showConfirm(message, callback) {
  var modal = document.getElementById("confirm_modal");
  var text = document.getElementById("modal_text");
  var yesBtn = document.getElementById("confirm-yes");
  var noBtn = document.getElementById("confirm-no");

  if (!modal || !text || !yesBtn || !noBtn) {
    callback(confirm(message));
    return;
  }

  text.textContent = message;
  modal.style.display = "flex";

  yesBtn.onclick = function () {
    closeModalById("confirm_modal");
    callback(true);
  };

  noBtn.onclick = function () {
    closeModalById("confirm_modal");
    callback(false);
  };
}

bindStudentButtons();

function bindStudentButtons() {
  var updateBtn = document.getElementById("updateStudentBtn");
  var deleteBtn = document.getElementById("deleteStudentBtn");

  if (updateBtn) updateBtn.onclick = openEditStudent;
  if (deleteBtn) deleteBtn.onclick = deleteStudent;
}

function openEditStudent() {
  var editModal = document.getElementById("edit_modal");
  var emailEl = document.getElementById("edit_email");
  var phoneEl = document.getElementById("edit_phone");
  var gradeEl = document.getElementById("edit_grade");
  var saveBtn = document.getElementById("edit-save");
  var cancelBtn = document.getElementById("edit-cancel");

  var profile = JSON.parse(localStorage.getItem("student_profile_" + studentName) || "{}");

  emailEl.value = profile.email || "";
  phoneEl.value = profile.phone || "";
  gradeEl.value = profile.grade || "";

  editModal.style.display = "flex";

  cancelBtn.onclick = function () {
    closeModalById("edit_modal");
  };

  saveBtn.onclick = function () {
    var form = document.getElementById("edit-student-form");
    if (form && !form.reportValidity()) return;

    var updated = {
      name: studentName,
      email: emailEl.value.trim(),
      phone: phoneEl.value.trim(),
      grade: gradeEl.value.trim()
    };

    localStorage.setItem("student_profile_" + studentName, JSON.stringify(updated));

    closeModalById("edit_modal");
    renderStudentProfile();
  };
}

function normalizeName(x) {
  return String(x || "").trim().toLowerCase();
}

function removeStudentFromListKey(listKey, studentName) {
  var raw = localStorage.getItem(listKey);
  if (!raw) return;

  var arr;
  try {
    arr = JSON.parse(raw);
  } catch (e) {
    return;
  }

  if (!Array.isArray(arr)) return;

  var target = normalizeName(studentName);
  var out = [];

  for (var i = 0; i < arr.length; i++) {
    var item = arr[i];
    var nameVal = (item && typeof item === "object" && item.name != null) ? item.name : item;

    if (normalizeName(nameVal) !== target) out.push(item);
  }

  localStorage.setItem(listKey, JSON.stringify(out));
}

function deleteStudent() {
  showConfirm("Delete this student and all their data?", function (ok) {
    if (!ok) return;

    var target = normalizeName(studentName);

    var keysToDelete = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (!k) continue;

      var prefixes = ["student_profile_", "goals_", "summaries_", "lessons_"];
      for (var p = 0; p < prefixes.length; p++) {
        var pref = prefixes[p];
        if (k.indexOf(pref) === 0) {
          var namePart = k.substring(pref.length);
          if (normalizeName(namePart) === target) keysToDelete.push(k);
        }
      }
    }
    for (var d = 0; d < keysToDelete.length; d++) localStorage.removeItem(keysToDelete[d]);

    removeStudentFromListKey("students_db", studentName);
    removeStudentFromListKey("students", studentName);
    removeStudentFromListKey("students_list", studentName);
    removeStudentFromListKey("all_students", studentName);

    var allLessonsRaw = localStorage.getItem("all_lessons");
    if (allLessonsRaw) {
      var allLessons;
      try { allLessons = JSON.parse(allLessonsRaw); } catch (e2) { allLessons = null; }

      if (Array.isArray(allLessons)) {
        var kept = [];
        for (var j = 0; j < allLessons.length; j++) {
          var st = (allLessons[j] && allLessons[j].student != null) ? allLessons[j].student : "";
          if (normalizeName(st) !== target) kept.push(allLessons[j]);
        }
        localStorage.setItem("all_lessons", JSON.stringify(kept));
      }
    }

    localStorage.removeItem("selectedStudent");
    window.location.href = "home.html";
  });
}

let summaries = [];

function loadSummaries() {
  const saved = localStorage.getItem(summariesKey);
  summaries = saved ? JSON.parse(saved) : [];
  renderSummaries();
}
loadSummaries();

function saveSummaries() {
  localStorage.setItem(summariesKey, JSON.stringify(summaries));
}

function renderSummaries() {
  const container = document.getElementById("historyList");
  container.innerHTML = "";

  if (summaries.length === 0) {
    const empty = document.createElement("div");
    empty.textContent = "No summaries saved yet.";
    empty.style.fontSize = "13px";
    empty.style.color = "#6b7280";
    container.appendChild(empty);
    return;
  }

  summaries.slice().reverse().forEach((s) => {
    const card = document.createElement("div");
    card.className = "history-card";

    const header = document.createElement("div");
    header.className = "history-header";
    header.innerHTML = `<span>${s.subject || "Lesson"}</span><span>${s.date || ""}</span>`;

    const meta = document.createElement("div");
    meta.className = "history-meta";
    meta.textContent = s.createdAt ? "Saved at: " + new Date(s.createdAt).toLocaleString() : "";

    const body = document.createElement("div");
    body.textContent = s.summary || "";

    card.appendChild(header);
    card.appendChild(meta);
    card.appendChild(body);
    container.appendChild(card);
  });
}

function saveLessonSummary() {
  const msgEl = document.getElementById("summaryMsg");
  hideMsg(msgEl);

  const date = document.getElementById("lessonDate").value;
  const subject = document.getElementById("lessonSubject").value.trim();
  const summary = document.getElementById("lessonSummary").value.trim();

  if (!date) return showMsg(msgEl, "Please choose a lesson date.", "error");
  if (!subject) return showMsg(msgEl, "Please enter a subject.", "error");
  if (!summary) return showMsg(msgEl, "Please write the lesson summary.", "error");

  summaries.push({ date, subject, summary, createdAt: Date.now() });
  saveSummaries();
  renderSummaries();

  saveLessonToAllLessons(date, subject, null);

  document.getElementById("lessonSummary").value = "";

  showMsg(msgEl, "✔ Summary saved successfully", "success");
  setTimeout(() => hideMsg(msgEl), 2000);
}

function saveLessonToAllLessons(date, subject, time) {
  const allLessons = JSON.parse(localStorage.getItem("all_lessons")) || [];

  const lesson = {
    student: studentName,
    date,
    time: time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    subject,
    createdAt: Date.now()
  };

  allLessons.push(lesson);
  localStorage.setItem("all_lessons", JSON.stringify(allLessons));
}
const d = document.getElementById("nextLessonDate");
if (d) d.min = new Date().toISOString().split("T")[0];

function saveNextLesson() {
  const msgEl = document.getElementById("scheduleMsg");
  hideMsg(msgEl);

  const date = document.getElementById("nextLessonDate").value;
  const time = document.getElementById("nextLessonTime").value;
  const subject = document.getElementById("nextLessonSubject").value.trim();

  if (!date) return showMsg(msgEl, "Please choose a date for the next lesson.", "error");
  if (!time) return showMsg(msgEl, "Please choose a time for the next lesson.", "error");
  if (!subject) return showMsg(msgEl, "Please enter the lesson subject.", "error");

  saveLessonToAllLessons(date, subject, time);

  document.getElementById("nextLessonSubject").value = "";

  showMsg(msgEl, "✔ Lesson added to schedule", "success");
  setTimeout(() => hideMsg(msgEl), 2000);
}

var goals = [];
loadGoals();

function loadGoals() {
  var saved = localStorage.getItem(goalsKey);
  goals = saved ? JSON.parse(saved) : [];
  renderGoals();
}

function saveGoals() {
  localStorage.setItem(goalsKey, JSON.stringify(goals));
}

function renderGoals() {
  var container = document.getElementById("goalsList");
  if (!container) return;

  container.innerHTML = "";

  for (var i = 0; i < goals.length; i++) {
    (function (index) {
      var g = goals[index];

      var div = document.createElement("div");
      div.className = "goal-item";

      var left = document.createElement("div");
      left.className = "goal-left";

      var status = document.createElement("span");
      status.className = "goal-status" + (g.done ? " done" : "");
      status.textContent = g.done ? "Completed" : "Active";

      var text = document.createElement("span");
      text.textContent = g.text;

      left.appendChild(status);
      left.appendChild(text);

      var actions = document.createElement("div");
      actions.className = "goal-actions";

      var toggle = document.createElement("button");
      toggle.className = "complete";
      toggle.textContent = g.done ? "↺" : "✓";
      toggle.onclick = function () {
        goals[index].done = !goals[index].done;
        saveGoals();
        renderGoals();
      };

      var del = document.createElement("button");
      del.className = "delete";
      del.textContent = "✕";
      del.onclick = function () {
        goals.splice(index, 1);
        saveGoals();
        renderGoals();
      };

      actions.appendChild(toggle);
      actions.appendChild(del);

      div.appendChild(left);
      div.appendChild(actions);
      container.appendChild(div);
    })(i);
  }
}

function addGoal() {
  var input = document.getElementById("goalText");
  if (!input) return;

  var text = input.value.trim();
  if (!text) return;

  goals.unshift({ text: text, done: false });
  input.value = "";
  saveGoals();
  renderGoals();
}
