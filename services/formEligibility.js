const ACCOUNT_TYPE_KEYS = Object.freeze({
  RMA_INDIVIDUAL: "RMA_INDIVIDUAL",
  RMA_JOINT: "RMA_JOINT",
  TRUST: "TRUST",
  IRA_ROTH: "IRA_ROTH",
  IRA_TRADITIONAL: "IRA_TRADITIONAL"
});

const ALL_ACCOUNT_TYPE_KEYS = Object.freeze(Object.values(ACCOUNT_TYPE_KEYS));

const ACCOUNT_TYPE_LABEL_TO_KEY = Object.freeze({
  individual: ACCOUNT_TYPE_KEYS.RMA_INDIVIDUAL,
  joint: ACCOUNT_TYPE_KEYS.RMA_JOINT,
  trust: ACCOUNT_TYPE_KEYS.TRUST,
  "roth ira": ACCOUNT_TYPE_KEYS.IRA_ROTH,
  "traditional ira": ACCOUNT_TYPE_KEYS.IRA_TRADITIONAL
});

const resolveAccountTypeKey = (accountOrType) => {
  if (!accountOrType) return null;

  if (typeof accountOrType === "string") {
    const normalized = accountOrType.trim().toLowerCase();
    return ACCOUNT_TYPE_LABEL_TO_KEY[normalized] || null;
  }

  if (accountOrType.accountTypeKey) return accountOrType.accountTypeKey;
  return resolveAccountTypeKey(accountOrType.accountType || "");
};

const getFormValidAccountTypeKeys = (form) => {
  if (Array.isArray(form?.validAccountTypeKeys) && form.validAccountTypeKeys.length > 0) {
    return form.validAccountTypeKeys;
  }

  return ALL_ACCOUNT_TYPE_KEYS;
};

const isFormEligibleForAccountTypeKey = (form, accountTypeKey) => {
  if (!accountTypeKey) return true;
  return getFormValidAccountTypeKeys(form).includes(accountTypeKey);
};

const isFormEligibleForAccount = (form, account) =>
  isFormEligibleForAccountTypeKey(form, resolveAccountTypeKey(account));

const isFormSelectableForAccount = (form, account) =>
  Boolean(form && form.eSignEnabled && isFormEligibleForAccount(form, account));

const getFormSelectionDisabledReason = (form, account) => {
  if (!form?.eSignEnabled) return "Print only";
  if (!account) return "";
  if (!isFormEligibleForAccount(form, account)) {
    return `Not valid for ${account.accountType} accounts`;
  }

  return "";
};

// ── Multi-account envelope compatibility ──────────────────────────────────────

const ENVELOPE_COMPATIBILITY_FAMILIES = Object.freeze({
  RMA:   [ACCOUNT_TYPE_KEYS.RMA_INDIVIDUAL, ACCOUNT_TYPE_KEYS.RMA_JOINT],
  IRA:   [ACCOUNT_TYPE_KEYS.IRA_ROTH, ACCOUNT_TYPE_KEYS.IRA_TRADITIONAL],
  TRUST: [ACCOUNT_TYPE_KEYS.TRUST]
});

const ENVELOPE_FAMILY_LABELS = Object.freeze({
  RMA:   'RMA (Individual/Joint)',
  IRA:   'IRA',
  TRUST: 'Trust'
});

const getAccountEnvelopeFamily = (account) => {
  const key = resolveAccountTypeKey(account);
  if (!key) return null;
  for (const [family, keys] of Object.entries(ENVELOPE_COMPATIBILITY_FAMILIES)) {
    if (keys.includes(key)) return family;
  }
  return null;
};

/**
 * Returns { compatible, reason, incompatibleAccounts } for a set of accounts.
 * Compatible if all accounts share the same envelope family.
 */
const canAccountsShareEnvelope = (accounts) => {
  if (!Array.isArray(accounts) || accounts.length < 2) {
    return { compatible: true, reason: '', incompatibleAccounts: [] };
  }

  const familyMap = {};
  for (const account of accounts) {
    familyMap[account.accountNumber] = getAccountEnvelopeFamily(account);
  }

  const uniqueFamilies = [...new Set(Object.values(familyMap).filter(Boolean))];

  if (uniqueFamilies.length <= 1) {
    return { compatible: true, reason: '', incompatibleAccounts: [] };
  }

  const primaryFamily = familyMap[accounts[0].accountNumber];
  const incompatibleAccounts = accounts
    .filter(a => familyMap[a.accountNumber] !== primaryFamily)
    .map(a => a.accountNumber);

  const primaryLabel = ENVELOPE_FAMILY_LABELS[primaryFamily] || primaryFamily;
  const conflictLabels = [...new Set(
    incompatibleAccounts.map(num => ENVELOPE_FAMILY_LABELS[familyMap[num]] || familyMap[num])
  )];

  return {
    compatible: false,
    reason: `${conflictLabels.join(' and ')} accounts cannot be combined with ${primaryLabel} accounts in one envelope`,
    incompatibleAccounts
  };
};
