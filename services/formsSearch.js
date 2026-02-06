const FORM_SEARCH_STOP_WORDS = new Set(["a", "an", "and", "for", "of", "on", "the", "to", "with"]);

const FORM_SEARCH_TYPO_CORRECTIONS = {
  trnfer: "transfer",
  transfre: "transfer",
  tranfer: "transfer",
  benificiary: "beneficiary",
  beneficary: "beneficiary",
  witholding: "withholding",
  disbursment: "disbursement",
  recharcterization: "recharacterization",
  addrss: "address",
  acount: "account"
};

const FORM_SEARCH_SYNONYMS = {
  transfer: ["acat", "journal", "rollover", "wire", "ach", "move assets"],
  acat: ["account transfer", "transfer account", "external transfer"],
  beneficiary: ["tod", "pod", "estate", "contingent", "primary"],
  withdrawal: ["distribution", "disbursement", "payout"],
  wire: ["bank wire", "outgoing wire", "incoming wire"],
  ira: ["roth", "traditional", "rmd", "retirement"],
  rmd: ["required minimum distribution", "ira withdrawal"],
  tax: ["withholding", "w9", "w8", "fatca", "crs"],
  w9: ["tefra", "tax id", "tin"],
  w8: ["w-8ben", "w-8ben-e", "foreign status"],
  options: ["calls", "puts", "spread", "level 2", "level 3"],
  trust: ["trustee", "fiduciary", "estate"],
  loan: ["margin", "credit line", "pledged asset"],
  paperless: ["e-delivery", "electronic delivery", "edocs"],
  death: ["estate", "decedent", "beneficiary"]
};

const normalizeSearchText = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeSearchCode = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const tokenizeSearchText = (value = "") =>
  normalizeSearchText(value)
    .split(" ")
    .filter(Boolean)
    .filter((token) => !FORM_SEARCH_STOP_WORDS.has(token));

const buildSearchIndexEntry = (form) => {
  const keywordsText = Array.isArray(form.keywords) ? form.keywords.join(" ") : "";
  const searchableText = normalizeSearchText(
    [form.code, form.name, form.description, form.longDescription || "", keywordsText].join(" ")
  );

  return {
    form,
    code: form.code,
    name: form.name,
    description: form.description || "",
    longDescription: form.longDescription || "",
    keywords: keywordsText,
    normalizedCode: normalizeSearchCode(form.code),
    searchableText
  };
};

const FORM_SEARCH_INDEX = FORMS_DATA.map(buildSearchIndexEntry);

const FORM_FUSE_STRICT =
  typeof Fuse !== "undefined"
    ? new Fuse(FORM_SEARCH_INDEX, {
        includeScore: true,
        shouldSort: true,
        threshold: 0.34,
        ignoreLocation: true,
        minMatchCharLength: 2,
        keys: [
          { name: "code", weight: 0.34 },
          { name: "name", weight: 0.29 },
          { name: "description", weight: 0.21 },
          { name: "keywords", weight: 0.11 },
          { name: "longDescription", weight: 0.05 }
        ]
      })
    : null;

const FORM_FUSE_BROAD =
  typeof Fuse !== "undefined"
    ? new Fuse(FORM_SEARCH_INDEX, {
        includeScore: true,
        shouldSort: true,
        threshold: 0.48,
        ignoreLocation: true,
        minMatchCharLength: 2,
        keys: [
          { name: "code", weight: 0.32 },
          { name: "name", weight: 0.28 },
          { name: "description", weight: 0.22 },
          { name: "keywords", weight: 0.12 },
          { name: "longDescription", weight: 0.06 }
        ]
      })
    : null;

const expandSearchTokens = (tokens) => {
  const expanded = new Set();

  tokens.forEach((token) => {
    const corrected = FORM_SEARCH_TYPO_CORRECTIONS[token] || token;
    expanded.add(corrected);

    if (FORM_SEARCH_SYNONYMS[corrected]) {
      FORM_SEARCH_SYNONYMS[corrected].forEach((term) => {
        tokenizeSearchText(term).forEach((part) => expanded.add(part));
      });
    }

    Object.entries(FORM_SEARCH_SYNONYMS).forEach(([rootTerm, relatedTerms]) => {
      const relatedTokens = relatedTerms.flatMap((term) => tokenizeSearchText(term));
      if (relatedTokens.includes(corrected)) {
        expanded.add(rootTerm);
        relatedTokens.forEach((term) => expanded.add(term));
      }
    });
  });

  return [...expanded];
};

const calculateAdjustedScore = (entry, baseScore, queryInfo) => {
  const { normalizedQuery, normalizedCodeQuery, correctedTokens, expandedTokens } = queryInfo;
  let score = typeof baseScore === "number" ? baseScore : 0.62;

  if (!normalizedQuery) return score;

  if (entry.normalizedCode === normalizedCodeQuery) {
    score -= 0.5;
  } else if (normalizedCodeQuery.length >= 2 && entry.normalizedCode.startsWith(normalizedCodeQuery)) {
    score -= 0.2;
  } else if (normalizedCodeQuery.length >= 3 && entry.normalizedCode.includes(normalizedCodeQuery)) {
    score -= 0.1;
  }

  const normalizedName = normalizeSearchText(entry.name);
  if (normalizedName === normalizedQuery) {
    score -= 0.3;
  } else if (normalizedName.startsWith(normalizedQuery)) {
    score -= 0.18;
  } else if (normalizedName.includes(normalizedQuery)) {
    score -= 0.1;
  }

  const exactTokenHits = correctedTokens.reduce((count, token) => {
    return count + (entry.searchableText.includes(token) ? 1 : 0);
  }, 0);

  score -= Math.min(exactTokenHits * 0.08, 0.28);

  const expandedOnlyTokens = expandedTokens.filter((token) => !correctedTokens.includes(token));
  const synonymTokenHits = expandedOnlyTokens.reduce((count, token) => {
    return count + (entry.searchableText.includes(token) ? 1 : 0);
  }, 0);

  score -= Math.min(synonymTokenHits * 0.015, 0.09);

  if (correctedTokens.length > 1 && correctedTokens.every((token) => entry.searchableText.includes(token))) {
    score -= 0.06;
  }

  return Math.max(score, 0);
};

const collectFuseCandidates = (fuse, query, limit, collection) => {
  if (!fuse || !query) return;

  fuse.search(query, { limit }).forEach((result, index) => {
    const existing = collection.get(result.item.code);
    if (!existing || result.score < existing.baseScore) {
      collection.set(result.item.code, { entry: result.item, baseScore: result.score, rank: index });
    }
  });
};

const fallbackSearch = (queryInfo) => {
  const { normalizedQuery, normalizedCodeQuery, expandedTokens } = queryInfo;
  const candidates = FORM_SEARCH_INDEX.filter((entry) => {
    if (entry.normalizedCode.includes(normalizedCodeQuery)) return true;
    if (entry.searchableText.includes(normalizedQuery)) return true;
    return expandedTokens.some((token) => entry.searchableText.includes(token));
  });

  return candidates
    .map((entry, index) => ({
      entry,
      baseScore: 0.55 + index * 0.0001
    }))
    .sort((a, b) => a.baseScore - b.baseScore);
};

const searchFormsCatalog = (query, options = {}) => {
  const limit = Number.isFinite(options.limit) ? options.limit : 24;
  const normalizedQuery = normalizeSearchText(query || "");

  if (!normalizedQuery) {
    const allForms = [...FORMS_DATA].sort((a, b) => a.name.localeCompare(b.name));
    return {
      items: allForms.slice(0, limit),
      totalMatches: allForms.length,
      limited: allForms.length > limit
    };
  }

  const baseTokens = tokenizeSearchText(normalizedQuery);
  const correctedTokens = baseTokens.map((token) => FORM_SEARCH_TYPO_CORRECTIONS[token] || token);
  const expandedTokens = expandSearchTokens(correctedTokens);
  const expandedQuery = expandedTokens.join(" ");
  const normalizedCodeQuery = normalizeSearchCode(normalizedQuery);

  const queryInfo = {
    normalizedQuery,
    normalizedCodeQuery,
    correctedTokens,
    expandedTokens
  };

  const candidates = new Map();
  const fuseLimit = Math.max(limit * 6, 40);

  collectFuseCandidates(FORM_FUSE_STRICT, normalizedQuery, fuseLimit, candidates);
  if (expandedQuery && expandedQuery !== normalizedQuery) {
    collectFuseCandidates(FORM_FUSE_STRICT, expandedQuery, fuseLimit, candidates);
  }

  if (candidates.size < Math.min(12, limit * 2)) {
    collectFuseCandidates(FORM_FUSE_BROAD, normalizedQuery, fuseLimit, candidates);
    if (expandedQuery && expandedQuery !== normalizedQuery) {
      collectFuseCandidates(FORM_FUSE_BROAD, expandedQuery, fuseLimit, candidates);
    }
  }

  let ranked = [...candidates.values()].map((candidate) => ({
    ...candidate,
    adjustedScore: calculateAdjustedScore(candidate.entry, candidate.baseScore, queryInfo)
  }));

  if (!ranked.length) {
    ranked = fallbackSearch(queryInfo).map((candidate) => ({
      ...candidate,
      adjustedScore: calculateAdjustedScore(candidate.entry, candidate.baseScore, queryInfo)
    }));
  }

  ranked.sort((a, b) => a.adjustedScore - b.adjustedScore || a.entry.name.localeCompare(b.entry.name));

  const scoreGate = normalizedQuery.length <= 3 ? 0.48 : 0.67;
  const gated = ranked.filter((item) => item.adjustedScore <= scoreGate);
  const finalRanked = gated.length ? gated : ranked.slice(0, limit * 2);

  return {
    items: finalRanked.slice(0, limit).map((item) => item.entry.form),
    totalMatches: finalRanked.length,
    limited: finalRanked.length > limit
  };
};
