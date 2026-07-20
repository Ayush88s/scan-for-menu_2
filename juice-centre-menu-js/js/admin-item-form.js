document.addEventListener("DOMContentLoaded", () => {
    AdminUI.requireLogin();

    const pageTitle = document.querySelector("#page-title");
    const formHeading = document.querySelector("#form-heading");
    const formSubheading = document.querySelector("#form-subheading");
    const submitButton = document.querySelector("#submit-button");
    const flashStack = document.querySelector("#flash-stack");
    const form = document.querySelector("#item-form");

    const nameInput = document.querySelector("#name");
    const typeSelect = document.querySelector("#item_type");
    const priceInput = document.querySelector("#price");
    const descriptionInput = document.querySelector("#description");
    const imageInput = document.querySelector("#image");
    const availableInput = document.querySelector("#is_available");
    const imagePreview = document.querySelector("#image-preview");
    const imagePlaceholder = document.querySelector("#image-preview-placeholder");
    const uploadFileName = document.querySelector("#upload-file-name");

    window.Store.ITEM_TYPES.forEach((type) => {
        const option = document.createElement("option");
        option.value = type;
        option.textContent = type;
        typeSelect.append(option);
    });

    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get("id");
    const existingItem = itemId ? window.Store.MenuItems.get(itemId) : null;
    const isEdit = Boolean(existingItem);
    let pendingImageDataUrl = undefined; // undefined = unchanged, null = cleared, string = new image

    if (isEdit) {
        pageTitle.textContent = "Edit Menu Item | Shri Ganesh Juice Centre";
        formHeading.textContent = "Edit Menu Item";
        formSubheading.textContent = "Update the item details shown on your digital menu.";
        submitButton.textContent = "Save Changes";

        nameInput.value = existingItem.name;
        typeSelect.value = existingItem.item_type;
        priceInput.value = Number(existingItem.price).toFixed(2);
        descriptionInput.value = existingItem.description || "";
        availableInput.checked = Boolean(existingItem.is_available);

        if (existingItem.image) {
            imagePreview.src = window.Store.resolveAsset(existingItem.image);
            imagePreview.alt = `Current image for ${existingItem.name}`;
            imagePreview.hidden = false;
            imagePlaceholder.hidden = true;
        }
    } else if (itemId) {
        // An id was given but no such item exists.
        window.location.href = "dashboard.html";
        return;
    }

    imageInput.addEventListener("change", async () => {
        const file = imageInput.files?.[0];
        clearFieldError("image");
        if (!file) return;

        if (!window.Store.ALLOWED_IMAGE_TYPES.includes(file.type)) {
            showFieldError("image", "Invalid image format. Use JPG, JPEG, PNG, or WEBP.");
            imageInput.value = "";
            return;
        }

        pendingImageDataUrl = await window.Store.fileToDataURL(file);
        imagePreview.src = pendingImageDataUrl;
        imagePreview.alt = `Preview of ${file.name}`;
        imagePreview.hidden = false;
        imagePlaceholder.hidden = true;
        uploadFileName.textContent = file.name;
    });

    function showFieldError(field, message) {
        const el = form.querySelector(`[data-error-for="${field}"]`);
        if (!el) return;
        el.textContent = message;
        el.hidden = false;
    }

    function clearFieldError(field) {
        const el = form.querySelector(`[data-error-for="${field}"]`);
        if (!el) return;
        el.textContent = "";
        el.hidden = true;
    }

    function clearAllErrors() {
        form.querySelectorAll("[data-error-for]").forEach((el) => {
            el.textContent = "";
            el.hidden = true;
        });
    }

    function validate() {
        clearAllErrors();
        let valid = true;

        if (!nameInput.value.trim()) {
            showFieldError("name", "This field is required.");
            valid = false;
        } else if (nameInput.value.trim().length > 120) {
            showFieldError("name", "Item name must be at most 120 characters.");
            valid = false;
        }

        const priceValue = Number(priceInput.value);
        if (priceInput.value === "" || Number.isNaN(priceValue) || priceValue < 0) {
            showFieldError("price", "Enter a valid price of 0 or more.");
            valid = false;
        }

        if (descriptionInput.value.length > 2000) {
            showFieldError("description", "Description must be at most 2,000 characters.");
            valid = false;
        }

        return valid;
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        flashStack.innerHTML = "";

        if (!validate()) {
            return;
        }

        const payload = {
            name: nameInput.value,
            item_type: typeSelect.value,
            price: Number(priceInput.value).toFixed(2),
            description: descriptionInput.value,
            is_available: availableInput.checked,
        };

        if (pendingImageDataUrl !== undefined) {
            payload.image = pendingImageDataUrl;
        }

        if (isEdit) {
            window.Store.MenuItems.update(existingItem.id, payload);
            setPendingFlashAndRedirect("Menu item updated successfully.");
        } else {
            window.Store.MenuItems.add(payload);
            setPendingFlashAndRedirect("Menu item added successfully.");
        }
    });

    function setPendingFlashAndRedirect(message) {
        window.sessionStorage.setItem("jgc.pendingFlash", JSON.stringify({ message, type: "success" }));
        window.location.href = "dashboard.html";
    }
});
