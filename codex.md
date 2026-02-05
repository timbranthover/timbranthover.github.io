# Codex Notes – timbranthover.github.io

## Project snapshot
- **Purpose:** Single-page “Forms Library” web app for searching accounts, selecting forms, packaging signers, and tracking work items.
- **Stack:** Static HTML + React (UMD) + Babel in-browser; Tailwind via CDN. No bundler.
- **Entry point:** `index.html` loads all data, config, service, and component scripts in order.

## Key files & structure
- `index.html` — Loads React, Tailwind, data, services, components, and `app.js`.
- `app.js` — App root: view routing, search, toasts, confetti easter egg, localStorage for work items.
- `data/forms.js` — Form metadata (codes, names, flags like `docuSignEnabled`).
- `data/mockData.js` — Mock accounts and history used for demo flows.
- `config/docusignConfig.js` — DocuSign configuration values.
- `services/docusignService.js` — DocuSign integration helpers.
- `components/` — UI views and form components.

## App views (high level)
- **Landing/Search** — Account lookup.
- **Results** — Display account data and available forms.
- **My Work** — Drafts + in-progress items, resend/void/download actions.
- **Package** — Form completion, signer selection, sending, and draft save.
- **Forms Library** — Form browsing list.

## State & data flow
- **`App` state:** `view`, `currentAccount`, `selectedForms`, `draftData`, `searchError`, `toast`, `confetti`, `workItems`.
- **Persistence:** `workItems` stored in `localStorage` under `formsLibrary_workItems`.
- **DocuSign:** `handleSendForSignature` checks `docuSignEnabled` per form; uses `DocuSignService` to send envelope.

## UX patterns already in use
- Toasts for status messages (App + Package + My Work).
- Confetti easter egg (Konami code).
- Draft saving and resuming via `My Work`.

## Conventions
- **No build step:** Keep changes compatible with in-browser Babel and React UMD.
- **Tailwind utility classes** are used for styling.
- **Component scripts** are loaded directly in `index.html` in dependency order.

## Common tasks
- **Add a form:** Update `data/forms.js` + matching form component in `components/forms/`.
- **Add a new view:** Create a component and conditionally render it in `app.js`.
- **Adjust DocuSign behavior:** Update `services/docusignService.js` or config.

## Areas to be careful with
- **Script order in `index.html`:** Maintain load order for globals.
- **localStorage:** Ensure JSON parse/stringify safety and key consistency.
- **Static hosting:** Avoid server-only features; keep changes client-only.

## Future improvement ideas (small)
- Remember last search or view in `localStorage`.
- Add tiny UI affordances (copy buttons, badges, or chips).
- Improve empty states for lists.
