// הערה כללית:
// שם הסטודנט משמש כאן כמזהה לזיהוי הסטודנט בתוך ה־ localStorage 
// שיצרנו לצורך שמירת כל נתוני המערכת, ועבודה עם מחיקות ועדכון
// ולכן לא ניתן ליצור שני סטודנטים עם אותו השם.


document.addEventListener("DOMContentLoaded", function () {

  // Main key used to store students list
  var STUDENTS_DB_KEY = "students_db";

  // Check if user is logged in
  var loggedUser = localStorage.getItem("loggedUser");
  if (!loggedUser) {
    window.location.href = "login.html";
    return;
  }

  // Header elements
  var teacherNameSpan = document.getElementById("teacher-name");
  var teacherSubjectSpan = document.getElementById("teacher-subject");

  // Set logged in teacher name
  if (teacherNameSpan) teacherNameSpan.textContent = " " + loggedUser;
  if (teacherSubjectSpan) teacherSubjectSpan.textContent = "Mathematic";

  // Students data and UI elements
  var students = [];
  var studentsListEl = document.getElementById("students-list");
  var studentSearchInput = document.getElementById("student-search");

  // Load students list from localStorage
  function initStudentsData() {
    var stored;
    try {
      stored = JSON.parse(localStorage.getItem(STUDENTS_DB_KEY) || "null");
    } catch (e) {
      stored = null;
    }

    if (stored && Array.isArray(stored) && stored.length > 0) {
      students = stored;
    } else {
      localStorage.setItem(STUDENTS_DB_KEY, JSON.stringify(students));
    }
  }

  // Clear students list UI
  function clearStudentList() {
    if (!studentsListEl) return;
    studentsListEl.innerHTML = "";
  }

  // Filter students by search text
  function filterStudents(searchText) {
    var lower = String(searchText || "").toLowerCase();
    var out = [];
    for (var i = 0; i < students.length; i++) {
      var name = students[i];
      if (String(name).toLowerCase().indexOf(lower) !== -1) {
        out.push(name);
      }
    }
    return out;
  }

  // Initialize add student form submit
  function initAddStudentForm() {
    var form = document.getElementById("add-student-form");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      addStudentFromForm();
    });
  }

  // Read values from form and save student
  function addStudentFromForm() {
    var nameEl = document.getElementById("new-student-name");
    var emailEl = document.getElementById("new-student-email");
    var phoneEl = document.getElementById("new-student-phone");
    var gradeEl = document.getElementById("new-student-grade");
    // without unneccesery spaces
    var name = (nameEl && nameEl.value || "").trim();
    var email = (emailEl && emailEl.value || "").trim();
    var phone = (phoneEl && phoneEl.value || "").trim();
    var grade = (gradeEl && gradeEl.value || "").trim();

    if (!name) return;

    // Add student only if not exists 
    if (!studentExists(name)) {
      students.push(name);
      writeJson(STUDENTS_DB_KEY, students);
    }

    // Save student profile data
    saveStudentProfile(name, {
      name: name,
      email: email,
      phone: phone,
      grade: grade
    });

    renderStudents(studentSearchInput ? studentSearchInput.value : "");

    // Clear form fields
    if (nameEl) nameEl.value = "";
    if (emailEl) emailEl.value = "";
    if (phoneEl) phoneEl.value = "";
    if (gradeEl) gradeEl.value = "";
  }

  // Check if student already exists 
  function studentExists(name) {
    var n = name.toLowerCase();
    return students.some(function (s) {//loop that checks all students
      return String(s).toLowerCase() === n;
    });
  }

  // Save single student profile
  function saveStudentProfile(name, profile) {
    localStorage.setItem("student_profile_" + name, JSON.stringify(profile));
  }

  // Helper to write JSON to localStorage
  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // Create clickable student list item
  function createStudentItem(name) {
    var li = document.createElement("li");
    li.textContent = name;
    li.classList.add("student-item");
    li.addEventListener("click", function () {
      localStorage.setItem("selectedStudent", name);
      window.location.href = "../Student Page/student.html";

    });
    return li;
  }

  // Render students list based on filter
  function renderStudents(filterText) {
    clearStudentList();
    if (!studentsListEl) return;

    var matchingStudents = filterStudents(filterText);
    for (var i = 0; i < matchingStudents.length; i++) {
      studentsListEl.appendChild(createStudentItem(matchingStudents[i]));
    }
  }

  initStudentsData();
  renderStudents("");

  // Live search students
  if (studentSearchInput) {
    studentSearchInput.addEventListener("input", function () {
      renderStudents(studentSearchInput.value);
    });
  }

  initAddStudentForm();

  /* Upcoming Lessons */

  
  function safeJsonParse(text, fallback) {
    try {
      var x = JSON.parse(text);
      return Array.isArray(x) ? x : fallback;
    } catch (e) {
      return fallback;
    }
  }

  // Remove duplicate lessons
  function dedupeLessons(lessons) {
    var seen = {};
    var out = [];

    for (var i = 0; i < lessons.length; i++) {
      var l = lessons[i] || {};
      var key = //convert lesson to string
        String(l.student || "") + "|" +
        String(l.subject || "") + "|" +
        String(l.date || "") + "|" +
        String(l.time || "");

      if (seen[key]) continue;
      seen[key] = true;
      out.push(l);
    }
    return out;// all classes after cleaning dup
  }

  // Collect lessons from all sources
  function getAllLessonsUnified() {
    var lessons = [];

    var globalLessons = safeJsonParse(localStorage.getItem("all_lessons"), []);
    for (var a = 0; a < globalLessons.length; a++) 
      lessons.push(globalLessons[a]);

    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (!key || key.indexOf("lessons_") !== 0) continue;

      var studentName = key.replace("lessons_", "");
      var studentLessons = safeJsonParse(localStorage.getItem(key), []);

      for (var j = 0; j < studentLessons.length; j++) {
        var lesson = studentLessons[j] || {};
        var merged = {};
        for (var prop in lesson) {
          if (Object.prototype.hasOwnProperty.call(lesson, prop)) {
            merged[prop] = lesson[prop];
          }
        }
        merged.student = lesson.student || studentName;
        lessons.push(merged);
      }
    }

    return dedupeLessons(lessons);
  }

  // Parse date and time into Date object- convert all dated to same format
  function parseLessonDateTime(lesson) {
    if (!lesson || !lesson.date) return null;

    var dateStr = String(lesson.date).trim();
    var timeStr = lesson.time ? String(lesson.time).trim() : "00:00";

    var year, month, day;

    if (dateStr.indexOf("/") !== -1) {
      var parts1 = dateStr.split("/");
      if (parts1.length !== 3) return null;
      day = parseInt(parts1[0], 10);
      month = parseInt(parts1[1], 10);
      year = parseInt(parts1[2], 10);
    } 
    else if (dateStr.indexOf("-") !== -1) {
      var parts2 = dateStr.split("-");
      if (parts2.length !== 3) return null;
      year = parseInt(parts2[0], 10);
      month = parseInt(parts2[1], 10);
      day = parseInt(parts2[2], 10);
    }
     else {
      return null;
    }

    var hour = 0, minute = 0;
    if (timeStr.indexOf(":") !== -1) {
      var t = timeStr.split(":");
      hour = parseInt(t[0], 10);
      minute = parseInt(t[1], 10);
    }

    var d = new Date(year, month - 1, day, hour, minute);
    return isNaN(d.getTime()) ? null : d;
  }

  // Get next 5 upcoming lessons
  function getUpcomingFiveLessons() {
    var now = new Date();
    var all = getAllLessonsUnified();

    var upcoming = [];
    for (var i = 0; i < all.length; i++) {
      var l = all[i];
      var dt = parseLessonDateTime(l);
      if (!dt) continue;

      if (dt >= now) {
        var copy = {};
        for (var prop in l) {
          if (Object.prototype.hasOwnProperty.call(l, prop)) {
            copy[prop] = l[prop];
          }
        }
        copy._dt = dt;
        upcoming.push(copy);
      }
    }

    upcoming.sort(function (a, b) {
      return a._dt - b._dt;
    });

    var out = [];
    for (var k = 0; k < upcoming.length && k < 5; k++) {
      out.push(upcoming[k]);
    }
    return out;
  }

  // Render upcoming lessons cards
  function renderUpcomingLessons() {
    var stack = document.getElementById("stack");
    if (!stack) return;

    stack.innerHTML = "";
    var nextFive = getUpcomingFiveLessons();

    for (var i = 0; i < nextFive.length; i++) {
      var lesson = nextFive[i];

      var card = document.createElement("div");
      card.className = "card";

      card.innerHTML =
        '<div class="card-header">' +
        '<div class="title">' + (lesson.subject || "") + " — " + (lesson.student || "") + '</div>' +
        '<div class="arrow">📘</div>' +
        '</div>' +
        '<div class="card-body">' +
        '<div class="row"><span>Date:</span> ' + (lesson.date || "") + '</div>' +
        '<div class="row"><span>Time:</span> ' + (lesson.time || "") + '</div>' +
        '<div class="row"><span>Student:</span> ' + (lesson.student || "") + '</div>' +
        '<div class="row"><span>Subject:</span> ' + (lesson.subject || "") + '</div>' +
        '</div>';

      card.addEventListener("click", onUpcomingCardClick);
      stack.appendChild(card);
    }
  }

  // open upcoming lesson card
  function onUpcomingCardClick(e) {
    var card = e.currentTarget;
    var isOpen = card.classList.contains("open");

    var cards = document.querySelectorAll(".card");
    for (var i = 0; i < cards.length; i++) cards[i].classList.remove("open");//close other cards

    if (!isOpen) card.classList.add("open");
  }

  renderUpcomingLessons();

  //* Notes 

  var notesList = document.getElementById("notes-list");
  var noteInput = document.getElementById("new-note-input");
  var addNoteBtn = document.getElementById("add-note-btn");

  // Load notes from storage
  var notes;
  try {
    notes = JSON.parse(localStorage.getItem("notes")) || [];
  } catch (e) {
    notes = [];
  }

  // Render notes list
  function renderNotes() {
    if (!notesList) return;
    notesList.innerHTML = "";

    for (var i = 0; i < notes.length; i++) {
      var li = document.createElement("li");
      li.classList.add("note-item");
      li.innerHTML =
        '<button class="delete-btn" data-index="' + i + '">✖</button>' +
        '<button class="edit-btn" data-index="' + i + '">✎</button>' +
        "<div>" + notes[i] + "</div>";
      notesList.appendChild(li);
    }
  }

  renderNotes();

  // Add new note
  if (addNoteBtn) {
    addNoteBtn.addEventListener("click", function () {
      if (!noteInput) return;
      var text = noteInput.value.trim();
      if (!text) return;

      notes.push(text);
      localStorage.setItem("notes", JSON.stringify(notes));
      noteInput.value = "";
      renderNotes();
    });
  }

  // Submit note on Enter key
  if (noteInput) {
    noteInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter" && addNoteBtn) addNoteBtn.click();
    });
  }

  // Handle edit and delete note actions
  if (notesList) {
    notesList.addEventListener("click", function (event) {
      if (event.target.classList.contains("delete-btn")) {
        var indexDel = parseInt(event.target.getAttribute("data-index"), 10);
        showConfirm("Are you sure you want to delete this note?", function (ok) {
          if (ok) {
            notes.splice(indexDel, 1);
            localStorage.setItem("notes", JSON.stringify(notes));
            renderNotes();
          }
        });
      }

      if (event.target.classList.contains("edit-btn")) {
        var indexEdit = parseInt(event.target.getAttribute("data-index"), 10);
        editNote(notes[indexEdit], function (result) {
          if (result) {
            notes[indexEdit] = result;
            localStorage.setItem("notes", JSON.stringify(notes));
            renderNotes();
          }
        });
      }
    });
  }

  // Generic confirmation modal
  function showConfirm(message, callback) {
    var modal = document.getElementById("confirm_modal");
    var modalText = document.getElementById("modal_text");
    var yesBtn = document.getElementById("confirm-yes");
    var noBtn = document.getElementById("confirm-no");

    if (!modal || !modalText || !yesBtn || !noBtn) {
      callback(confirm(message));
      return;
    }

    modalText.textContent = message;
    modal.style.display = "flex";

    yesBtn.onclick = function () {
      modal.style.display = "none";
      callback(true);
    };

    noBtn.onclick = function () {
      modal.style.display = "none";
      callback(false);
    };
  }

  // Edit note modal logic
  function editNote(currentText, callback) {
    var modal = document.getElementById("edit_modal");
    var input = document.getElementById("edit_input");
    var saveBtn = document.getElementById("edit-save");
    var cancelBtn = document.getElementById("edit-cancel");

    if (!modal || !input || !saveBtn || !cancelBtn) {
      callback(prompt("Edit note:", currentText));
      return;
    }

    input.value = currentText;
    modal.style.display = "flex";

    saveBtn.onclick = function () {
      modal.style.display = "none";
      callback(input.value.trim());
    };

    cancelBtn.onclick = function () {
      modal.style.display = "none";
      callback(null);
    };
  }

  // Logout user
  var logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      localStorage.removeItem("loggedUser");
      window.location.href = "../Login Page/login.html";
    });
  }
});

/* Clock */

// Update current date and time in header
function updateClock() {
  var now = new Date();
  var timeString = now.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });

  var el = document.getElementById("current-time");
  if (el) el.textContent = timeString;
}

// Refresh clock every second
setInterval(updateClock, 1000);
updateClock();
