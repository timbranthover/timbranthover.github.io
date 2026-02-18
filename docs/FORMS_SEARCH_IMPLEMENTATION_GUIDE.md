# Forms Search Implementation Guide

## Purpose
This guide explains the fuzzy forms-search approach used in this prototype and how to implement the same pattern in a production system.

## TL;DR
Use a hybrid search strategy for form catalogs:
1. Normalize text (`lowercase`, remove punctuation, tokenize).
2. Apply typo correction for frequent advisor misspellings (`beneficary` -> `beneficiary`).
3. Expand intent with finance synonyms (`transfer` -> `acat`, `wire`, `ach`, `rollover`).
4. Run weighted fuzzy search using Fuse.js.
5. Apply business-aware reranking (exact code match > name match > related synonym match).
6. Limit results to a useful top set (for example, 10 to 25).

This gives high recall without overwhelming users.

## What Fuse.js Is
Fuse.js is a lightweight JavaScript library for fuzzy string matching.

Why it is useful here:
- No separate search infrastructure is required for small-to-medium catalogs.
- Supports weighted keys (form code can matter more than long description).
- Handles partial and approximate matches.
- Works client-side and server-side JavaScript.

Official docs:
- https://www.fusejs.io/
- https://www.fusejs.io/api/options.html

## What This Prototype Uses
File: `services/formsSearch.js`

Core pieces:
- `FORM_SEARCH_TYPO_CORRECTIONS`: explicit typo dictionary for common mistakes.
- `FORM_SEARCH_SYNONYMS`: domain synonyms and related terms.
- `FORM_FUSE_STRICT` and `FORM_FUSE_BROAD`: two Fuse configurations for high precision first, then fallback recall.
- `calculateAdjustedScore(...)`: business-aware reranking after Fuse scoring.
- `searchFormsCatalog(query, { limit })`: single public function that returns ranked items.

Important note:
- This implementation does not manually compute Levenshtein distance.
- It combines dictionary-based typo correction plus Fuse fuzzy scoring.

## Recommended Data Contract
Use one canonical shape regardless of backend source:

```js
{
  code: "AC-TF",
  name: "Account Transfer Form",
  description: "ACAT transfer from external institution",
  longDescription: "Authorizes full or partial ACAT transfer...",
  keywords: ["acat", "transfer", "rollover"],
  eSignEnabled: true,
  requiresAllSigners: true
}
```

Required fields for quality search:
- `code`
- `name`
- `description`

Strongly recommended fields:
- `longDescription`
- `keywords`

## Integration Options By Backend Format

### If Backend Returns JSON
1. Fetch form records.
2. Map backend properties to the canonical shape.
3. Ensure `keywords` is always an array.
4. Build index and search with the mapped array.

Example mapper:

```js
const mappedForms = apiForms.map((f) => ({
  code: f.formCode,
  name: f.formName,
  description: f.shortDescription || "",
  longDescription: f.longDescription || "",
  keywords: Array.isArray(f.keywords) ? f.keywords : [],
  eSignEnabled: Boolean(f.eSignEnabled),
  requiresAllSigners: Boolean(f.requiresAllSigners)
}));
```

### If Backend Returns CSV
1. Parse CSV rows.
2. Map columns to canonical fields.
3. Split keyword strings by comma.
4. Normalize booleans.

Example mapper:

```js
const mappedForms = csvRows.map((r) => ({
  code: String(r.form_code || "").trim(),
  name: String(r.form_name || "").trim(),
  description: String(r.short_desc || "").trim(),
  longDescription: String(r.long_desc || "").trim(),
  keywords: String(r.keywords || "")
    .split(",")
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean),
  eSignEnabled: String(r.esign_enabled || "").toLowerCase() === "true",
  requiresAllSigners: String(r.requires_all_signers || "").toLowerCase() === "true"
}));
```

## How Ranking Works
The implemented flow:
1. Normalize query text.
2. Tokenize query.
3. Apply typo corrections to tokens.
4. Expand tokens with synonyms.
5. Run Fuse strict search.
6. If low coverage, run Fuse broad search.
7. Apply reranking bonuses:
- Exact code match bonus.
- Prefix code/name bonus.
- Exact token hit bonus.
- All-token coverage bonus.
8. Apply score gate and return top `N` results.

This avoids two common failures:
- Too strict: good forms are missed.
- Too broad: noisy result lists.

## Tuning Knobs Your Team Can Adjust
File: `services/formsSearch.js`

High impact settings:
- Fuse `threshold` (strict and broad).
- Key weights (`code`, `name`, `description`, `keywords`, `longDescription`).
- Typo dictionary entries.
- Synonym dictionary entries.
- `scoreGate` values.
- result `limit` per UI context.

Practical guidance:
- If too many irrelevant results: lower thresholds and tighten score gate.
- If too few results: increase broad threshold and gate.
- If wrong top result: increase code/name weights and exact-match bonuses.

## Minimal API Surface For Product Teams
Expose one function:

```js
searchFormsCatalog(query, { limit })
```

Return shape:

```js
{
  items: [/* ranked forms */],
  totalMatches: 59,
  limited: true
}
```

UI can display:
- "Showing 10 top of 59 matching forms"

## Example UX Queries For Demo
Use these in stakeholder demos:
1. `Account trnfer` -> `AC-TF` first.
2. `beneficary ira` -> beneficiary IRA forms top.
3. `wire transfer` -> `AC-WIRE-OUT` and `AC-WIRE-IN` top.
4. `w9` -> `CL-W9` top.
5. `rmd` -> `AC-RMD` top.
6. `tod bene` -> TOD/beneficiary forms top.
7. `529 rollover` -> 529 rollover forms top.
8. `margin` -> margin/loan forms top.
9. `estate distribution` -> estate/decedent forms top.
10. `paperless` -> paperless/e-delivery forms top.

## Production Rollout Plan
1. Implement adapter from backend payload to canonical shape.
2. Add search logging in non-PII form (query text can be hashed or sampled per policy).
3. Run side-by-side evaluation against current search.
4. Tune typo/synonym lists using real failed-query reports.
5. Release behind feature flag.
6. Measure:
- search-to-click rate
- time-to-select-form
- no-result rate
- query reformulation rate

## Quality Checklist For Developers
- Ensure all forms have `code`, `name`, `description`.
- Ensure `keywords` is always an array.
- Normalize code comparisons by removing hyphens/spaces.
- Limit results (do not dump all fuzzy matches).
- Keep typo/synonym dictionaries versioned.
- Add tests for known high-value queries and typos.

## Suggested Unit Tests
- `Account trnfer` ranks `AC-TF` at position 1.
- `w9` returns `CL-W9` at position 1.
- `beneficary` returns forms containing beneficiary intent.
- Empty query returns alphabetized full list (or configured default set).
- Unrelated query returns empty or low-noise constrained results.

## Security and Compliance Notes
- This search works on metadata only (form labels/descriptions), not account PII.
- If query logs are retained, treat them according to internal policy.
- Keep domain dictionaries in source control with review process.

## Where To Start In This Repo
- Search engine: `services/formsSearch.js`
- Forms metadata: `data/forms.js`
- General forms search UI: `components/FormsLibraryView.js`
- Account-level form picker search: `components/ResultsView.js`
- Library load order: `index.html`

## Developer Handoff Summary
For a junior developer:
1. Get backend forms payload (JSON or CSV).
2. Build adapter to canonical form shape.
3. Reuse the existing `searchFormsCatalog` pattern.
4. Tune typo and synonym dictionaries with advisor examples.
5. Add tests for top 20 internal query patterns.
6. Release with telemetry and tune after launch.
