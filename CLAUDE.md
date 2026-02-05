# CLAUDE.md

## Project Overview

**Forms Library** -- a client-facing prototype for financial advisors to search accounts, select forms, fill them out, assign signers, and send for e-signature via DocuSign. Built as a single-page React application hosted on GitHub Pages.

This is a **prototype / demo application** using mock data and a real DocuSign sandbox integration. There is no backend server, no build step, and no bundler. It runs entirely in the browser via CDN-loaded React 18 + Babel transpilation. API calls to DocuSign are routed through a Cloudflare Worker to bypass CORS.

## Tech Stack

- **React 18** (UMD via unpkg CDN)
- **ReactDOM 18** (UMD via unpkg CDN)
- **Babel Standalone** (in-browser JSX transpilation via `type="text/babel"` scripts)
- **Tailwind CSS** (CDN, `cdn.tailwindcss.com`)
- **jsrsasign** (CDN, for JWT signing in the DocuSign auth flow)
- **pdf-lib** (CDN UMD via unpkg -- fills PDF AcroForm fields in-browser before upload to DocuSign)
- **Inter font** (Google Fonts)
- **Cloudflare Worker** (external CORS proxy for DocuSign API calls -- not in this repo)
- No build system. No npm. No bundler. No package.json.

## Repository Structure

```
/
├── index.html              # Entry point -- loads all scripts and renders <div id="root">
├── app.js                  # Root <App> component, view routing state machine
├── assets/
│   └── LA-GEN-PDF.pdf      # Source PDF for LA-GEN -- AcroForm fields filled at send time via pdf-lib
├── config/
│   └── docusignConfig.js   # DOCUSIGN_CONFIG -- keys, IDs, proxy URL, RSA private key
├── services/
│   └── docusignService.js  # DocuSignService -- JWT auth, send/status/void/resend/download
├── components/
│   ├── Header.js           # Top nav bar with "My Work" button
│   ├── SearchView.js       # Landing page: account search + AI form suggestion
│   ├── ResultsView.js      # Form selection grid with fuzzy search
│   ├── PackageView.js      # Form fill + signer assignment sidebar + signing order + send/save
│   ├── MyWorkView.js       # Tabbed work queue: Drafts / In Progress / Completed / Voided
│   ├── SaveDraftModal.js   # Modal for naming and saving a draft
│   ├── FormsLibraryView.js # Browse all 20 forms with detail panel
│   └── forms/
│       ├── ACTFform.js     # ACAT Account Transfer Form (AC-TF)
│       ├── ACFTform.js     # EFT Authorization Form (AC-FT)
│       ├── CLACRAform.js   # Advisory Relationship Application (CL-ACRA)
│       └── LAGENform.js    # Generic Letter of Authorization (LA-GEN)
└── data/
    ├── mockData.js         # MOCK_ACCOUNTS, MOCK_HISTORY, MOCK_DRAFT_DATA, AI_SUGGESTIONS
    └── forms.js            # FORMS_DATA -- the full catalog of 20 form definitions
```

## Architecture

### No Build System
All files are plain `.js` with JSX, transpiled in-browser by Babel Standalone. Scripts are loaded in dependency order via `<script type="text/babel" src="...">` tags in `index.html`. **Load order matters** -- data files first, then config, then services, then components bottom-up, then `app.js` last.

### View Routing
`app.js` manages a simple state machine with `useState('landing')`:
- `landing` -- SearchView (account lookup + AI suggestion)
- `results` -- ResultsView (form selection for an account)
- `package` -- PackageView (fill forms, assign signers, send/save)
- `work` -- MyWorkView (tabbed work queue)
- `formsLibrary` -- FormsLibraryView (browse all 20 forms)

Navigation is prop-driven (`onBack`, `onSearch`, `onContinue`, etc.). No router library.

### Component Pattern
Every component is a **top-level `const` function component** (not exported, not in modules). Components communicate via props passed down from `App`. State is managed with `React.useState` and `React.useEffect` -- no external state library.

### Data Pattern
All data lives in global `const` variables (`MOCK_ACCOUNTS`, `FORMS_DATA`, `MOCK_HISTORY`, `AI_SUGGESTIONS`) loaded before components. Components reference these globals directly. Accounts are keyed by account number string (e.g., `"ABC123"`).

### Persistence
Work items (drafts, in-progress, completed, voided) are persisted to `localStorage` under the key `formsLibrary_workItems`. On load, `app.js` reads from localStorage and falls back to `MOCK_HISTORY` (which is empty by default). Every state change to `workItems` is auto-saved via a `useEffect`.

### DocuSign Integration
Real e-signature sending is enabled for any form with `docuSignEnabled: true` in its `FORMS_DATA` definition. Currently enabled: **AC-TF, AC-FT, CL-ACRA** (template path) and **LA-GEN** (PDF fill path). All other forms go straight to My Work as in-progress items without hitting DocuSign. There is no account-level gate -- any mock account can trigger an envelope.

**Common preamble (both paths):**
1. `app.js` checks `shouldUseDocuSign` -- iterates the selected forms and returns true if any has `docuSignEnabled: true` in `FORMS_DATA`
2. A `signers` array is built from the selected signers. Each signer's email is resolved from the **dropdown selection** in the sidebar (`signerDetails`), falling back to `emails[0]`. Each signer gets a `routingOrder` value equal to their position in the signing order. Sequential signing is always on when 2+ signers are selected -- this is a legal requirement; there is no parallel code path.
3. The array is sorted by `routingOrder` before sending.
4. `app.js` checks whether the matched form has a `pdfPath`. If yes → PDF fill path. If no → template path.

**Path A -- Template (AC-TF, AC-FT, CL-ACRA):**
- `DocuSignService.sendEnvelope()` creates an envelope using `templateId` + `templateRoles`. Form field data typed in the UI is **not** sent to DocuSign; the DocuSign template controls document layout and field placement.
- `textTabs` can be used to pre-fill sender-side fields on the template, keyed by `tabLabel`.

**Path B -- PDF fill + document upload (LA-GEN):**
- `DocuSignService.sendDocumentEnvelope()` fetches the source PDF from `pdfPath`, loads it with pdf-lib, fills its AcroForm fields from `formData` using the mapping in `pdfFieldMap`, flattens the form into static page content, base64-encodes the result, and uploads it as a raw document to DocuSign.
- Form field data IS sent -- it is baked into the PDF before upload. The signer sees pre-filled values.
- Signature placement is done via `signHereTabs` at coordinates from `signaturePosition` (DocuSign coordinate system: y=0 at top of page).
- The envelope requires `emailSubject` (not `subject`) -- document-upload envelopes do not inherit a default subject from a template.

**FORMS_DATA config fields that drive Path B:**
- `pdfPath` -- relative path to the source PDF asset (e.g. `'assets/LA-GEN-PDF.pdf'`)
- `pdfFieldMap` -- maps form state keys to PDF AcroForm field names and types. Types: `text`, `checkbox`, `dropdown`. Field names must match the PDF's internal AcroForm names exactly (including any special characters -- the LA-GEN PDF has a tab character in `'Age\t of Dependent'`).
- `signaturePosition` -- `{ x, y, page }` for `signHereTabs` placement

**Common tail:**
5. All API calls route through a Cloudflare Worker proxy (configured in `DOCUSIGN_CONFIG.proxyUrl`) to bypass browser CORS restrictions.
6. The envelope ID is stored on the work item for live status polling, void, resend, and PDF download.

`DocuSignService` exposes: `sendEnvelope`, `sendDocumentEnvelope`, `getEnvelopeStatus`, `voidEnvelope`, `resendEnvelope`, `downloadDocument`.

### Signing Order
Sequential signing is **always on** when 2+ signers are selected -- this is a legal requirement. There is no parallel-signing toggle, UI option, or code path. Every signer receives a `routingOrder` equal to their position; the array is sorted before the envelope is created.

The UI shows a numbered badge next to each selected signer with up/down reorder buttons. Order is maintained across signer add/remove (new signers append to the end). The order is passed up to `app.js` via `packageData.signerOrder`. `packageData.sequentialSigning` is always `true` when there are 2+ signers.

### Styling
100% Tailwind utility classes. No custom CSS files. The only `<style>` block sets Inter as the body font. Follow the existing Tailwind class conventions -- primary blue is `blue-600`/`blue-700`, backgrounds are `gray-50`, cards use `bg-white rounded-lg shadow-sm border border-gray-200`.

## Development Workflow

### Running Locally
No install needed. Open `index.html` in a browser, or serve with any static server:
```bash
npx serve .
# or
python3 -m http.server
```

### Pull Requests
**Always open a PR** for every feature or fix branch. Never merge directly to main. The PR body should summarise what changed and why.

### Deploying
Push to `main` on `timbranthover.github.io`. GitHub Pages serves it automatically. No build step required.

### Case Sensitivity
GitHub Pages is **case-sensitive**. File paths in `index.html` script tags and asset references must match the actual filenames exactly (e.g., `./assets/logo.png`, not `Logo.PNG`).

## Conventions & Standards

### Code Style
- **Functional components only** -- no classes, no hooks libraries
- **`React.useState` / `React.useEffect`** -- always fully qualified (no destructured imports since there are no modules)
- **Inline SVG icons** -- no icon library; all icons are hand-written `<svg>` elements with Heroicon-style paths
- **Tailwind only** -- no inline `style={}` except for rare dynamic values (e.g., progress bar width percentages)
- **No semicolons** in JSX returns; standard semicolons in logic blocks
- **Toast notifications** for user feedback instead of `alert()` -- use slide-in toasts with auto-dismiss. Each component that needs feedback has its own `toast` state + auto-dismiss `useEffect` + toast JSX block (see PackageView or MyWorkView for the pattern).

### UI Patterns
- **Conditional visibility, not conditional rendering** -- when a UI element appearing or disappearing would change its container's dimensions (e.g., a CTA button in a flex header row, order-number badges in signer rows), do **not** use `{condition && <Element />}`. Always render the element and toggle visibility with `opacity-0 pointer-events-none` ↔ `opacity-100`. Add `transition-opacity duration-150` for a smooth fade. This prevents layout shifts. Established in: ResultsView "Continue" CTA row, PackageView signer-order badges and reorder arrows.
- **Disabled primary CTA with hover tooltip** -- when a primary action button must be blocked until a precondition is met (e.g., Send for Signature waiting for required signers), wrap it in `<div className="relative group">`. Apply `pointer-events-none` to the button itself so the wrapper receives hover events even when the button is native-`disabled`. Style the disabled state as `bg-blue-100 text-blue-400` (keeps brand color, clearly inactive). Render the tooltip as an absolutely-positioned sibling that fades in on `group-hover:opacity-100` with a dark semi-transparent background (`bg-gray-900 bg-opacity-90`) and a CSS-border arrow. See PackageView "Send for Signature" for the canonical example.
- **Character-limited inputs with live counter** -- inputs with a hard character cap (draft name: 40 chars; Personal Message: 150 chars) slice in `onChange`, state the limit in the inline help text, and show a live `N/limit` counter aligned to the right of that same help row. The counter turns `text-amber-600` at the cap. See SaveDraftModal and PackageView custom-message textarea.

### Adding a New Form
1. Create `components/forms/YourForm.js` following the pattern in `ACTFform.js` or `ACFTform.js`
2. Add its `<script>` tag in `index.html` **before** `PackageView.js` (it must be loaded first)
3. Add a `case` in `PackageView.js` `renderFormComponent()` switch statement
4. Add the form definition to `data/forms.js` (`FORMS_DATA` array)
5. If the form should route through DocuSign, set `docuSignEnabled: true` on its entry in `FORMS_DATA`

### Adding a New Account
Add an entry to `MOCK_ACCOUNTS` in `data/mockData.js`. Key is the account number string. Each account has: `accountNumber`, `accountName`, `accountType`, and a `signers` array. Each signer has `id`, `name`, `role`, `emails[]`, and `phones[]`.

### Adding a New View
1. Add a new state value in the `view` state machine in `app.js`
2. Add a conditional render block in the `App` return JSX
3. Wire navigation via props (`onBack`, etc.)

### Extending DocuSign
- To enable DocuSign for a form, set `docuSignEnabled: true` on its definition in `data/forms.js`. That's it -- no code changes elsewhere. The gate in `app.js` reads the flag automatically.
- **Template path:** The DocuSign template ID is in `DOCUSIGN_CONFIG.templateId` (global fallback) or on the form definition (`templateId`). Template role names follow the pattern `Signer`, `Signer2`, `Signer3`, etc. If you change the template, update role names to match.
- **PDF fill path:** To wire a new form for PDF fill, add a PDF to `assets/`, then add `pdfPath`, `pdfFieldMap`, and `signaturePosition` to its entry in `FORMS_DATA`. The presence of `pdfPath` is what routes the send to `sendDocumentEnvelope` -- no other code changes needed. To extract AcroForm field names from a PDF, use Python (`PyPDF2` or decompress `/Contents` streams) or inspect in a PDF editor. Field names must match byte-for-byte (watch for tab characters and trailing spaces).
- To add new API operations, add methods to `DocuSignService` in `services/docusignService.js` using `_buildApiUrl()` and ensure the Cloudflare Worker supports any new HTTP methods.

## Key Design Decisions

- **No build tooling by design** -- this is a rapid prototype meant to be immediately editable and deployable with zero setup friction. Do not introduce npm, webpack, vite, or any bundler.
- **Global script loading** -- all components and data are globals. This is intentional for the CDN-React architecture. Do not refactor into ES modules unless the entire architecture is being migrated.
- **Mock data is the "backend"** -- all account lookups, form catalogs, and work history are in-memory JS objects. Keep mock data realistic and consistent (real-ish form codes, plausible account structures).
- **Dynamic account lookup** -- `handleSearch` in `app.js` looks up accounts from `MOCK_ACCOUNTS` by normalized (trimmed, uppercased) account number. New accounts just need to be added to the map.
- **Signer logic per form** -- `requiresAllSigners` on each form definition controls whether the PackageView enforces selecting all account signers or just one. Independently, `docuSignEnabled` controls whether the form triggers a real DocuSign envelope.
- **Signer email is dropdown-driven** -- the per-signer email selector in PackageView is not cosmetic. The selected email is what gets sent to DocuSign. This is resolved via `signerDetails` in the send payload.
- **CORS proxy via Cloudflare Worker** -- browser-to-DocuSign API calls are blocked by CORS. A Cloudflare Worker (free tier) proxies requests, routing `/oauth/*` to `account-d.docusign.com` and `/restapi/*` to `demo.docusign.net`. The worker URL is set in `DOCUSIGN_CONFIG.proxyUrl`.
- **localStorage for persistence** -- work items survive page reloads via localStorage. No server-side storage.
- **Dual send paths** -- template-based forms (AC-TF, AC-FT, CL-ACRA) use DocuSign templates where layout and fields are managed in DocuSign's template editor. PDF-fill forms (LA-GEN) use pdf-lib to fill a source PDF in-browser before uploading it as a raw document. The branch point is the presence of `pdfPath` on the form definition -- no conditional logic elsewhere.
- **Form data handling depends on path** -- for template-based forms, data typed in the UI stays client-side; the template controls the document. For PDF-fill forms, data is baked into the PDF before upload and the signer sees it.
- **pdf-lib flatten quirks** -- pdf-lib 1.17.1's `flatten()` does not update dropdown field appearances before flattening. The stale default appearance must be deleted manually (`acroField.dictionary.delete('AP')`) before flatten is called, or both the old default and new value render on the page. `form.updateTextFieldAppearances()` does not exist in this version. `flatten({ updateFieldAppearances: true })` is silently ignored.

## What NOT to Do

- Do not add a package.json, node_modules, or build step
- Do not convert to ES modules or add import/export statements
- Do not add external component libraries (Material UI, Ant Design, etc.)
- Do not remove or rename the Tailwind CDN approach
- Do not add a router library -- the view state machine is sufficient
- Do not introduce TypeScript -- this is plain JSX transpiled by Babel Standalone
- Do not hardcode account data in components -- always reference `MOCK_ACCOUNTS`
- Do not commit real API keys or production DocuSign credentials -- current keys are for the demo sandbox only
- Do not use `alert()` for user feedback -- use toast notifications instead
- Do not gate DocuSign by account number -- the gate is form-level via `docuSignEnabled` in `FORMS_DATA`
- Do not use `subject` on document-upload envelopes -- DocuSign's REST API expects `emailSubject` for the notification email subject line and `emailBlurb` for the body. `subject` is silently ignored.
- Do not rely on `flatten({ updateFieldAppearances: true })` -- it is silently ignored in pdf-lib 1.17.1. Handle dropdown appearance clearing manually before flatten.
