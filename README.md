# Forms Library

A Forms Library prototype for financial advisors. Supports account search, form selection, signer assignment, and DocuSign eSign.

**Live site:** [timbranthover.github.io/UFG_site](https://timbranthover.github.io/UFG_site/)

**Original (personal branding):** [timbranthover.github.io](https://timbranthover.github.io/)

## Styling Notes

Visual customization applied to the base Forms Library. No functionality, state management, or API behavior changed. Differences are purely visual:

- **Color system** — All Tailwind blue/gray classes replaced with custom design tokens (charcoal, bronze, bordeaux, warm pastels)
- **Typography** — System-ui font stack (replaces Inter from Google Fonts)
- **Header** — Dark charcoal (#404040) with 2px bordeaux (#BD000C) accent line
- **Glassmorphism** — Preserved and recolored to charcoal/bronze tones
- **CSS custom properties** — Design tokens defined as `--app-*` variables in `:root`
- **Buttons** — Primary actions use charcoal (#404040) with white text; disabled states use warm pastels
- **Inputs** — Focus rings use `#B8B3A2`; readonly fields use `bg-[#F5F0E1]`
- **Badges/pills** — Warm pastel backgrounds (`#ECEBE4`, `#F5F0E1`) with muted text

### Color Token Reference

| Token | Hex | Usage |
|-------|-----|-------|
| Bordeaux | `#BD000C` | Accent line, focus highlights |
| Bordeaux dark | `#8A000A` | Hover states |
| Bronze | `#B98E2C` | Glassmorphism accents |
| Charcoal | `#404040` | Primary text, buttons, header bg |
| Gray 5 | `#5A5D5C` | Secondary text, labels |
| Gray 4 | `#7A7870` | Muted text, descriptions |
| Gray 3 | `#8E8D83` | Placeholder text, disabled |
| Gray 2 | `#B8B3A2` | Borders, focus rings |
| Gray 1 | `#CCCABC` | Dividers, input borders |
| Pastel warm | `#F5F0E1` | Card backgrounds, readonly fields |
| Pastel cool | `#ECEBE4` | Hover states, badges, pills |

## Quick Start

No install needed. Serve with any static file server:

```bash
npx serve .
# or
python3 -m http.server
```

Then open `http://localhost:3000` (or `:8000` for Python).

To deploy, push to `main` on the `UFG_site` repo (GitHub Pages auto-deploys).

## Admin Mode Access (Prototype)

Admin mode is controlled by URL query flag and stored in browser localStorage.

Enable admin:
- `https://timbranthover.github.io/UFG_site/index.html?admin=pm`
- Or append `?admin=pm` to any page URL

Disable admin:
- Append `?admin=off` to any page URL

After enabling, the header shows:
- `Admin mode` badge
- `Admin` button (left of `My work`)

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

### DocuSign Integration
Real DocuSign send is enabled for forms with `docuSignEnabled: true` in `data/forms.js`.

Currently enabled:
- `AC-TF`, `AC-FT`, `CL-ACRA` (template mode)
- `LA-GEN` (PDF fill mode)

Send modes:
- Template mode: creates envelope from DocuSign template.
- PDF fill mode: fills `assets/LA-GEN-PDF.pdf` via `pdf-lib`, flattens it, uploads as raw document.

Common pipeline:
- browser signs JWT (RS256 via `jsrsasign`)
- JWT exchanged for OAuth token
- DocuSign REST API v2.1 called via Cloudflare Worker proxy
- token cached for ~55 minutes

### Data Persistence
localStorage keys used by the app:
- `formsLibrary_workItems` -> My Work data (draft/in-progress/completed/voided)
- `formsLibrary_savedFormCodes` -> saved form codes for Saved Forms
- `formsLibrary_userRole` -> current role flag (`admin` when enabled)
- `formsLibrary_adminFormsCatalog` -> admin-edited forms catalog
- `formsLibrary_operationsUpdate` -> admin-edited landing operations callout

All persist across refreshes.

---

## Test Accounts

| Account | Name | Type | Signers | Notes |
|---------|------|------|---------|-------|
| `ABC123` | Timothy & Sarah Branthover | Joint | 2 | DocuSign-enabled |
| `QWE123` | Timothy Branthover | Roth IRA | 1 | Single signer |
| `RTY234` | Michael Chen | Individual | 1 | Single signer |
| `UIO345` | Jennifer & Robert Martinez | Joint | 2 | Mock only |
| `ASD456` | Sarah Johnson Living Trust | Trust | 1 | Single signer |
| `FGH567` | David Williams | Traditional IRA | 1 | Single signer |

---

## Common Operations

### Clear My Work only

```js
localStorage.removeItem('formsLibrary_workItems'); location.reload();
```

### Full reset

```js
localStorage.clear(); location.reload();
```

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
  Header.js                 # Top navigation (dark charcoal with bordeaux accent)
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
```

## Tech Stack

- React 18 + ReactDOM 18 (CDN)
- Babel Standalone (in-browser JSX transpilation)
- Tailwind CSS (CDN) with custom design tokens via CSS custom properties
- Fuse.js (fuzzy form search)
- jsrsasign (JWT signing for DocuSign auth)
- pdf-lib (in-browser PDF form fill for LA-GEN)
- Cloudflare Worker (DocuSign proxy/CORS bridge)

No npm build step required.
