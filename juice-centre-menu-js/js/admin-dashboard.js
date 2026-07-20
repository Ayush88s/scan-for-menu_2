document.addEventListener("DOMContentLoaded", () => {
    AdminUI.requireLogin();

    const accountAvatar = document.querySelector("#account-avatar");
    const accountUsername = document.querySelector("#account-username");
    const flashStack = document.querySelector("#flash-stack");
    const statTotal = document.querySelector("#stat-total");
    const statAvailable = document.querySelector("#stat-available");
    const statUnavailable = document.querySelector("#stat-unavailable");
    const itemsCountCopy = document.querySelector("#items-count-copy");
    const tableBody = document.querySelector("#menu-table-body");
    const searchForm = document.querySelector("#search-form");
    const searchInput = document.querySelector("#q");
    const searchReset = document.querySelector("#search-reset");

    const username = window.Store.Auth.adminUsername() || "";
    accountAvatar.textContent = username.charAt(0).toUpperCase();
    accountUsername.textContent = username;

    AdminUI.bindLogout();

    function consumePendingFlash() {
        const raw = window.sessionStorage.getItem("jgc.pendingFlash");
        if (!raw) return;
        window.sessionStorage.removeItem("jgc.pendingFlash");
        try {
            const { message, type } = JSON.parse(raw);
            AdminUI.showFlash(flashStack, message, type);
        } catch (error) {
            console.error("Could not parse pending flash", error);
        }
    }

    function escapeHtml(value) {
        const div = document.createElement("div");
        div.textContent = value ?? "";
        return div.innerHTML;
    }

    function imageCellMarkup(item) {
        if (item.image) {
            return `<img class="item-thumbnail" src="${window.Store.resolveAsset(item.image)}" alt="${escapeHtml(item.name)}">`;
        }
        return `
            <span class="thumbnail-placeholder" aria-label="No image">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4z"></path><circle cx="9" cy="10" r="2"></circle><path d="m5 17 4-4 3 3 2-2 5 4"></path></svg>
            </span>`;
    }

    function renderTable() {
        const search = (searchInput.value || "").trim();
        const items = window.Store.MenuItems.listForDashboard(search);
        const stats = window.Store.MenuItems.statistics();

        statTotal.textContent = stats.total;
        statAvailable.textContent = stats.available;
        statUnavailable.textContent = stats.unavailable;
        itemsCountCopy.textContent = `${stats.total} item${stats.total === 1 ? "" : "s"} in your menu`;
        searchReset.hidden = !search;

        tableBody.innerHTML = "";

        if (items.length === 0) {
            const row = document.createElement("tr");
            row.className = "empty-table-row";
            row.innerHTML = `
                <td colspan="6">
                    <span class="empty-table-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 5h16v14H4zM8 9h8M8 13h5"></path></svg></span>
                    <strong>No menu items found</strong>
                    <p>${search ? "Try clearing your search." : "Add your first item to begin building the menu."}</p>
                </td>`;
            tableBody.append(row);
            return;
        }

        items.forEach((item) => {
            const row = document.createElement("tr");
            row.className = "menu-row";
            row.innerHTML = `
                <td class="image-cell" data-label="Image">${imageCellMarkup(item)}</td>
                <td class="name-cell" data-label="Name"><strong>${escapeHtml(item.name)}</strong><small>Menu item #${item.id}</small></td>
                <td class="type-cell" data-label="Type"><span class="type-badge">${escapeHtml(item.item_type)}</span></td>
                <td class="price-cell" data-label="Price"><strong>&#8377;${Number(item.price).toFixed(2)}</strong></td>
                <td class="status-cell" data-label="Status">
                    <span class="status-badge ${item.is_available ? "status-available" : "status-unavailable"}"><span></span>${item.is_available ? "Available" : "Unavailable"}</span>
                </td>
                <td class="actions-cell" data-label="Actions">
                    <div class="row-actions">
                        <a class="action-button action-edit" href="item-form.html?id=${item.id}">
                            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m13.5 4.5 2 2-8.5 8.5-3 .5.5-3 9-8Z"></path></svg><span>Edit</span>
                        </a>
                        <button class="action-button action-toggle" type="button" data-toggle-id="${item.id}">
                            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 6h8a4 4 0 0 1 0 8H6a4 4 0 0 1 0-8Z"></path><circle cx="${item.is_available ? 14 : 6}" cy="10" r="2"></circle></svg>
                            <span>${item.is_available ? "Mark Unavailable" : "Mark Available"}</span>
                        </button>
                        <button class="action-button action-delete" type="button" data-delete-id="${item.id}" data-item-name="${escapeHtml(item.name)}">
                            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 6h12M8 3h4l1 3H7l1-3ZM6 6l1 11h6l1-11"></path></svg><span>Delete</span>
                        </button>
                    </div>
                </td>`;
            tableBody.append(row);
        });

        tableBody.querySelectorAll("[data-toggle-id]").forEach((button) => {
            button.addEventListener("click", () => {
                window.Store.MenuItems.toggleAvailability(button.dataset.toggleId);
                flashStack.innerHTML = "";
                AdminUI.showFlash(flashStack, "Availability updated.", "success");
                renderTable();
            });
        });

        tableBody.querySelectorAll("[data-delete-id]").forEach((button) => {
            button.addEventListener("click", () => {
                const itemName = button.dataset.itemName || "this menu item";
                if (!window.confirm(`Are you sure you want to delete ${itemName}?`)) {
                    return;
                }
                window.Store.MenuItems.remove(button.dataset.deleteId);
                flashStack.innerHTML = "";
                AdminUI.showFlash(flashStack, "Menu item deleted successfully.", "success");
                renderTable();
            });
        });
    }

    searchForm.addEventListener("submit", (event) => {
        event.preventDefault();
        renderTable();
    });

    searchReset.addEventListener("click", (event) => {
        event.preventDefault();
        searchInput.value = "";
        renderTable();
    });

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("q")) {
        searchInput.value = urlParams.get("q");
    }

    consumePendingFlash();
    AdminUI.bindFlashDismiss(flashStack);
    renderTable();
});
