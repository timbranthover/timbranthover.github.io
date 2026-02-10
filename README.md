# Forms Library

A prototype for financial advisors to search accounts, select forms, fill package data, assign signers, and send for eSign/DocuSign.

**Live site:** [timbranthover.github.io](https://timbranthover.github.io)

## Quick Start

No install needed. Serve with any static file server:

```bash
npx serve .
# or
python3 -m http.server
```

Then open `http://localhost:3000` (or `:8000` for Python).

To deploy, push to `main` (GitHub Pages auto-deploys).

## Admin Mode Access (Prototype)

Admin mode is controlled by URL query flag and stored in browser localStorage.

Enable admin:
- `http://localhost:3000/index.html?admin=pm`
- `http://localhost:3000/index.html?admin=admin`
- `http://localhost:3000/index.html?admin=true`
- `http://localhost:3000/index.html?admin=1`
- On any deployed URL, append `?admin=pm` to the page URL you are currently using.

Disable admin:
- `http://localhost:3000/index.html?admin=off`
- `http://localhost:3000/index.html?admin=false`
- `http://localhost:3000/index.html?admin=0`

After enabling, the header shows:
- `Admin mode` badge
- `Admin` button (left of `My work`)

Admin route:
- `/#admin` opens Admin workspace for admin users.
- Non-admin users are redirected to landing and shown an access-required toast.

## How It Works

### App Flow
1. Landing page has:
- `Search by account`
- account card status pills (`saved forms`, `eSign-enabled forms`)
- `Need help finding the right form?`
- `Quick start` actions (`Resume last draft`, `Open saved forms`)
- expandable `Other search options` with `General forms search` and `Saved forms`
2. Account search flow:
- Enter account/UAN (example: `ABC123`)
- Select forms in account context
- Continue to package
3. General forms search flow:
- Search all 100 forms with fuzzy matching
- Forms that are not eSign-enabled or not valid for the entered account type stay visible but are disabled
- Select one or more forms that are both eSign-enabled and account-eligible
- Enter account/UAN for package
- Footer counters show `Total forms`, `eSign enabled`, and `Eligible for entered account`
- Continue to package from that screen
4. Saved forms flow:
- Save/unsave forms from General forms search detail panel
- Open `Saved forms` from landing page
- Saved forms follow the same account-type eligibility + eSign selection rules
- Select eligible saved forms and continue to package
5. Package flow:
- Fill form fields
- Assign signers (and reorder signer routing when multiple signers are selected)
- Sequential signing is enforced automatically when 2+ signers are selected
- Optional personal message (150 char limit)
- Send for signature or save draft
6. My work:
- Track Drafts / In progress / Completed / Voided
7. Admin flow (admin users only):
- Open Admin from header
- Left panel: scrollable forms catalog
- Right panel: add/edit form metadata
- Edit and save landing-page operations update text
- Changes persist locally and update runtime search/catalog immediately

### Forms Search (Fuse.js)
`services/formsSearch.js` powers weighted fuzzy search using Fuse.js plus domain-specific typo normalization.

Search relevance is weighted across:
- form code
- name
- short description
- long description
- keywords

Behavior highlights:
- typo tolerance (example: `Account trnfer` still ranks `AC-TF`)
- ranking tuned for finite form catalogs where names are similar
- capped top results for broad queries to avoid noisy overload
- runtime index rebuild when admin updates form catalog (no reload required)

### Account-Type Eligibility Rules

Forms now support account-type eligibility using `validAccountTypeKeys`.

Supported account type keys:
- `RMA_INDIVIDUAL`
- `RMA_JOINT`
- `TRUST`
- `IRA_ROTH`
- `IRA_TRADITIONAL`

Selection behavior:
- A form is selectable only when `eSignEnabled === true`.
- A form is selectable only when account type is included in `validAccountTypeKeys`.
- Ineligible forms stay visible with disabled state and reason text.
- If account input changes, invalid selected forms are auto-removed from selection state.

### Admin Workspace

Admin workspace is a prototype control plane for forms and operations messaging.

Capabilities:
- Add new forms (validated required fields and limits)
- Edit existing forms
- Keyword chip input
- Account-type eligibility editor
- eSign / DocuSign flags
- Optional template ID / PDF path
- Attachment placeholder (stores filename only, no upload backend)
- Operations update editor with preview + save + revert-to-default

UI highlights:
- Header shows persistent `Admin mode` badge when enabled.
- Forms catalog + form editor are combined in a single card with internal divider.
- Forms catalog scrolls in place for rapid click-to-edit.
- Save actions show toast notifications.

### DocuSign Integration
Real DocuSign send is enabled for forms with `docuSignEnabled: true` in `data/forms.js`.

Currently enabled:
- `AC-TF`, `AC-FT`, `CL-ACRA` (template mode)
- `LA-GEN` (PDF fill mode)

Send modes:
- Template mode: creates envelope from DocuSign template.
- PDF fill mode: fills `assets/LA-GEN-PDF.pdf` via `pdf-lib`, flattens it, uploads as raw document.

Routing:
- If a form has `pdfPath`, PDF fill mode is used.
- Otherwise template mode is used.

Common pipeline:
- browser signs JWT (RS256 via `jsrsasign`)
- JWT exchanged for OAuth token
- DocuSign REST API v2.1 called via Cloudflare Worker proxy
- token cached for ~55 minutes

The Cloudflare Worker URL is configured in `config/docusignConfig.js` (`proxyUrl`).

### Data Persistence
localStorage keys used by the app:
- `formsLibrary_workItems` -> My Work data (draft/in-progress/completed/voided)
- `formsLibrary_savedFormCodes` -> saved form codes for Saved Forms
- `formsLibrary_userRole` -> current role flag (`admin` when enabled)
- `formsLibrary_adminFormsCatalog` -> admin-edited forms catalog
- `formsLibrary_operationsUpdate` -> admin-edited landing operations callout

Both persist across refreshes.

---

## Test Flows

### Flow 1: Home Screen Sanity
1. Open landing page.
2. Verify operations callout banner appears (`Operations update`).
3. Verify side-by-side cards render:
- `Search by account`
- `Need help finding the right form?`
4. Verify account card pills render (`saved forms`, `eSign-enabled forms`).
5. Verify `Quick start` renders:
- `Resume last draft` (disabled if no drafts)
- `Open saved forms`
6. Expand `Other search options`.
7. Verify links for `General forms search` and `Saved forms`.

### Flow 2: General Forms Search Fuzzy Matching
1. Landing -> `Other search options` -> `General forms search`.
2. Verify no query shows all forms.
3. Search `Account trnfer`.
4. Verify `AC-TF` appears at/near top.
5. Search by code fragment (example: `ac-tf`) and keyword (example: `ira`) to confirm ranking.

### Flow 3: Continue to Package from General Forms Search
1. Open `General forms search`.
2. Select one or more eSign-enabled forms (checkbox on row).
3. Enter valid account/UAN (example: `ABC123`).
4. Click `Continue with X form(s)`.
5. Verify navigation to package flow with selected forms.

### Flow 4: Save and Unsave Forms
1. In `General forms search`, expand a row.
2. Click `Save` bookmark action in detail panel.
3. Verify label changes to `Saved`.
4. Click again to unsave.
5. Verify label toggles back to `Save`.

### Flow 5: Saved Forms View
1. Save at least 2 forms from General forms search.
2. Return to landing page -> `Saved forms`.
3. Verify saved items are listed and sortable actions work:
- expand details
- select eSign-enabled forms
- continue to package
4. Verify empty state appears if all saved forms are removed.

### Flow 6: Saved Forms Persistence
1. Save one form.
2. Refresh browser.
3. Verify landing page saved-forms count remains.
4. Open Saved forms and confirm item is still present.

### Flow 7: Basic DocuSign Send (Happy Path)
1. Search account `ABC123`.
2. Select `AC-TF`.
3. Fill fields (or defaults), keep required signers.
4. Click `Send for Signature`.
5. Verify success toast and item in `My work -> In progress`.
6. Verify DocuSign email is received.

### Flow 8: Sequential Signing Order
1. Search `ABC123`, select `AC-TF`.
2. Select 2+ signers across package forms.
3. Reorder signers.
4. Send.
5. Verify routing order in logs/API behavior (`1`, `2`, ...) and signer sequence follows configured order.

### Flow 9: Save and Resume Draft
1. Search `ABC123`, select a form.
2. Enter some values.
3. Click `Save Draft` and name it.
4. Verify `Resume last draft` in `Quick start` is enabled on landing page.
5. Use `Resume last draft` and verify it opens package edit mode with rehydrated draft data.

### Flow 10: Void and Resend
1. Create in-progress envelope (Flow 7).
2. In `My work -> In progress`, use overflow menu.
3. Test `Resend notification`.
4. Test `Void envelope` with reason.
5. Verify item moves to `Voided`.

### Flow 11: PDF Fill Send (LA-GEN)
1. Search `ABC123`.
2. Select `LA-GEN`.
3. Populate LA-GEN-specific fields.
4. Send for signature.
5. Verify signed document path contains prefilled static values.

### Flow 12: Error Handling
1. Block network or proxy endpoint.
2. Attempt DocuSign send for eligible form.
3. Verify error messaging appears.
4. Verify My work item still gets created for continuity.

### Flow 13: Account Eligibility Gating
1. Open `General forms search`.
2. Enter account `ABC123` (Joint).
3. Verify forms not valid for Joint are shown but disabled.
4. Verify `Print only` forms are shown but disabled.
5. Verify footer shows all three counters: total forms, eSign enabled, eligible for entered account.
6. Change to account `ASD456` (Trust) and verify eligible count and disabled states update.

### Flow 14: Admin Mode
1. Open app with `?admin=pm`.
2. Verify header shows `Admin mode` badge and `Admin` button.
3. Open `Admin`.
4. In forms catalog, click a form and edit description.
5. Save and verify success toast.
6. Return to forms search and verify updated form metadata appears in results.
7. In Admin, update operations callout and save.
8. Return to landing and verify updated callout text.

---

## Common Operations

### Clear My Work only

```js
localStorage.removeItem('formsLibrary_workItems'); location.reload();
```

### Clear Saved Forms only

```js
localStorage.removeItem('formsLibrary_savedFormCodes'); location.reload();
```

### Inspect localStorage

```js
JSON.parse(localStorage.getItem('formsLibrary_workItems'));
JSON.parse(localStorage.getItem('formsLibrary_savedFormCodes'));
localStorage.getItem('formsLibrary_userRole');
JSON.parse(localStorage.getItem('formsLibrary_adminFormsCatalog'));
JSON.parse(localStorage.getItem('formsLibrary_operationsUpdate'));
```

### Enable/Disable admin in console

```js
// enable
localStorage.setItem('formsLibrary_userRole', 'admin'); location.reload();

// disable
localStorage.removeItem('formsLibrary_userRole'); location.reload();
```

### Reset admin-only prototype data

```js
localStorage.removeItem('formsLibrary_adminFormsCatalog');
localStorage.removeItem('formsLibrary_operationsUpdate');
location.reload();
```

### Full reset

```js
localStorage.clear(); location.reload();
```

### Test accounts

| Account | Name | Type | Signers | Notes |
|---------|------|------|---------|-------|
| `ABC123` | Timothy & Sarah Branthover | Joint | 2 | DocuSign-enabled |
| `QWE123` | Timothy Branthover | Roth IRA | 1 | Single signer |
| `RTY234` | Michael Chen | Individual | 1 | Single signer |
| `UIO345` | Jennifer & Robert Martinez | Joint | 2 | Mock only |
| `ASD456` | Sarah Johnson Living Trust | Trust | 1 | Single signer |
| `FGH567` | David Williams | Traditional IRA | 1 | Single signer |

### Forms requiring all signers

- `AC-TF` - Account Transfer Form
- `CL-ACRA` - Advisory Relationship Application

---

## File Structure

```txt
index.html                  # Entry point, loads scripts in order
app.js                      # Root state machine, routing between views
config/
  docusignConfig.js         # DocuSign config and proxy URL
services/
  formsSearch.js            # Weighted fuzzy search/ranking logic (Fuse.js)
  formEligibility.js        # Account-type eligibility and form selectability rules
  adminDataService.js       # Admin mode/session + catalog + operations update persistence
  docusignService.js        # DocuSign send/status/void/resend/download APIs
components/
  Header.js                 # Top navigation
  SearchView.js             # Landing page with account search, quick start, and alternate options
  ResultsView.js            # Account-scoped form selection
  FormsLibraryView.js       # General Forms Search with select + save + continue
  SavedFormsView.js         # Saved forms list with select + continue
  AdminView.js              # Admin workspace for forms and operations update editing
  PackageView.js            # Form fill + signer assignment + send/save
  MyWorkView.js             # Drafts/In Progress/Completed/Voided queue
  SaveDraftModal.js         # Draft naming modal
  forms/
    ACTFform.js
    ACFTform.js
    CLACRAform.js
    LAGENform.js
data/
  forms.js                  # 100-form catalog metadata
  mockData.js               # Mock accounts/history/AI suggestions
assets/
  LA-GEN-PDF.pdf            # PDF source for LA-GEN fill path
docs/
  UBS_FORMS_SEARCH_IMPLEMENTATION_GUIDE.md
  UBS_FORMS_SEARCH_EXEC_SUMMARY.md
```

## Tech Stack

- React 18 + ReactDOM 18 (CDN)
- Babel Standalone (in-browser JSX transpilation)
- Tailwind CSS (CDN)
- Fuse.js (fuzzy form search)
- jsrsasign (JWT signing for DocuSign auth)
- pdf-lib (in-browser PDF form fill for LA-GEN)
- Cloudflare Worker (DocuSign proxy/CORS bridge)

No npm build step required for runtime.

## Recent Feature Additions

- 100-form catalog expansion for realistic advisor search scenarios.
- Weighted fuzzy General Forms Search with typo tolerance and ranking.
- Fully functional Saved Forms workflow with localStorage persistence.
- Continue-to-package support from both General Forms Search and Saved Forms.
- Account-type eligibility model added for form selection (`validAccountTypeKeys`).
- Ineligible and print-only forms remain visible but disabled with reason text.
- Eligibility-aware selection behavior applied across Results, General Forms Search, and Saved Forms.
- General Forms Search footer counters now include `Eligible for entered account` in addition to total/eSign counts.
- Search index rebuild support added so admin catalog edits are immediately searchable.
- Admin mode system added with URL-based enable/disable and role persistence.
- Admin workspace added for create/edit forms, keyword chips, account-type eligibility, operations update preview/save/revert, and attachment placeholder handling.
- Header now shows admin-only `Admin` navigation plus a persistent `Admin mode` badge.
- Admin UI layout now uses a shared catalog+editor card with internal divider, scroll-in-place catalog, and toast save feedback.
