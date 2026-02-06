# Forms Library

A client-facing prototype for financial advisors to search accounts, select forms, fill them out, assign signers, and send for e-signature via DocuSign.

**Live site:** [timbranthover.github.io](https://timbranthover.github.io)

## Quick Start

No install needed. Serve with any static file server:
```bash
npx serve .
# or
python3 -m http.server
```
Then open `http://localhost:3000` (or `:8000` for Python).

To deploy, push to `main` -- GitHub Pages picks it up automatically.

## How It Works

### The App Flow
1. **Search** -- enter an account number (e.g. `ABC123`) on the landing page
2. **Select Forms** -- pick one or more forms from the catalog
3. **Fill & Assign** -- complete form fields, assign signers from the account
4. **Configure** -- set signing order (parallel or sequential), add a personal message (150 char limit)
5. **Send or Save** -- send for e-signature (real DocuSign for eligible combos) or save as draft
6. **My Work** -- track envelopes across Drafts / In Progress / Completed / Voided tabs

### Forms Library
Advisors can browse all 100 forms without selecting an account first:
- Click "Other search options" → "General Forms Search"
- Search/filter forms with weighted fuzzy matching across code, name, description, long description, and keywords
- Click any form to expand details (e-sign status, signer requirements, and metadata)
- Misspelled queries like `Account trnfer` still surface `AC-TF` as a top result

### DocuSign Integration
Real DocuSign envelope sending works for any form with `docuSignEnabled: true` in the catalog. Currently: **AC-TF, AC-FT, CL-ACRA** (template mode) and **LA-GEN** (PDF fill mode). All other forms use mock behaviour.

Two send modes:
- **Template mode** (AC-TF, AC-FT, CL-ACRA) -- envelope is created from a DocuSign template. Form field data typed in the app stays local; the template controls document layout.
- **PDF fill mode** (LA-GEN) -- the source PDF (`assets/LA-GEN-PDF.pdf`) is fetched, its AcroForm fields are filled with the typed data using **pdf-lib**, the form is flattened into static content, and the result is uploaded to DocuSign as a raw document. The signer sees all pre-filled values.

The routing decision is automatic: if the form definition in `FORMS_DATA` has a `pdfPath`, the PDF fill path is used. Otherwise, the template path is used.

Common to both:
- Browser creates a JWT (RS256 signed with jsrsasign library)
- JWT is exchanged for an OAuth token via DocuSign's auth server
- Envelope is created using the DocuSign REST API v2.1
- All calls route through a **Cloudflare Worker** proxy to bypass browser CORS
- Token is cached for ~55 minutes to reduce API calls

The Cloudflare Worker is deployed externally (not in this repo). Its URL is configured in `config/docusignConfig.js` under `proxyUrl`.

### Data Persistence
Work items (drafts, in-progress, completed, voided) are stored in **localStorage** under the key `formsLibrary_workItems`. They survive page reloads.

---

## Test Flows

### Flow 1: Basic DocuSign Send (Happy Path)
1. Search for account `ABC123`
2. Select form `AC-TF` (Account Transfer Form)
3. Fill out form fields (or leave defaults)
4. Both signers should be auto-selected (form requires all signers)
5. Optionally add a personal message (up to 150 chars)
6. Click "Send for Signature"
7. Verify: Toast notification appears, redirected to My Work → In Progress tab
8. Verify: Item shows "Sent" badge with progress bar
9. Check email inbox for the DocuSign envelope

### Flow 2: Sequential Signing Order
1. Search for account `ABC123`
2. Select form `AC-TF`
3. With both signers selected, "Signing Order" section should appear
4. Select "Send in sequence"
5. Verify: Numbered list shows signers with up/down arrows
6. Reorder signers using arrows (e.g., Sarah first, Timothy second)
7. Send for signature
8. Verify: Console log shows `routingOrder: 1` for first signer, `routingOrder: 2` for second

### Flow 3: Save and Resume Draft
1. Search for account `ABC123`
2. Select form `AC-TF`
3. Fill in some form fields
4. Click "Save Draft" → Enter a name (e.g., "Test Draft")
5. Verify: Toast confirms draft saved
6. Navigate to My Work → Drafts tab
7. Verify: Draft appears with name and timestamp
8. Click ⋮ menu → "Resume editing"
9. Verify: Form loads with previously entered data

### Flow 4: Forms Library Browse
1. From landing page, click "Other search options"
2. Click "General Forms Search"
3. Verify: All 100 forms are available when no search is entered
4. Use search box to filter (try "IRA", "transfer", or "Account trnfer")
5. Click a form row to expand details
6. Verify: Form code, e-sign status, signer requirements shown
7. Click "Back to search" to return

### Flow 5: Void an Envelope
1. Complete Flow 1 to create an in-progress envelope
2. In My Work → In Progress, click ⋮ menu on the item
3. Click "Void envelope"
4. Enter a reason when prompted
5. Verify: Item moves to Voided tab
6. Verify: DocuSign envelope is actually voided (check DocuSign admin)

### Flow 6: Resend Notification
1. Have an in-progress DocuSign envelope (from Flow 1)
2. In My Work → In Progress, click ⋮ menu
3. Click "Resend notification"
4. Verify: Success alert appears
5. Verify: Signer receives a new email

### Flow 7: Download Completed Document
1. Sign a DocuSign envelope from the signer's email
2. Wait for status to update (refresh or wait 30s for auto-poll)
3. Verify: Item moves to Completed tab automatically
4. Click ⋮ menu → "Download signed PDF"
5. Verify: PDF downloads with signed content

### Flow 8: Multi-Form Package
1. Search for account `ABC123`
2. Select multiple forms: `AC-TF` and `AC-FT`
3. Use "Previous Form" / "Next Form" to navigate between forms
4. Assign signers for each form (requirements may differ)
5. Send for signature
6. Verify: Package sent successfully

### Flow 9: Single-Signer Account
1. Search for account `1C88543` (Michael Chen - single signer)
2. Select any form
3. Verify: Only one signer available to select
4. Verify: "Signing Order" section does NOT appear (need 2+ signers)
5. Send for signature (mock mode - no real DocuSign)

### Flow 10: Error Handling
1. Disconnect from internet or block Cloudflare Worker URL
2. Try to send an envelope for ABC123 + AC-TF
3. Verify: Error alert appears with message
4. Verify: Item is still added to My Work (for demo continuity)

### Flow 11: PDF Fill Send (LA-GEN)
1. Search for account `ABC123`
2. Select form `LA-GEN` (Generic LOA)
3. Fill in: Authorized Person Name, select a Relationship from the dropdown, check one or more Authorization Scope options, add Dependent Name and Age
4. Add a signer (e.g. Timothy Branthover)
5. Click "Send for Signature"
6. Verify: success toast, item appears in My Work → In Progress
7. Open DocuSign (check email or DocuSign dashboard) -- all filled values should appear on the document as static text
8. Sign the document
9. Verify: item moves to Completed tab

---

## Common Operations

### Clear all work items (reset My Work tabs)
Open the browser console on the live site and run:
```js
localStorage.removeItem('formsLibrary_workItems'); location.reload();
```
This removes all accumulated drafts, in-progress, completed, and voided items. After reload, all tabs start empty.

### Clear everything (full site reset)
```js
localStorage.clear(); location.reload();
```

### Check what's in localStorage
```js
JSON.parse(localStorage.getItem('formsLibrary_workItems'));
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
These forms require all account holders to sign (others require just one):
- `AC-TF` - Account Transfer Form
- `CL-ACRA` - Advisory Relationship Application

---

## File Structure

```
index.html                  # Entry point, loads all scripts in order
app.js                      # Root component, view state machine, DocuSign handlers
config/
  docusignConfig.js         # DocuSign API keys, proxy URL, RSA key (demo sandbox)
services/
  docusignService.js        # DocuSign API: send, status, void, resend, download
components/
  Header.js                 # Top nav bar
  SearchView.js             # Account search landing page
  ResultsView.js            # Form selection grid
  PackageView.js            # Form fill + signer assignment + signing order + send/save
  MyWorkView.js             # Tabbed work queue with live status polling
  FormsLibraryView.js       # Browse all forms without account selection
  SaveDraftModal.js         # Draft naming modal
  forms/
    ACTFform.js             # ACAT Transfer Form (AC-TF)
    ACFTform.js             # EFT Authorization Form (AC-FT)
    CLACRAform.js           # Advisory Relationship Application (CL-ACRA)
    LAGENform.js            # Generic Letter of Authorization (LA-GEN) -- PDF fill path
data/
  mockData.js               # Mock accounts, history, draft data, AI suggestions
  forms.js                  # Form catalog (100 form definitions, incl. pdfPath config)
assets/
  LA-GEN-PDF.pdf            # Source PDF for LA-GEN -- filled at send time via pdf-lib
```

## Tech Stack

- React 18 + ReactDOM 18 (CDN, no build)
- Babel Standalone (in-browser JSX transpilation)
- Fuse.js (client-side fuzzy search and ranking)
- Tailwind CSS (CDN)
- jsrsasign (CDN, JWT signing)
- pdf-lib (CDN UMD, in-browser PDF form filling)
- Cloudflare Worker (CORS proxy, free tier)

No npm. No bundler. No build step. Edit files and push.

## Recent Features

- **PDF Form Fill (Option B)**: LA-GEN form data is filled directly into the source PDF via pdf-lib before uploading to DocuSign. The signer sees all pre-filled values -- no template tab-label matching required.
- **Dual Send Paths**: Template-based forms use DocuSign templates; PDF-fill forms upload a pre-filled document. Routing is automatic based on `pdfPath` in the form definition.
- **Signing Order**: Choose parallel (all at once) or sequential (one after another) signing
- **Personal Message**: Add a custom note to the DocuSign email (150 char limit)
- **Forms Library**: Browse all forms without searching for an account
- **Parallel Status Polling**: In Progress items load faster with concurrent API calls
- **Toast Notifications**: Non-blocking feedback for successful actions

