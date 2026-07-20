/*
 * admin-common.js
 * Shared helpers used across every /admin/ page: flash messages,
 * delete confirmations, logout, and image file previews.
 */

const AdminUI = (function () {
    function flashIcon(type) {
        if (type === "success") {
            return '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="7"></circle><path d="m6.5 10 2.2 2.2 4.8-5"></path></svg>';
        }
        return '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="7"></circle><path d="M10 6.5v4M10 13.5h.01"></path></svg>';
    }

    function showFlash(container, message, type = "info") {
        if (!container) return;
        const flash = document.createElement("div");
        flash.className = `flash flash-${type}`;
        flash.setAttribute("role", "status");
        flash.innerHTML = `
            <span class="flash-icon" aria-hidden="true">${flashIcon(type)}</span>
            <span></span>
            <button type="button" class="flash-dismiss" data-dismiss-flash aria-label="Dismiss notification">&times;</button>`;
        flash.querySelector("span:nth-child(2)").textContent = message;
        container.append(flash);
        bindFlashDismiss(flash);
    }

    function bindFlashDismiss(scope) {
        (scope || document).querySelectorAll("[data-dismiss-flash]").forEach((button) => {
            button.addEventListener("click", () => {
                const flash = button.closest(".flash");
                if (!flash) return;
                flash.classList.add("is-dismissing");
                window.setTimeout(() => flash.remove(), 180);
            });
        });
    }

    function bindDeleteConfirm(scope) {
        (scope || document).querySelectorAll("[data-confirm-delete]").forEach((form) => {
            form.addEventListener("submit", (event) => {
                const itemName = form.dataset.itemName || "this item";
                if (!window.confirm(`Are you sure you want to delete ${itemName}?`)) {
                    event.preventDefault();
                }
            });
        });
    }

    function bindLogout(scope) {
        (scope || document).querySelectorAll("[data-logout]").forEach((button) => {
            button.addEventListener("click", () => {
                window.Store.Auth.logout();
                window.location.href = "login.html";
            });
        });
    }

    function requireLogin() {
        window.Store.Auth.requireLogin("login.html");
    }

    return { showFlash, bindFlashDismiss, bindDeleteConfirm, bindLogout, requireLogin };
})();
