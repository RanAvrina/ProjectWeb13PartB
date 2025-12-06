document.addEventListener("DOMContentLoaded", function () {

    
    // 1. Login check
    
    const loggedUser = localStorage.getItem("loggedUser");
    if (!loggedUser) {
        window.location.href = "login.html";
        return;
    }

    const teacherNameSpan = document.getElementById("teacher-name");
    const teacherSubjectSpan = document.getElementById("teacher-subject");

    teacherNameSpan.textContent = " " + loggedUser;
    teacherSubjectSpan.textContent = "Mathematics"; // change if needed

   
    // 2. Students + search + dropdown

    const students = [
        "Adam Cohen",
        "Noa Levi",
        "Daniel Levi",
        "Maya Levi",
        "Omer Ben David"
    ];

    const studentsListEl = document.getElementById("students-list");
    const studentSearchInput = document.getElementById("student-search");
    const selectedStudentSpan = document.getElementById("selected-student");

    function renderStudents(filterText = "") {
        studentsListEl.innerHTML = "";
        const search = filterText.toLowerCase();

        students
            .filter(name => name.toLowerCase().includes(search))
            .forEach(name => {
                const li = document.createElement("li");
                li.textContent = name;

                li.addEventListener("click", () => {
                    selectedStudentSpan.textContent = name;
                });

                studentsListEl.appendChild(li);
            });
    }

    renderStudents();

    studentSearchInput.addEventListener("input", function () {
        renderStudents(studentSearchInput.value);
    });

    
    // 3. Upcoming Classes – cards
    
    const lessons = [
        { date: "2025-12-09", time: "18:30", name: "Noa Perez",   subject: "Science" },
        { date: "2025-12-10", time: "19:00", name: "Dana Levy",   subject: "English" },
        { date: "2025-12-12", time: "17:00", name: "Yossi Cohen", subject: "Math" },
        { date: "2025-12-14", time: "16:00", name: "Ori Mizrahi", subject: "History" },
        { date: "2025-12-15", time: "18:00", name: "Roni Kedem",  subject: "Language" }
        
    ];

    lessons.sort((a, b) => new Date(a.date) - new Date(b.date));

    const stack = document.getElementById("stack");

    lessons.forEach((lesson) => {
        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
            <div class="card-header">
                <div class="title">${lesson.subject} — ${lesson.name}</div>
                <div class="arrow">⬇️</div>
            </div>

            <div class="card-body">
                <div class="row"><span>Date:</span> ${lesson.date}</div>
                <div class="row"><span>Time:</span> ${lesson.time}</div>
                <div class="row"><span>Student:</span> ${lesson.name}</div>
                <div class="row"><span>Subject:</span> ${lesson.subject}</div>
            </div>
        `;

        card.addEventListener("click", () => {
            const isOpen = card.classList.contains("open");

            document.querySelectorAll(".card").forEach(c => c.classList.remove("open"));

            if (!isOpen) card.classList.add("open");
        });

        stack.appendChild(card);
    });

    
    // 4. General Notes – Sticky Notes
    
    const notesList = document.getElementById("notes-list");
    const noteInput = document.getElementById("new-note-input");
    const addNoteBtn = document.getElementById("add-note-btn");

    let notes = JSON.parse(localStorage.getItem("notes")) || [];

    function renderNotes() {
        notesList.innerHTML = "";

        notes.forEach((note, index) => {
            const li = document.createElement("li");
            li.classList.add("note-item");

            li.innerHTML = `
                <button class="delete-btn" data-index="${index}">✖</button>
                <button class="edit-btn" data-index="${index}">✎</button>
                <div>${note}</div>
            `;

            notesList.appendChild(li);
        });
    }

    renderNotes();

    addNoteBtn.addEventListener("click", function () {
        const text = noteInput.value.trim();
        if (text === "") return;

        notes.push(text);
        localStorage.setItem("notes", JSON.stringify(notes));
        noteInput.value = "";
        renderNotes();
    });

    noteInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            addNoteBtn.click();
        }
    });

    notesList.addEventListener("click", function (e) {

        // Delete

        if (e.target.classList.contains("delete-btn")) {
    const index = e.target.getAttribute("data-index");

    showConfirm("Are you sure you want to delete this note?", function(confirmDelete) {
        if (confirmDelete) {
            notes.splice(index, 1);
            localStorage.setItem("notes", JSON.stringify(notes));
            renderNotes();
        }
    });
}
        //delete function
        function showConfirm(message,callback){
            const modal = document.getElementById("confirm_modal");
            const modalText = document.getElementById("modal_text");
            const yesBtn = document.getElementById("confirm-yes");
            const noBtn = document.getElementById("confirm-no");

            modalText.textContent = message;
            modal.style.display = "flex";

            yesBtn.onclick = function (){
                modal.style.display = "none";
                callback(true);
            }
            noBtn.onclick = function() {
                modal.style.display = "none";
                callback(false);
            }

        }

        // Edit

        if (e.target.classList.contains("edit-btn")) {
            const index = e.target.getAttribute("data-index");
            const currentText = notes[index];

            editNote(currentText, function(result) {
        
        if (result !== null && result !== "") {
            notes[index] = result;
            localStorage.setItem("notes", JSON.stringify(notes));
            renderNotes();
        }
    });

            notes[index] = trimmed;
            localStorage.setItem("notes", JSON.stringify(notes));
            renderNotes();
        }
    });
        function editNote(currentText,callback){
            const modal = document.getElementById("edit_modal");
            const input = document.getElementById("edit_input");
            const saveBtn = document.getElementById("edit-save");
            const cancelBtn = document.getElementById("edit-cancel");

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
    
    // 5. Logout
  
    const logoutBtn = document.getElementById("logout-btn");
    logoutBtn.addEventListener("click", function () {
        localStorage.removeItem("loggedUser");
        window.location.href = "login.html";
    });

});
    function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleString('he-IL', {
        weekday: 'long',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      
    });

    document.getElementById("current-time").textContent = timeString;
}

setInterval(updateClock, 1000); // מרענן כל שנייה
updateClock(); // מריץ פעם ראשונה מיד
