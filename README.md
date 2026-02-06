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

## How It Works

### App Flow
1. Landing page has:
- `Search by Account`
- `Need help finding the right form?`
- expandable `Other search options` with `General Forms Search` and `Saved Forms`
2. Account search flow:
- Enter account/UAN (example: `ABC123`)
- Select forms in account context
- Continue to package
3. General Forms Search flow:
- Search all 100 forms with fuzzy matching
- Select one or more eSign-enabled forms
- Enter account/UAN for package
- Continue to package from that screen
4. Saved Forms flow:
- Save/unsave forms from General Forms Search detail panel
- Open `Saved Forms` from landing page
- Select saved forms and continue to package
5. Package flow:
- Fill form fields
- Assign signers
- Choose parallel or sequential signing
- Optional personal message (150 char limit)
- Send for signature or save draft
6. My Work:
- Track Drafts / In Progress / Completed / Voided

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

Both persist across refreshes.

---

## Test Flows

### Flow 1: Home Screen Sanity
1. Open landing page.
2. Verify operations callout banner appears (`Operations update`).
3. Verify side-by-side cards render:
- `Search by Account`
- `Need help finding the right form?`
4. Expand `Other search options`.
5. Verify links for `General Forms Search` and `Saved Forms`.

### Flow 2: General Forms Search Fuzzy Matching
1. Landing -> `Other search options` -> `General Forms Search`.
2. Verify no query shows all forms.
3. Search `Account trnfer`.
4. Verify `AC-TF` appears at/near top.
5. Search by code fragment (example: `ac-tf`) and keyword (example: `ira`) to confirm ranking.

### Flow 3: Continue to Package from General Forms Search
1. Open `General Forms Search`.
2. Select one or more eSign-enabled forms (checkbox on row).
3. Enter valid account/UAN (example: `ABC123`).
4. Click `Continue with X form(s)`.
5. Verify navigation to package flow with selected forms.

### Flow 4: Save and Unsave Forms
1. In `General Forms Search`, expand a row.
2. Click `Save` bookmark action in detail panel.
3. Verify label changes to `Saved`.
4. Click again to unsave.
5. Verify label toggles back to `Save`.

### Flow 5: Saved Forms View
1. Save at least 2 forms from General Forms Search.
2. Return to landing page -> `Saved Forms`.
3. Verify saved items are listed and sortable actions work:
- expand details
- select eSign-enabled forms
- continue to package
4. Verify empty state appears if all saved forms are removed.

### Flow 6: Saved Forms Persistence
1. Save one form.
2. Refresh browser.
3. Verify landing page `Saved Forms` count remains.
4. Open Saved Forms and confirm item is still present.

### Flow 7: Basic DocuSign Send (Happy Path)
1. Search account `ABC123`.
2. Select `AC-TF`.
3. Fill fields (or defaults), keep required signers.
4. Click `Send for Signature`.
5. Verify success toast and item in `My Work -> In Progress`.
6. Verify DocuSign email is received.

### Flow 8: Sequential Signing Order
1. Search `ABC123`, select `AC-TF`.
2. Enable sequential signing.
3. Reorder signers.
4. Send.
5. Verify routing order in logs/API behavior (`1`, `2`, ...).

### Flow 9: Save and Resume Draft
1. Search `ABC123`, select a form.
2. Enter some values.
3. Click `Save Draft` and name it.
4. Open `My Work -> Drafts`.
5. Resume draft and verify data rehydrates.

### Flow 10: Void and Resend
1. Create in-progress envelope (Flow 7).
2. In `My Work -> In Progress`, use overflow menu.
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
4. Verify My Work item still gets created for continuity.

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
```

### Full reset

```js
localStorage.clear(); location.reload();
```

### Test accounts

| Account | Name | Type | Signers | Notes |
|---------|------|------|---------|-------|
| `ABC123` | Timothy & Sarah Branthover | Joint | 2 | DocuSign-enabled |
| `1B92007` | Timothy Branthover | Roth IRA | 1 | Single signer |
| `1C88543` | Michael Chen | Individual | 1 | Single signer |
| `1D12456` | Jennifer & Robert Martinez | Joint | 2 | Mock only |
| `1E99871` | Sarah Johnson Living Trust | Trust | 1 | Single signer |
| `1F44320` | David Williams | Traditional IRA | 1 | Single signer |

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
  docusignService.js        # DocuSign send/status/void/resend/download APIs
components/
  Header.js                 # Top navigation
  SearchView.js             # Landing page with account search and alternate options
  ResultsView.js            # Account-scoped form selection
  FormsLibraryView.js       # General Forms Search with select + save + continue
  SavedFormsView.js         # Saved forms list with select + continue
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
- General Forms Search UI polish:
- separate account/UAN and form-search cards
- right-aligned `Back to search` control
- expanded-row save control placement and cleaned metadata layout
- Landing page polish:
- operations callout banner
- improved two-column card layout for account + guided search assistance
