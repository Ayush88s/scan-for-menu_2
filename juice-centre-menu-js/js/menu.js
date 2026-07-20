document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.querySelector("#menu-search");
    const searchClear = document.querySelector("#search-clear");
    const searchShell = document.querySelector(".search-shell");
    const typeFiltersWrap = document.querySelector("#type-filters");
    const menuGrid = document.querySelector("#menu-grid");
    const noResults = document.querySelector("#no-results");
    const emptyStateTitle = document.querySelector("#empty-state-title");
    const emptyStateCopy = document.querySelector("#empty-state-copy");
    const resultCount = document.querySelector("#result-count");
    const siteHeader = document.querySelector("#site-header");
    const modal = document.querySelector("#item-modal");
    const modalClose = document.querySelector("#modal-close");
    const modalImage = document.querySelector("#modal-image");
    const modalImagePlaceholder = document.querySelector("#modal-image-placeholder");
    const modalName = document.querySelector("#modal-name");
    const modalType = document.querySelector("#modal-type");
    const modalPrice = document.querySelector("#modal-price");
    const modalDescriptionWrap = document.querySelector("#modal-description-wrap");
    const modalDescription = document.querySelector("#modal-description");
    const modalAvailability = document.querySelector("#modal-availability");
    const modalAvailabilityText = document.querySelector("#modal-availability-text");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!searchInput || !noResults || !modal || !modalClose || !menuGrid) {
        return;
    }

    const items = window.Store.MenuItems.list();
    const filterTypes = ["All", "Juice", "Milkshake", "Ice Cream Milkshake", "Soda", "Other"];
    let activeFilter = "All";
    let previouslyFocusedElement = null;

    function formatPrice(price) {
        return `\u20B9${Number(price).toFixed(2)}`;
    }

    function renderFilterButtons() {
        typeFiltersWrap.innerHTML = "";
        filterTypes.forEach((type) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = `filter-button${type === "All" ? " active" : ""}`;
            button.dataset.filter = type;
            button.setAttribute("aria-pressed", type === "All" ? "true" : "false");
            button.innerHTML = `<span>${type}</span>`;
            typeFiltersWrap.append(button);
        });
    }

    function cardImageMarkup(item) {
        if (item.image) {
            return `<img class="menu-card-image" src="${window.Store.resolveAsset(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy">`;
        }
        return `
            <div class="image-placeholder" aria-label="No image available">
                <svg viewBox="0 0 64 64" aria-hidden="true">
                    <path d="M20 18h27l-3 36H23l-3-36Z"></path>
                    <path d="M17 18h33M37 18l7-10M27 29c5-4 9 4 15 0"></path>
                    <circle cx="17" cy="11" r="5"></circle>
                </svg>
                <span>Fresh photo coming soon</span>
            </div>`;
    }

    function escapeHtml(value) {
        const div = document.createElement("div");
        div.textContent = value ?? "";
        return div.innerHTML;
    }

    function renderCards() {
        menuGrid.innerHTML = "";
        items.forEach((item, index) => {
            const card = document.createElement("article");
            card.className = `menu-card${item.is_available ? "" : " unavailable"}`;
            card.dataset.name = item.name;
            card.dataset.itemType = item.item_type;
            card.style.setProperty("--card-index", index);
            card.tabIndex = 0;
            card.setAttribute("role", "button");
            card.setAttribute("aria-haspopup", "dialog");
            card.setAttribute("aria-label", `View details for ${item.name}`);

            card.innerHTML = `
                <div class="card-image-wrap">
                    ${cardImageMarkup(item)}
                    <p class="availability-badge">
                        <span class="availability-dot" aria-hidden="true"></span>
                        ${item.is_available ? "Available" : "Unavailable"}
                    </p>
                </div>
                <div class="card-content">
                    <p class="menu-item-type">${escapeHtml(item.item_type)}</p>
                    <h3 class="menu-item-name">${escapeHtml(item.name)}</h3>
                    <div class="card-footer">
                        <p class="menu-item-price"><span>\u20B9</span>${Number(item.price).toFixed(2)}</p>
                        <span class="view-item" aria-hidden="true">
                            <svg viewBox="0 0 20 20"><path d="M4 10h12M11 5l5 5-5 5"></path></svg>
                        </span>
                    </div>
                    ${item.description ? `<span class="menu-item-description" hidden>${escapeHtml(item.description)}</span>` : ""}
                </div>`;

            card.addEventListener("click", () => openModal(card));
            card.addEventListener("keydown", (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openModal(card);
                }
            });

            menuGrid.append(card);
        });

        if (items.length === 0) {
            emptyStateTitle.textContent = "No drinks available right now.";
            emptyStateCopy.textContent = "Please check back soon for something fresh.";
        }
    }

    function updateSearchState() {
        const hasValue = searchInput.value.length > 0;
        searchShell?.classList.toggle("has-value", hasValue);
        if (searchClear) {
            searchClear.hidden = !hasValue;
        }
    }

    function applyFilters() {
        const searchTerm = searchInput.value.trim().toLocaleLowerCase();
        const menuCards = [...menuGrid.querySelectorAll(".menu-card")];
        let visibleCount = 0;

        menuCards.forEach((card) => {
            const name = card.dataset.name.toLocaleLowerCase();
            const matchesSearch = name.includes(searchTerm);
            const matchesType = activeFilter === "All" || card.dataset.itemType === activeFilter;
            const shouldShow = matchesSearch && matchesType;

            card.hidden = !shouldShow;
            if (shouldShow) {
                visibleCount += 1;
            }
        });

        noResults.hidden = visibleCount !== 0;
        if (items.length > 0) {
            emptyStateTitle.textContent = "No matching drinks found.";
            emptyStateCopy.textContent = "Try another search or choose a different drink type.";
        }
        if (resultCount) {
            resultCount.textContent = `${visibleCount} ${visibleCount === 1 ? "drink" : "drinks"}`;
        }
        updateSearchState();
    }

    searchInput.addEventListener("input", applyFilters);
    searchClear?.addEventListener("click", () => {
        searchInput.value = "";
        applyFilters();
        searchInput.focus();
    });

    function bindFilterButtons() {
        const filterButtons = [...document.querySelectorAll(".filter-button")];
        filterButtons.forEach((button) => {
            button.addEventListener("click", () => {
                activeFilter = button.dataset.filter;

                filterButtons.forEach((candidate) => {
                    const isActive = candidate === button;
                    candidate.classList.toggle("active", isActive);
                    candidate.setAttribute("aria-pressed", String(isActive));
                });

                button.scrollIntoView({
                    behavior: prefersReducedMotion ? "auto" : "smooth",
                    block: "nearest",
                    inline: "center",
                });
                applyFilters();
            });
        });
    }

    function openModal(card) {
        const cardImage = card.querySelector(".menu-card-image");
        const description = card.querySelector(".menu-item-description")?.textContent.trim() || "";
        const availability = card.querySelector(".availability-badge").textContent.trim();

        previouslyFocusedElement = document.activeElement;
        modalName.textContent = card.querySelector(".menu-item-name").textContent.trim();
        modalType.textContent = card.querySelector(".menu-item-type").textContent.trim();
        modalPrice.textContent = card.querySelector(".menu-item-price").textContent.trim();
        modalAvailabilityText.textContent = availability;
        modalAvailability.classList.toggle("unavailable", availability === "Unavailable");

        modalDescription.textContent = description;
        modalDescriptionWrap.hidden = description === "";

        if (cardImage) {
            modalImage.src = cardImage.src;
            modalImage.alt = cardImage.alt;
            modalImage.hidden = false;
            modalImagePlaceholder.hidden = true;
        } else {
            modalImage.removeAttribute("src");
            modalImage.alt = "";
            modalImage.hidden = true;
            modalImagePlaceholder.hidden = false;
        }

        modal.hidden = false;
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");
        window.requestAnimationFrame(() => modal.classList.add("is-open"));
        modalClose.focus();
    }

    function closeModal() {
        if (modal.hidden) {
            return;
        }

        modal.classList.remove("is-open");
        document.body.classList.remove("modal-open");

        window.setTimeout(() => {
            if (!modal.classList.contains("is-open")) {
                modal.hidden = true;
                modal.setAttribute("aria-hidden", "true");
                modalImage.removeAttribute("src");
                previouslyFocusedElement?.focus();
            }
        }, prefersReducedMotion ? 0 : 260);
    }

    modalClose.addEventListener("click", closeModal);
    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !modal.hidden) {
            closeModal();
        }
        if (event.key === "Tab" && !modal.hidden) {
            event.preventDefault();
            modalClose.focus();
        }
    });

    if (siteHeader) {
        const updateHeader = () => siteHeader.classList.toggle("scrolled", window.scrollY > 12);
        window.addEventListener("scroll", updateHeader, { passive: true });
        updateHeader();
    }

    renderFilterButtons();
    renderCards();
    bindFilterButtons();
    applyFilters();
});
