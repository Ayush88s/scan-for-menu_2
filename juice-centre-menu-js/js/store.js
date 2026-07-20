/*
 * store.js
 * ---------------------------------------------------------------
 * Client-side "backend" for the Shri Ganesh Juice Centre menu.
 *
 * This static site has no server, so everything the original Flask
 * app kept in SQLite (menu items, about content/gallery, the admin
 * account) is kept in the browser's localStorage instead. Images
 * that ship with the site live under /assets/images/ and are
 * referenced by relative path; images an admin uploads later are
 * read as base64 data URLs and stored directly in localStorage
 * (there is no server filesystem to save them to).
 *
 * IMPORTANT SECURITY NOTE
 * The admin "login" here is a convenience gate, not real security.
 * Because this is a static site, anyone can view the source, open
 * dev tools, or read localStorage directly. Do not store anything
 * truly sensitive in this app. See README.md for details.
 * ---------------------------------------------------------------
 */

(function (window) {
    "use strict";

    const KEYS = {
        items: "jgc.menuItems",
        nextItemId: "jgc.menuItems.nextId",
        about: "jgc.about",
        aboutImages: "jgc.aboutImages",
        nextAboutImageId: "jgc.aboutImages.nextId",
        admin: "jgc.admin",
        seeded: "jgc.seeded.v1",
    };

    // Pages inside /admin/ need "../" to reach /assets or /index.html;
    // root pages need nothing. Each page sets this before loading
    // store.js is not required -- we detect it automatically.
    const SITE_ROOT = window.location.pathname.includes("/admin/") ? "../" : "";

    function resolveAsset(path) {
        if (!path) return "";
        if (path.startsWith("data:") || /^https?:\/\//i.test(path)) return path;
        return SITE_ROOT + path;
    }

    // ---------------------------------------------------------------
    // Low-level storage helpers
    // ---------------------------------------------------------------
    function readJSON(key, fallback) {
        try {
            const raw = window.localStorage.getItem(key);
            return raw === null ? fallback : JSON.parse(raw);
        } catch (error) {
            console.error(`Store: failed to read ${key}`, error);
            return fallback;
        }
    }

    function writeJSON(key, value) {
        window.localStorage.setItem(key, JSON.stringify(value));
    }

    function nowISO() {
        return new Date().toISOString();
    }

    function uid(prefix) {
        return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    }

    // ---------------------------------------------------------------
    // Seed data (mirrors the demo data that shipped in the original
    // SQLite database, so the converted site looks the same on first
    // load). Safe to delete/edit freely once the site is live.
    // ---------------------------------------------------------------
    function seedIfNeeded() {
        if (readJSON(KEYS.seeded, false)) return;

        const items = [
            { name: "mango", item_type: "Milkshake", price: 60, description: "", image: "assets/images/menu/5d49fa456d8748e78e94bc44e96d68fb.png", is_available: true },
            { name: "butterfruit", item_type: "Milkshake", price: 60, description: "", image: "assets/images/menu/087810835d47439e863dc8ffca4a1b4b.png", is_available: true },
            { name: "soda", item_type: "Soda", price: 40, description: "", image: "assets/images/menu/831a58a73cbe4f3cad9a4fa883578ac7.png", is_available: true },
            { name: "berry blast", item_type: "Juice", price: 50, description: "", image: "assets/images/menu/b6e9652e56cc486eb3645e01156a91b0.png", is_available: true },
            { name: "pomegranate", item_type: "Juice", price: 80, description: "", image: "assets/images/menu/0430d3249a054873af0831f0c8da01cd.png", is_available: true },
            { name: "choco fudge", item_type: "Ice Cream Milkshake", price: 200, description: "", image: "assets/images/menu/1875d5eafc0e4a5885af344a21e443fc.png", is_available: true },
            { name: "guava fizz", item_type: "Milkshake", price: 40, description: "", image: "assets/images/menu/fb14bb79ada44cc281ab0f0d8fa9193b.png", is_available: true },
        ];

        let nextId = 1;
        const seededItems = items.map((item) => {
            const record = {
                id: nextId++,
                name: item.name,
                item_type: item.item_type,
                price: Number(item.price),
                description: item.description || "",
                image: item.image || "",
                is_available: item.is_available,
                created_at: nowISO(),
                updated_at: nowISO(),
            };
            return record;
        });

        writeJSON(KEYS.items, seededItems);
        writeJSON(KEYS.nextItemId, nextId);

        writeJSON(KEYS.about, {
            heading: "NATURAL TASTE",
            content: "We make fresh juice with hygiene.",
            updated_at: nowISO(),
        });

        writeJSON(KEYS.aboutImages, [
            { id: 1, image: "assets/images/about/5fcbe58a631a46c1830cb68b7d6394e2.png", sort_order: 0 },
        ]);
        writeJSON(KEYS.nextAboutImageId, 2);

        writeJSON(KEYS.seeded, true);
    }

    // ---------------------------------------------------------------
    // Menu items
    // ---------------------------------------------------------------
    const MenuItems = {
        list() {
            const items = readJSON(KEYS.items, []);
            return [...items].sort((a, b) => {
                if (a.is_available !== b.is_available) return a.is_available ? -1 : 1;
                const nameCompare = a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
                if (nameCompare !== 0) return nameCompare;
                return a.id - b.id;
            });
        },

        listForDashboard(search) {
            const items = readJSON(KEYS.items, []);
            let result = [...items];
            if (search) {
                const term = search.trim().toLowerCase();
                result = result.filter((item) => item.name.toLowerCase().includes(term));
            }
            result.sort((a, b) => {
                const dateCompare = new Date(b.created_at) - new Date(a.created_at);
                if (dateCompare !== 0) return dateCompare;
                return b.id - a.id;
            });
            return result;
        },

        get(id) {
            const items = readJSON(KEYS.items, []);
            return items.find((item) => item.id === Number(id)) || null;
        },

        statistics() {
            const items = readJSON(KEYS.items, []);
            const available = items.filter((item) => item.is_available).length;
            return {
                total: items.length,
                available,
                unavailable: items.length - available,
            };
        },

        add(data) {
            const items = readJSON(KEYS.items, []);
            const nextId = readJSON(KEYS.nextItemId, 1);
            const record = {
                id: nextId,
                name: data.name.trim(),
                item_type: data.item_type,
                price: Number(data.price),
                description: (data.description || "").trim(),
                image: data.image || "",
                is_available: Boolean(data.is_available),
                created_at: nowISO(),
                updated_at: nowISO(),
            };
            items.push(record);
            writeJSON(KEYS.items, items);
            writeJSON(KEYS.nextItemId, nextId + 1);
            return record;
        },

        update(id, data) {
            const items = readJSON(KEYS.items, []);
            const index = items.findIndex((item) => item.id === Number(id));
            if (index === -1) return null;

            items[index] = {
                ...items[index],
                name: data.name.trim(),
                item_type: data.item_type,
                price: Number(data.price),
                description: (data.description || "").trim(),
                image: data.image !== undefined ? data.image : items[index].image,
                is_available: Boolean(data.is_available),
                updated_at: nowISO(),
            };
            writeJSON(KEYS.items, items);
            return items[index];
        },

        toggleAvailability(id) {
            const items = readJSON(KEYS.items, []);
            const index = items.findIndex((item) => item.id === Number(id));
            if (index === -1) return null;
            items[index].is_available = !items[index].is_available;
            items[index].updated_at = nowISO();
            writeJSON(KEYS.items, items);
            return items[index];
        },

        remove(id) {
            const items = readJSON(KEYS.items, []);
            const filtered = items.filter((item) => item.id !== Number(id));
            writeJSON(KEYS.items, filtered);
        },
    };

    // ---------------------------------------------------------------
    // About page content + gallery
    // ---------------------------------------------------------------
    const About = {
        getContent() {
            return readJSON(KEYS.about, { heading: "", content: "", updated_at: nowISO() });
        },

        updateContent({ heading, content }) {
            const record = {
                heading: (heading || "").trim(),
                content: (content || "").trim(),
                updated_at: nowISO(),
            };
            writeJSON(KEYS.about, record);
            return record;
        },

        listImages() {
            const images = readJSON(KEYS.aboutImages, []);
            return [...images].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
        },

        addImages(imageDataUrls) {
            const images = readJSON(KEYS.aboutImages, []);
            let nextId = readJSON(KEYS.nextAboutImageId, 1);
            const maxSort = images.reduce((max, image) => Math.max(max, image.sort_order), -1);

            const added = imageDataUrls.map((dataUrl, offset) => {
                const record = { id: nextId, image: dataUrl, sort_order: maxSort + 1 + offset };
                nextId += 1;
                return record;
            });

            writeJSON(KEYS.aboutImages, [...images, ...added]);
            writeJSON(KEYS.nextAboutImageId, nextId);
            return added;
        },

        removeImage(id) {
            const images = readJSON(KEYS.aboutImages, []);
            writeJSON(KEYS.aboutImages, images.filter((image) => image.id !== Number(id)));
        },
    };

    // ---------------------------------------------------------------
    // Admin auth (see security note at top of file)
    // ---------------------------------------------------------------
    async function hashPassword(password, saltHex) {
        const encoder = new TextEncoder();
        const data = encoder.encode(saltHex + ":" + password);
        const digest = await window.crypto.subtle.digest("SHA-256", data);
        return Array.from(new Uint8Array(digest))
            .map((byte) => byte.toString(16).padStart(2, "0"))
            .join("");
    }

    function randomSalt() {
        const bytes = new Uint8Array(16);
        window.crypto.getRandomValues(bytes);
        return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, "0")).join("");
    }

    const Auth = {
        hasAdmin() {
            return readJSON(KEYS.admin, null) !== null;
        },

        async createAdmin(username, password) {
            const salt = randomSalt();
            const passwordHash = await hashPassword(password, salt);
            writeJSON(KEYS.admin, { username: username.trim(), salt, passwordHash });
        },

        async verify(username, password) {
            const admin = readJSON(KEYS.admin, null);
            if (!admin) return false;
            if (admin.username !== username.trim()) return false;
            const candidateHash = await hashPassword(password, admin.salt);
            return candidateHash === admin.passwordHash;
        },

        adminUsername() {
            const admin = readJSON(KEYS.admin, null);
            return admin ? admin.username : null;
        },

        login(username) {
            window.sessionStorage.setItem("jgc.session", username);
        },

        logout() {
            window.sessionStorage.removeItem("jgc.session");
        },

        isLoggedIn() {
            const admin = readJSON(KEYS.admin, null);
            const session = window.sessionStorage.getItem("jgc.session");
            return Boolean(admin && session && session === admin.username);
        },

        requireLogin(loginPath) {
            if (!this.isLoggedIn()) {
                window.location.href = loginPath;
            }
        },
    };

    // ---------------------------------------------------------------
    // Image file -> data URL helper (used by admin forms)
    // ---------------------------------------------------------------
    function fileToDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });
    }

    seedIfNeeded();

    window.Store = {
        MenuItems,
        About,
        Auth,
        resolveAsset,
        fileToDataURL,
        ITEM_TYPES: ["Juice", "Milkshake", "Ice Cream Milkshake", "Soda", "Other"],
        ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
    };
})(window);
