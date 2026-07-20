document.addEventListener("DOMContentLoaded", () => {
    AdminUI.requireLogin();

    const flashStack = document.querySelector("#flash-stack");
    const contentForm = document.querySelector("#content-form");
    const headingInput = document.querySelector("#heading");
    const contentInput = document.querySelector("#content");

    const imagesForm = document.querySelector("#images-form");
    const imagesInput = document.querySelector("#images");
    const selectedPreviews = document.querySelector("#about-selected-previews");
    const uploadFileName = document.querySelector("#about-upload-file-name");

    const galleryWrap = document.querySelector("#about-admin-gallery");
    const galleryEmpty = document.querySelector("#about-gallery-empty");
    const imageCount = document.querySelector("#about-image-count");

    function loadContent() {
        const content = window.Store.About.getContent();
        headingInput.value = content.heading || "";
        contentInput.value = content.content || "";
    }

    function clearFieldError(field) {
        const el = document.querySelector(`[data-error-for="${field}"]`);
        if (!el) return;
        el.textContent = "";
        el.hidden = true;
    }

    function showFieldError(field, message) {
        const el = document.querySelector(`[data-error-for="${field}"]`);
        if (!el) return;
        el.textContent = message;
        el.hidden = false;
    }

    contentForm.addEventListener("submit", (event) => {
        event.preventDefault();
        flashStack.innerHTML = "";
        clearFieldError("content");

        if (!contentInput.value.trim()) {
            showFieldError("content", "This field is required.");
            return;
        }
        if (contentInput.value.length > 5000) {
            showFieldError("content", "Content must be at most 5,000 characters.");
            return;
        }

        window.Store.About.updateContent({
            heading: headingInput.value,
            content: contentInput.value,
        });
        AdminUI.showFlash(flashStack, "About content updated successfully.", "success");
    });

    let selectedFiles = [];

    imagesInput.addEventListener("change", () => {
        selectedFiles = Array.from(imagesInput.files || []);
        selectedPreviews.innerHTML = "";
        clearFieldError("images");

        uploadFileName.textContent = selectedFiles.length
            ? `${selectedFiles.length} image${selectedFiles.length === 1 ? "" : "s"} selected`
            : "JPG, JPEG, PNG or WEBP";

        selectedFiles.forEach((file) => {
            const preview = document.createElement("div");
            preview.className = "about-selected-preview";
            const img = document.createElement("img");
            img.src = URL.createObjectURL(file);
            img.alt = `Preview of ${file.name}`;
            preview.append(img);
            selectedPreviews.append(preview);
        });
        selectedPreviews.classList.toggle("has-files", selectedFiles.length > 0);
    });

    imagesForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        flashStack.innerHTML = "";
        clearFieldError("images");

        if (selectedFiles.length === 0) {
            showFieldError("images", "Select at least one image.");
            return;
        }

        const invalid = selectedFiles.find((file) => !window.Store.ALLOWED_IMAGE_TYPES.includes(file.type));
        if (invalid) {
            showFieldError("images", "Invalid image format. Use JPG, JPEG, PNG, or WEBP.");
            return;
        }

        const dataUrls = await Promise.all(selectedFiles.map((file) => window.Store.fileToDataURL(file)));
        window.Store.About.addImages(dataUrls);

        const count = dataUrls.length;
        AdminUI.showFlash(flashStack, `${count} About image${count !== 1 ? "s" : ""} uploaded successfully.`, "success");

        selectedFiles = [];
        imagesInput.value = "";
        selectedPreviews.innerHTML = "";
        selectedPreviews.classList.remove("has-files");
        uploadFileName.textContent = "JPG, JPEG, PNG or WEBP";

        renderGallery();
    });

    function renderGallery() {
        const images = window.Store.About.listImages();
        galleryWrap.innerHTML = "";
        imageCount.textContent = `${images.length} image${images.length !== 1 ? "s" : ""}`;
        galleryEmpty.hidden = images.length > 0;

        images.forEach((image, index) => {
            const card = document.createElement("article");
            card.className = "about-admin-image-card";

            const img = document.createElement("img");
            img.className = "about-admin-image";
            img.src = window.Store.resolveAsset(image.image);
            img.alt = `About gallery image ${index + 1}`;

            const deleteButton = document.createElement("button");
            deleteButton.className = "button button-danger";
            deleteButton.type = "button";
            deleteButton.textContent = "Delete";
            deleteButton.addEventListener("click", () => {
                if (!window.confirm("Are you sure you want to delete this About image?")) {
                    return;
                }
                window.Store.About.removeImage(image.id);
                flashStack.innerHTML = "";
                AdminUI.showFlash(flashStack, "About image deleted successfully.", "success");
                renderGallery();
            });

            card.append(img, deleteButton);
            galleryWrap.append(card);
        });
    }

    loadContent();
    renderGallery();
});
