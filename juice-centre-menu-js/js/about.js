document.addEventListener("DOMContentLoaded", () => {
    const pageTitle = document.querySelector("#page-title");
    const headingEl = document.querySelector("#about-heading");
    const leadEl = document.querySelector("#about-lead");
    const galleryEl = document.querySelector("#about-gallery");

    if (!headingEl || !leadEl || !galleryEl) {
        return;
    }

    const aboutContent = window.Store.About.getContent();
    const aboutImages = window.Store.About.listImages();

    if (aboutContent.heading) {
        headingEl.textContent = aboutContent.heading;
        headingEl.hidden = false;
        pageTitle.textContent = `${aboutContent.heading} | Shri Ganesh Juice Centre`;
    } else {
        pageTitle.textContent = "Shri Ganesh Juice Centre";
    }

    leadEl.textContent = aboutContent.content;

    if (aboutImages.length > 0) {
        galleryEl.hidden = false;
        aboutImages.forEach((image, index) => {
            const figure = document.createElement("figure");
            figure.className = "about-gallery-item";
            figure.style.setProperty("--gallery-index", index);

            const img = document.createElement("img");
            img.src = window.Store.resolveAsset(image.image);
            img.alt = `${aboutContent.heading || "Shri Ganesh Juice Centre"} gallery image ${index + 1}`;
            img.loading = "lazy";

            figure.append(img);
            galleryEl.append(figure);
        });
    }
});
