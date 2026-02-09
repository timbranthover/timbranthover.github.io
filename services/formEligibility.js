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
