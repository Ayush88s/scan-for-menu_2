document.addEventListener("DOMContentLoaded", () => {
    const flashStack = document.querySelector("#flash-stack");
    const panelEyebrow = document.querySelector("#panel-eyebrow");
    const panelCopy = document.querySelector("#panel-copy");
    const loginForm = document.querySelector("#login-form");
    const setupForm = document.querySelector("#setup-form");

    if (window.Store.Auth.isLoggedIn()) {
        window.location.href = "dashboard.html";
        return;
    }

    if (window.Store.Auth.hasAdmin()) {
        loginForm.hidden = false;
    } else {
        panelEyebrow.textContent = "First-time setup";
        panelCopy.textContent = "No admin account exists yet on this device. Create one to manage the menu.";
        setupForm.hidden = false;
    }

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const username = loginForm.username.value.trim();
        const password = loginForm.password.value;

        const ok = await window.Store.Auth.verify(username, password);
        if (!ok) {
            flashStack.innerHTML = "";
            AdminUI.showFlash(flashStack, "Invalid username or password.", "error");
            return;
        }

        window.Store.Auth.login(username);
        window.location.href = "dashboard.html";
    });

    setupForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const username = setupForm.username.value.trim();
        const password = setupForm.password.value;
        const confirmPassword = setupForm.password_confirm.value;

        flashStack.innerHTML = "";

        if (password !== confirmPassword) {
            AdminUI.showFlash(flashStack, "Passwords do not match.", "error");
            return;
        }
        if (password.length < 6) {
            AdminUI.showFlash(flashStack, "Password must be at least 6 characters.", "error");
            return;
        }

        await window.Store.Auth.createAdmin(username, password);
        window.Store.Auth.login(username);
        window.location.href = "dashboard.html";
    });
});
