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
4. **Configure** -- set signing order (parallel or sequential), add a personal message
5. **Send or Save** -- send for e-signature (real DocuSign for eligible combos) or save as draft
6. **My Work** -- track envelopes across Drafts / In Progress / Completed / Voided tabs

### Forms Library
Advisors can browse all 20 forms without selecting an account first:
- Click "Other search options" → "General Forms Search"
- Search/filter forms by name, code, or description
- Click any form to expand details (e-sign status, signer requirements)
- Preview, Print, Download buttons (placeholders for future functionality)

### DocuSign Integration
Real DocuSign envelope sending works for **account `ABC123` + form `AC-TF`**. All other combinations use mock behavior.

The DocuSign flow:
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
3. Verify: All 20 forms displayed in alphabetical order
4. Use search box to filter (try "IRA" or "transfer")
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
1. Search for account `1C88543` (David Park - single signer)
2. Select any form
3. Verify: Only one signer available to select
4. Verify: "Signing Order" section does NOT appear (need 2+ signers)
5. Send for signature (mock mode - no real DocuSign)

### Flow 10: Error Handling
1. Disconnect from internet or block Cloudflare Worker URL
2. Try to send an envelope for ABC123 + AC-TF
3. Verify: Error alert appears with message
4. Verify: Item is still added to My Work (for demo continuity)

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
| Account | Name | Signers | Notes |
|---------|------|---------|-------|
| `ABC123` | Timothy & Sarah Branthover | 2 | DocuSign-enabled |
| `1B92007` | Jennifer & Michael Rodriguez | 2 | Mock only |
| `1C88543` | David Park | 1 | Single signer |
| `1D12456` | Emily & Robert Chen | 2 | Mock only |
| `1E99871` | Alexandra Thompson | 1 | Single signer |
| `1F44320` | James & Maria Santos | 2 | Mock only |

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
data/
  mockData.js               # Mock accounts, history, draft data, AI suggestions
  forms.js                  # Form catalog (20 form definitions)
assets/
  logo.png                  # Header logo
```

## Tech Stack

- React 18 + ReactDOM 18 (CDN, no build)
- Babel Standalone (in-browser JSX transpilation)
- Tailwind CSS (CDN)
- jsrsasign (CDN, JWT signing)
- Cloudflare Worker (CORS proxy, free tier)

No npm. No bundler. No build step. Edit files and push.

## Recent Features

- **Signing Order**: Choose parallel (all at once) or sequential (one after another) signing
- **Personal Message**: Add a custom note to the DocuSign email (150 char limit)
- **Forms Library**: Browse all forms without searching for an account
- **Parallel Status Polling**: In Progress items load faster with concurrent API calls
- **Toast Notifications**: Non-blocking feedback for successful actions
