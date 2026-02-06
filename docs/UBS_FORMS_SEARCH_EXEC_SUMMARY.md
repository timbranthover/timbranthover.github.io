# UBS Forms Search Executive Summary

## Objective
Reduce advisor time-to-form and failed searches by implementing intelligent forms search with typo tolerance, acronym handling, and relevance ranking.

## Business Problem
Advisors often cannot recall exact form names or codes. Many forms are semantically similar, which increases search retries and slows client servicing.

## Proposed Solution
Implement a hybrid search layer that combines:
- weighted fuzzy search (Fuse.js)
- typo correction for common advisor misspellings
- finance-domain synonyms (for example: transfer -> ACAT/wire/ACH/rollover)
- ranking rules that prioritize exact code/name intent

This gives strong recall while keeping results focused (top-N, low-noise list).

## Why This Approach
- High usability improvement without standing up a separate search platform
- Fast to implement and tune
- Works with existing form metadata (JSON or CSV-backed)
- Transparent and controllable ranking logic (compliance-friendly)

## Expected Impact
- Faster form selection for advisors
- Lower query reformulation and no-result rates
- Better first-result quality on misspelled or shorthand queries
- Improved adoption of digital workflows

## Example Outcomes
- `Account trnfer` still returns Account Transfer Form first
- `beneficary ira` returns beneficiary + IRA forms near top
- `w9` returns tax certification forms immediately

## Implementation Snapshot
1. Normalize form metadata into a common model (`code`, `name`, `description`, `keywords`, optional `longDescription`).
2. Apply search pipeline (normalize -> typo correction -> synonym expansion -> fuzzy ranking).
3. Return constrained ranked results (for example, top 10 to 25).
4. Tune dictionaries and weights using real advisor query logs.

## Risk and Controls
- Risk: noisy results if thresholds are too permissive.
  Control: score gates and top-N limits.
- Risk: missing internal terminology.
  Control: maintain governed synonym and typo dictionaries.
- Risk: drift over time.
  Control: monthly search analytics review and dictionary updates.

## Rollout Plan
1. Pilot behind feature flag with advisor subset.
2. Compare baseline vs new search on:
- time-to-select-form
- no-result rate
- query reformulation rate
- search-to-click conversion
3. Tune and expand to full user base.

## Decision Requests
1. Approve pilot scope (teams/regions).
2. Confirm telemetry policy for search analytics.
3. Assign owner for ongoing synonym/typo dictionary governance.

## Repo References
- Technical guide: `docs/UBS_FORMS_SEARCH_IMPLEMENTATION_GUIDE.md`
- Search engine implementation: `services/formsSearch.js`
