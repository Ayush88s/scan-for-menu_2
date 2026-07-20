# Shri Ganesh Juice Centre — Static JS Menu

This is a JavaScript conversion of the original Flask + SQLite app, built so
it can be hosted for free on **GitHub Pages** (or any static host). The look
and feel is unchanged — same HTML structure, same CSS, same interactions.
What changed is *how data is stored*, because a static host can't run Python,
SQL, or a login server.

## What changed under the hood

| Original (Flask) | This version |
|---|---|
| SQLite database | Browser `localStorage` |
| Server-side sessions | `sessionStorage` (per-tab, clears on close) |
| Password hash checked on server | Password hash (SHA-256) checked in the browser |
| Uploaded images saved to disk | Uploaded images stored as base64 data URLs in `localStorage` |
| `flask run` | Open `index.html`, or serve the folder statically |

## ⚠️ Please read: this is a demo-grade admin login, not real security

Because everything runs in the visitor's own browser with no server:

- Anyone can open dev tools and read `localStorage`, including the admin's
  username and password hash.
- Anyone can view the JavaScript source.
- There is **no real access control** — a determined visitor could edit
  their own browser's storage to see admin pages, even without the password
  (the pages don't hide *content* from a technical user, they just don't
  show a *link* to it and prompt for a password).
- **Each browser/device has its own separate data.** Menu changes you make
  as admin on your laptop won't show up for a customer on their phone,
  because there's no shared server or database. This works as a live editable
  demo on one device, or as a way to prepare a menu and then treat the
  `localStorage` state as your "content," but it is **not** a real multi-user
  admin system.

If you need a real admin panel with a shared database that customers
actually see updates from, you'd need real hosting with a backend (e.g. the
original Flask app on a host like Render/Railway/Fly.io, or a rebuild on a
backend-as-a-service like Supabase/Firebase). Happy to help with that if
you'd like — just say so.

## First-time setup

1. Open `admin/login.html` (or click "Manage About Page"/log in link you
   add to your own nav, since the public pages don't link to `/admin/` by
   design — same as the original app).
2. Since no admin account exists yet, you'll see a **"Create admin
   account"** form instead of a login form. Pick a username and password.
3. You're now logged in for this browser tab (closing the tab logs you out,
   matching the original session-cookie behavior).

## Running locally

Just opening `index.html` with a double-click works in most browsers, but
some browsers restrict `localStorage`/`fetch` on `file://` URLs. It's safer
to serve the folder, e.g.:

```bash
cd juice-centre-menu-js
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploying to GitHub Pages

1. Create a new GitHub repository and push this folder's contents to it
   (this folder should be the repo root, or the docs folder — see below).
2. In the repo, go to **Settings → Pages**.
3. Under "Build and deployment", choose **Deploy from a branch**, pick your
   default branch (e.g. `main`) and the `/ (root)` folder.
4. Save. GitHub will give you a URL like
   `https://<your-username>.github.io/<repo-name>/` within a minute or two.
5. Visit that URL — `index.html` loads automatically as the homepage.

No build step, bundler, or `npm install` is needed — it's plain HTML/CSS/JS.

## File map

```
index.html              Customer-facing menu (was customer_menu.html)
about.html               Public About page
admin/login.html          Admin login / first-run setup
admin/dashboard.html      Admin dashboard (stats, item table, search)
admin/item-form.html      Add / edit a menu item (?id=<n> to edit)
admin/about.html           Edit About content + image gallery
css/style.css              Public site styles (unchanged from original)
css/admin.css               Admin styles (unchanged from original)
js/store.js                  Data layer: localStorage-backed items/about/auth
js/menu.js, js/about.js       Public page rendering + interactions
js/admin-*.js                  Admin page logic
assets/images/                 Seed images carried over from the original DB
```

## Resetting the demo data

Open your browser's dev tools console on any page of the site and run:

```js
localStorage.clear();
location.reload();
```

This restores the original seed menu items and About content.
