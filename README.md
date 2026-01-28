# UBS Forms Library

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
1. **Search** -- enter an account number (e.g. `1B92008`) on the landing page
2. **Select Forms** -- pick one or more forms from the catalog
3. **Fill & Assign** -- complete form fields, assign signers from the account
4. **Send or Save** -- send for e-signature (real DocuSign for eligible combos) or save as draft
5. **My Work** -- track envelopes across Drafts / In Progress / Completed / Voided tabs

### DocuSign Integration
Real DocuSign envelope sending works for **account `1B92008` + form `AC-TF`**. All other combinations use mock behavior.

The DocuSign flow:
- Browser creates a JWT (RS256 signed with jsrsasign library)
- JWT is exchanged for an OAuth token via DocuSign's auth server
- Envelope is created using the DocuSign REST API v2.1
- All calls route through a **Cloudflare Worker** proxy to bypass browser CORS

The Cloudflare Worker is deployed externally (not in this repo). Its URL is configured in `config/docusignConfig.js` under `proxyUrl`.

### Data Persistence
Work items (drafts, in-progress, completed, voided) are stored in **localStorage** under the key `formsLibrary_workItems`. They survive page reloads.

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
| Account | Name | Signers |
|---------|------|---------|
| `1B92008` | Timothy & Sarah Branthover | 2 (DocuSign-enabled) |
| `1B92007` | Jennifer & Michael Rodriguez | 2 |
| `1C88543` | David Park | 1 |
| `1D12456` | Emily & Robert Chen | 2 |
| `1E99871` | Alexandra Thompson | 1 |
| `1F44320` | James & Maria Santos | 2 |

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
  PackageView.js            # Form fill + signer assignment + send/save
  MyWorkView.js             # Tabbed work queue with live status polling
  SaveDraftModal.js         # Draft naming modal
  forms/
    ACTFform.js             # ACAT Transfer Form (AC-TF)
    ACFTform.js             # EFT Authorization Form (AC-FT)
data/
  mockData.js               # Mock accounts, history, draft data, AI suggestions
  forms.js                  # Form catalog (20 form definitions)
assets/
  ubs_logo.png              # Header logo
```

## Tech Stack

- React 18 + ReactDOM 18 (CDN, no build)
- Babel Standalone (in-browser JSX transpilation)
- Tailwind CSS (CDN)
- jsrsasign (CDN, JWT signing)
- Cloudflare Worker (CORS proxy, free tier)

No npm. No bundler. No build step. Edit files and push.
