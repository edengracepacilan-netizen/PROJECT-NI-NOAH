document.addEventListener("DOMContentLoaded", function () {
    const registerForm = document.getElementById("register-form");
    const registerMessage = document.getElementById("register-message");

    registerForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const username = document.getElementById("new-username").value.trim();
        const email = document.getElementById("new-email").value.trim();
        const password = document.getElementById("new-password").value;
        const confirmPassword = document.getElementById("confirm-password").value;


        if (!username || !email || !password || !confirmPassword) {
            registerMessage.style.color = "red";
            registerMessage.textContent = "Please fill in all fields.";
            return;
        }

        if (password !== confirmPassword) {
            registerMessage.style.color = "red";
            registerMessage.textContent = "Passwords do not match.";
            return;
        }

        const accounts = JSON.parse(
            localStorage.getItem("salamenceAccounts") || "[]"
        );

        const exists = accounts.some(function (account) {
            return (
                account.username.toLowerCase() === username.toLowerCase() ||
                account.email.toLowerCase() === email.toLowerCase()
            );
        });

        if (exists) {
            registerMessage.style.color = "red";
            registerMessage.textContent = "Username or email already exists.";
            return;
        }

        accounts.push({
            username: username,
            email: email,
            password: password
        });

        localStorage.setItem(
            "salamenceAccounts",
            JSON.stringify(accounts)
        );

        registerMessage.style.color = "green";
        registerMessage.textContent =
            "Account created successfully! You can now sign in.";

        registerForm.reset();
    });
});
