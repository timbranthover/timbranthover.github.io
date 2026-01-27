# README.md

## Project Overview

** Forms Library** -- a client-facing prototype for financial advisors to search accounts, select forms, fill them out, assign signers, and send for e-signature. Built as a single-page React application hosted on GitHub Pages.

This is a **prototype / demo application** using mock data. There is no backend, no build step, and no bundler. It runs entirely in the browser via CDN-loaded React 18 + Babel transpilation.

## Tech Stack

- **React 18** (UMD via unpkg CDN)
- **ReactDOM 18** (UMD via unpkg CDN)
- **Babel Standalone** (in-browser JSX transpilation via `type="text/babel"` scripts)
- **Tailwind CSS** (CDN, `cdn.tailwindcss.com`)
- **Inter font** (Google Fonts)
- No build system. No npm. No bundler. No package.json.

## Repository Structure

```
/
├── index.html              # Entry point -- loads all scripts and renders <div id="root">
├── app.js                  # Root <App> component, view routing state machine
├── assets/
│   └── ubs_logo.png        # Header logo
├── components/
│   ├── Header.js           # Top nav bar with UBS logo + "My Work" button
│   ├── SearchView.js       # Landing page: account search + AI form suggestion
│   ├── ResultsView.js      # Form selection grid with fuzzy search
│   ├── PackageView.js      # Form fill + signer assignment sidebar + send/save actions
│   ├── MyWorkView.js       # Tabbed work queue: Drafts / In Progress / Completed / Voided
│   ├── SaveDraftModal.js   # Modal for naming and saving a draft
│   └── forms/
│       ├── ACTFform.js     # ACAT Account Transfer Form (AC-TF)
│       └── ACFTform.js     # EFT Authorization Form (AC-FT)
└── data/
    ├── mockData.js         # MOCK_ACCOUNTS, MOCK_HISTORY, MOCK_DRAFT_DATA, AI_SUGGESTIONS
    └── forms.js            # FORMS_DATA -- the full catalog of 20 form definitions
```

## Architecture

### No Build System
All files are plain `.js` with JSX, transpiled in-browser by Babel Standalone. Scripts are loaded in dependency order via `<script type="text/babel" src="...">` tags in `index.html`. **Load order matters** -- data files first, then components bottom-up, then `app.js` last.

### View Routing
`app.js` manages a simple state machine with `useState('landing')`:
- `landing` -- SearchView (account lookup + AI suggestion)
- `results` -- ResultsView (form selection for an account)
- `package` -- PackageView (fill forms, assign signers, send/save)
- `work` -- MyWorkView (tabbed work queue)

Navigation is prop-driven (`onBack`, `onSearch`, `onContinue`, etc.). No router library.

### Component Pattern
Every component is a **top-level `const` function component** (not exported, not in modules). Components communicate via props passed down from `App`. State is managed with `React.useState` and `React.useEffect` -- no external state library.

### Data Pattern
All data lives in global `const` variables (`MOCK_ACCOUNTS`, `FORMS_DATA`, `MOCK_HISTORY`, `AI_SUGGESTIONS`) loaded before components. Components reference these globals directly. Accounts are keyed by account number string (e.g., `"1B92008"`).

### Styling
100% Tailwind utility classes. No custom CSS files. The only `<style>` block sets Inter as the body font. Follow the existing Tailwind class conventions -- UBS blue is `blue-600`/`blue-700`, backgrounds are `gray-50`, cards use `bg-white rounded-lg shadow-sm border border-gray-200`.

## Development Workflow

### Running Locally
No install needed. Open `index.html` in a browser, or serve with any static server:
```bash
npx serve .
# or
python3 -m http.server
```

### Deploying
Push to `main` on `timbranthover.github.io`. GitHub Pages serves it automatically. No build step required.

### Case Sensitivity
GitHub Pages is **case-sensitive**. File paths in `index.html` script tags and asset references must match the actual filenames exactly (e.g., `./assets/ubs_logo.png`, not `UBS_Logo.PNG`).

## Conventions & Standards

### Code Style
- **Functional components only** -- no classes, no hooks libraries
- **`React.useState` / `React.useEffect`** -- always fully qualified (no destructured imports since there are no modules)
- **Inline SVG icons** -- no icon library; all icons are hand-written `<svg>` elements with Heroicon-style paths
- **Tailwind only** -- no inline `style={}` except for rare dynamic values (e.g., progress bar width percentages)
- **No semicolons** in JSX returns; standard semicolons in logic blocks

### Adding a New Form
1. Create `components/forms/YourForm.js` following the pattern in `ACTFform.js` or `ACFTform.js`
2. Add its `<script>` tag in `index.html` **before** `PackageView.js` (it must be loaded first)
3. Add a `case` in `PackageView.js` `renderFormComponent()` switch statement
4. Add the form definition to `data/forms.js` (`FORMS_DATA` array)

### Adding a New Account
Add an entry to `MOCK_ACCOUNTS` in `data/mockData.js`. Key is the account number string. Each account has: `accountNumber`, `accountName`, `accountType`, and a `signers` array. Each signer has `id`, `name`, `role`, `emails[]`, and `phones[]`.

### Adding a New View
1. Add a new state value in the `view` state machine in `app.js`
2. Add a conditional render block in the `App` return JSX
3. Wire navigation via props (`onBack`, etc.)

## Key Design Decisions

- **No build tooling by design** -- this is a rapid prototype meant to be immediately editable and deployable with zero setup friction. Do not introduce npm, webpack, vite, or any bundler.
- **Global script loading** -- all components and data are globals. This is intentional for the CDN-React architecture. Do not refactor into ES modules unless the entire architecture is being migrated.
- **Mock data is the "backend"** -- all account lookups, form catalogs, and work history are in-memory JS objects. Keep mock data realistic and consistent (real-ish form codes, plausible account structures).
- **Dynamic account lookup** -- `handleSearch` in `app.js` looks up accounts from `MOCK_ACCOUNTS` by normalized (trimmed, uppercased) account number. New accounts just need to be added to the map.
- **Signer logic per form** -- `requiresAllSigners` on each form definition controls whether the PackageView enforces selecting all account signers or just one.

## What NOT to Do

- Do not add a package.json, node_modules, or build step
- Do not convert to ES modules or add import/export statements
- Do not add external component libraries (Material UI, Ant Design, etc.)
- Do not remove or rename the Tailwind CDN approach
- Do not add a router library -- the view state machine is sufficient
- Do not introduce TypeScript -- this is plain JSX transpiled by Babel Standalone
- Do not hardcode account data in components -- always reference `MOCK_ACCOUNTS`
