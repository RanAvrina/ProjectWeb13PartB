
// CLASSES


// Student profile object 
class StudentProfile {
  constructor(name, email, phone, grade) {
    this.name = name;
    this.email = email;
    this.phone = phone;
    this.grade = grade;
  }
  // Convert to plain object for storage
  toObject() {
    return { name: this.name, email: this.email, phone: this.phone, grade: this.grade };
  }
  // Load student profile from localStorage
  static fromStorage(studentName) {
    let profile = {};
    try {
      profile = JSON.parse(localStorage.getItem("student_profile_" + studentName) || "{}");
    } catch (e) {
      profile = {};
    }
    return new StudentProfile(
      studentName,
      profile.email || "",
      profile.phone || "",
      profile.grade || ""
    );
  }
}

// One saved lesson summary (history item)
class Summary {
  constructor(date, subject, summary, createdAt) {
    this.date = date;
    this.subject = subject;
    this.summary = summary;
    this.createdAt = createdAt; // number (Date.now()) - keep same as before
  }
  // Convert to plain object for storage
  toObject() {
    return { date: this.date, subject: this.subject, summary: this.summary, createdAt: this.createdAt };
  }
}

// Lesson object used for schedule (all_lessons)
class Lesson {
  constructor(student, date, subject, time, createdAt) {
    this.student = student;
    this.date = date;
    this.time = time;
    this.subject = subject;
    this.createdAt = createdAt; // number (Date.now()) - keep same as before
  }
  // Convert to plain object for storage
  toObject() {
    return { student: this.student, date: this.date, time: this.time, subject: this.subject, createdAt: this.createdAt };
  }
  // Build lesson with default time if missing
  static build(studentName, date, subject, timeOrNull) {
    const timeFinal =
      timeOrNull ||
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return new Lesson(studentName, date, subject, timeFinal, Date.now());
  }
}

// Learning goal (saved per student)
class Goal {
  constructor(text, done) {
    this.text = text;
    this.done = !!done;
  }
  // Flip goal status (done/active)
  toggle() {
    this.done = !this.done;
  }
  // Convert to plain object for storage
  toObject() {
    return { text: this.text, done: this.done };
  }
}

// MAIN DATA / KEYS


// Get current student from storage
var studentName = localStorage.getItem("selectedStudent") || "Student Name";
document.getElementById("studentName").textContent = studentName;

// Keys for localStorage (per student)
var goalsKey = "goals_" + studentName;
var summariesKey = "summaries_" + studentName;


// UI MESSAGES


// Show feedback message (success / error)
function showMsg(el, text, type) { 
  if (!el) return;
  el.textContent = text;
  el.className = "form-msg " + type;
  el.style.display = "block";
}

// Hide feedback message
function hideMsg(el) { // hide msg
  if (!el) return;
  el.style.display = "none";
  el.textContent = "";
  el.className = "form-msg";
}


// STUDENT PROFILE


// Load profile from storage and show on screen
renderStudentProfile();

function renderStudentProfile() {
  // same output, just via class wrapper (safe)
  var profileObj = StudentProfile.fromStorage(studentName);

  document.getElementById("profileEmail").textContent = profileObj.email || "—";
  document.getElementById("profilePhone").textContent = profileObj.phone || "—";
  document.getElementById("profileGrade").textContent = profileObj.grade || "—";
}

// Close modal (confirm/edit)
function closeModalById(id) {
  var m = document.getElementById(id);
  if (m) m.style.display = "none";
}

// Custom confirm modal (used before delete)
function showConfirm(message, callback) {
  var modal = document.getElementById("confirm_modal");
  var text = document.getElementById("modal_text");
  var yesBtn = document.getElementById("confirm-yes");
  var noBtn = document.getElementById("confirm-no");

  // Fallback to browser confirm if modal elements missing
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

// Connect buttons to actions
bindStudentButtons();

function bindStudentButtons() {
  var updateBtn = document.getElementById("updateStudentBtn");
  var deleteBtn = document.getElementById("deleteStudentBtn");

  if (updateBtn) updateBtn.onclick = openEditStudent;
  if (deleteBtn) deleteBtn.onclick = deleteStudent;
}

// Open edit modal and save updated profile
function openEditStudent() {
  var editModal = document.getElementById("edit_modal");
  var emailEl = document.getElementById("edit_email");
  var phoneEl = document.getElementById("edit_phone");
  var gradeEl = document.getElementById("edit_grade");
  var saveBtn = document.getElementById("edit-save");
  var cancelBtn = document.getElementById("edit-cancel");

  // Load current profile data
  var profile = JSON.parse(localStorage.getItem("student_profile_" + studentName) || "{}");

  // Fill inputs in modal
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

    // Save updated student profile to storage
    // use class, but store same JSON shape
    var updatedProfile = new StudentProfile(
      studentName,
      emailEl.value.trim(),
      phoneEl.value.trim(),
      gradeEl.value.trim()
    );

    localStorage.setItem("student_profile_" + studentName, JSON.stringify(updatedProfile.toObject()));

    closeModalById("edit_modal");
    renderStudentProfile();
  };
}

// Normalize string for comparisons (case-insensitive)
function normalizeName(x) {
  return String(x || "").trim().toLowerCase();
}

// Remove a student from a list stored in localStorage (different possible keys)
function removeStudentFromListKey(listKey, studentNameParam) {
  var raw = localStorage.getItem(listKey);
  if (!raw) return;

  var arr;
  try {
    arr = JSON.parse(raw);
  } catch (e) {
    return;
  }

  if (!Array.isArray(arr)) return;

  var target = normalizeName(studentNameParam);
  var out = [];

  for (var i = 0; i < arr.length; i++) {
    var item = arr[i];
    // support list items as string OR object
    var nameVal = (item && typeof item === "object" && item.name != null) ? item.name : item;

    if (normalizeName(nameVal) !== target) out.push(item);
  }

  localStorage.setItem(listKey, JSON.stringify(out));
}

// Delete student + clean all related data (profile, goals, summaries, lessons)
function deleteStudent() {
  showConfirm("Delete this student and all their data?", function (ok) {
    if (!ok) return;

    var target = normalizeName(studentName);

    deleteStudentStorageKeys(target);
    removeStudentFromAllLists(studentName);
    removeStudentFromGlobalLessons(target);

    // go back to home
    localStorage.removeItem("selectedStudent");
    window.location.href = "../Home Page/home.html";
  });
}

// Delete all localStorage keys that belong to the current student
function deleteStudentStorageKeys(target) {
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

  for (var d = 0; d < keysToDelete.length; d++) {
    localStorage.removeItem(keysToDelete[d]);
  }
}

// Remove student from different students lists (support old keys too)
function removeStudentFromAllLists(studentName) {
  removeStudentFromListKey("students_db", studentName);
  removeStudentFromListKey("students", studentName);
  removeStudentFromListKey("students_list", studentName);
  removeStudentFromListKey("all_students", studentName);
}

// Remove student's lessons from the global schedule list (all_lessons)
function removeStudentFromGlobalLessons(target) {
  var allLessonsRaw = localStorage.getItem("all_lessons");
  if (!allLessonsRaw) return;

  var allLessons;
  try {
    allLessons = JSON.parse(allLessonsRaw);
  } catch (e2) {
    allLessons = null;
  }

  if (Array.isArray(allLessons)) {
    var kept = [];
    for (var j = 0; j < allLessons.length; j++) {
      var st =
        allLessons[j] && allLessons[j].student != null ? allLessons[j].student : "";
      if (normalizeName(st) !== target) kept.push(allLessons[j]);
    }
    localStorage.setItem("all_lessons", JSON.stringify(kept));
  }
}



// SUMMARIES (HISTORY)

let summaries = [];

// Load summaries from localStorage and render
function loadSummaries() {
  const saved = localStorage.getItem(summariesKey);
  summaries = saved ? JSON.parse(saved) : [];
  renderSummaries();
}
loadSummaries();

// Save summaries array to localStorage
function saveSummaries() {
  localStorage.setItem(summariesKey, JSON.stringify(summaries));
}

// Render summaries history list
function renderSummaries() {
  const container = document.getElementById("historyList");
  container.innerHTML = "";

   // Show empty state if no summaries
  if (summaries.length === 0) {
    const empty = document.createElement("div");
    empty.textContent = "No summaries saved yet.";
    empty.style.fontSize = "13px";
    empty.style.color = "#6b7280";
    container.appendChild(empty);
    return;
  }

  // Show from newest to oldest
 summaries.slice().reverse().forEach(function (s) {
  const card = document.createElement("div");
  card.className = "history-card";

  const header = document.createElement("div");
  header.className = "history-header";
  header.innerHTML =
    "<span>" + (s.subject || "Lesson") + "</span><span>" + (s.date || "") + "</span>";

  const meta = document.createElement("div");
  meta.className = "history-meta";
  meta.textContent = s.createdAt
    ? "Saved at: " + new Date(s.createdAt).toLocaleString()
    : "";

  const body = document.createElement("div");
  body.textContent = s.summary || "";

  card.appendChild(header);
  card.appendChild(meta);
  card.appendChild(body);
  container.appendChild(card);
});
}

// Save a new summary + update history
function saveLessonSummary() {
  const msgEl = document.getElementById("summaryMsg");
  hideMsg(msgEl);

  const date = document.getElementById("lessonDate").value;
  const subject = document.getElementById("lessonSubject").value.trim();
  const summaryText = document.getElementById("lessonSummary").value.trim();

  // Basic validation
  if (!date) return showMsg(msgEl, "Please choose a lesson date.", "error");
  if (!subject) return showMsg(msgEl, "Please enter a subject.", "error");
  if (!summaryText) return showMsg(msgEl, "Please write the lesson summary.", "error");

  // Create summary object and save
  // use class, store same object shape
  const newSummary = new Summary(date, subject, summaryText, Date.now());
  summaries.push(newSummary.toObject());

  saveSummaries();
  renderSummaries();

  // Also save it into global lessons list (for home page schedule)
  saveLessonToAllLessons(date, subject, null);

  document.getElementById("lessonSummary").value = "";

  showMsg(msgEl, "✔ Summary saved successfully", "success");
  setTimeout(() => hideMsg(msgEl), 2000);
}

// Save lesson into "all_lessons" (used by home page schedule)
function saveLessonToAllLessons(date, subject, time) {
  const allLessons = JSON.parse(localStorage.getItem("all_lessons")) || [];

  // use class, but keep same output
  const lesson = Lesson.build(studentName, date, subject, time);
  allLessons.push(lesson.toObject());

  localStorage.setItem("all_lessons", JSON.stringify(allLessons));
}

// Set minimum date for next lesson (today)
const d = document.getElementById("nextLessonDate");
if (d) d.min = new Date().toISOString().split("T")[0];

// Save next lesson to schedule
function saveNextLesson() {
  const msgEl = document.getElementById("scheduleMsg");
  hideMsg(msgEl);

  const date = document.getElementById("nextLessonDate").value;
  const time = document.getElementById("nextLessonTime").value;
  const subject = document.getElementById("nextLessonSubject").value.trim();

  // Basic validation
  if (!date) return showMsg(msgEl, "Please choose a date for the next lesson.", "error");
  if (!time) return showMsg(msgEl, "Please choose a time for the next lesson.", "error");
  if (!subject) return showMsg(msgEl, "Please enter the lesson subject.", "error");

  // Save scheduled lesson
  saveLessonToAllLessons(date, subject, time);

  document.getElementById("nextLessonSubject").value = "";

  showMsg(msgEl, "✔ Lesson added to schedule", "success");
  setTimeout(() => hideMsg(msgEl), 2000);
}


// GOALS


var goals = [];
loadGoals();

// Load goals from localStorage and render
function loadGoals() {
  var saved = localStorage.getItem(goalsKey);
  goals = saved ? JSON.parse(saved) : [];
  renderGoals();
}

// Save goals list to localStorage
function saveGoals() {
  localStorage.setItem(goalsKey, JSON.stringify(goals));
}

// Render goals list on screen
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
        // Delete goal from list
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

// Add new goal and save to storage
function addGoal() {
  var input = document.getElementById("goalText");
  if (!input) return;

  var text = input.value.trim();
  if (!text) return;

  // Create goal object and store it
  // use class, store same shape
  var g = new Goal(text, false);
  goals.unshift(g.toObject());

  input.value = "";
  saveGoals();
  renderGoals();
}
