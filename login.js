document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("login-form");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const rememberCheckbox = document.getElementById("remember");
    const loginMessage = document.getElementById("login-message");

    const savedUsername = localStorage.getItem("rememberUsername");

    if (savedUsername && usernameInput && rememberCheckbox) {
        usernameInput.value = savedUsername;
        rememberCheckbox.checked = true;
    }

    if (loginForm) {
        loginForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const username = usernameInput.value.trim();
            const password = passwordInput.value;

            if (username === "admin" && password === "admin123") {
                sessionStorage.setItem("isLoggedIn", "true");

                if (rememberCheckbox.checked) {
                    localStorage.setItem("rememberUsername", username);
                } else {
                    localStorage.removeItem("rememberUsername");
                }

                window.location.href = "index.html";
                return;
            }

            const accounts = JSON.parse(
                localStorage.getItem("salamenceAccounts") || "[]"
            );

            const account = accounts.find(function (account) {
                return (
                    account.username.toLowerCase() === username.toLowerCase() &&
                    account.password === password
                );
            });

            if (account) {
                sessionStorage.setItem("isLoggedIn", "true");

                if (rememberCheckbox.checked) {
                    localStorage.setItem("rememberUsername", username);
                } else {
                    localStorage.removeItem("rememberUsername");
                }

                window.location.href = "index.html";
            } else {
                loginMessage.textContent =
                    "Invalid username or password.";
                loginMessage.style.color = "red";
            }
        });
    }
});
