document.addEventListener("DOMContentLoaded", function () {
    // Get login form and error message element after page is loaded

    const form = document.querySelector(".login-form");
    const errorMsg = document.getElementById("error-msg");

    // Handle login form submit
    form.addEventListener("submit", function (e) {
        e.preventDefault(); // prevent page reload

        // Read user input values
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();

        // Reset error message
        errorMsg.style.display = "none";
        errorMsg.textContent = "";

        // Check if one of the fields is empty
        if (username === "" || password === "") {
            errorMsg.textContent = "אנא מלא שם משתמש וסיסמה";
            errorMsg.style.display = "block";
            return;
        }
        const correctUser = "teacher";
        const correctPass = "1234";

        // Check username and password
        if (username === correctUser && password === correctPass) {
            // Save logged in user to localStorage
            localStorage.setItem("loggedUser", username);
            window.location.href = "home.html";
        } else {
            // Show error message if login failed
            errorMsg.textContent = "שם משתמש או סיסמה שגויים";
            errorMsg.style.display = "block";
        }
    });
});
