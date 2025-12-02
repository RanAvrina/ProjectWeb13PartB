document.querySelector("form").addEventListener("submit", function(e) {
    e.preventDefault(); // לא לרענן את הדף

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    // בדיקה ששדות מלאים
    if (username === "" || password === "") {
        alert("אנא מלא שם משתמש וסיסמה");
        return;
    }

    // התחברות לדוגמה בלבד
    const correctUser = "teacher";
    const correctPass = "1234";

    if (username === correctUser && password === correctPass) {

        // שמירת שם המשתמש לשימוש בעמוד הבא
        localStorage.setItem("loggedUser", username);

        // מעבר לעמוד הבית
        window.location.href = "home.html";

    } else {
        alert("שם משתמש או סיסמה שגויים");
    }
    document.querySelector("form").addEventListener("submit", function(e) {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const errorMsg = document.getElementById("error-msg");

    // מנקה הודעות קודמות
    errorMsg.style.display = "none";
    errorMsg.textContent = "";

    // בדיקה שהשדות מלאים
    if (username === "" || password === "") {
        errorMsg.textContent = "אנא מלא שם משתמש וסיסמה";
        errorMsg.style.display = "block";
        return;
    }

    // לדוגמה בלבד
    const correctUser = "teacher";
    const correctPass = "1234";

    if (username === correctUser && password === correctPass) {

        localStorage.setItem("loggedUser", username);
        window.location.href = "home.html";

    } else {
        errorMsg.textContent = "שם משתמש או סיסמה שגויים";
        errorMsg.style.display = "block";
    }
});

});
