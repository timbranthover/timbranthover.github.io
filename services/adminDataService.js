const ADMIN_STORAGE_KEYS = Object.freeze({
  role: "formsLibrary_userRole",
  formsCatalog: "formsLibrary_adminFormsCatalog",
  operationsUpdate: "formsLibrary_operationsUpdate"
});

const ADMIN_ROLE_VALUE = "admin";

const ADMIN_DEFAULT_OPERATIONS_UPDATE = Object.freeze({
  label: "Operations update",
  message: "AC-DEBIT-CARD is now enabled for eSign on eligible account workflows.",
  updatedAt: "Updated today"
});

const ADMIN_QUERY_ENABLE_VALUES = new Set(["1", "true", "pm", "admin"]);
const ADMIN_QUERY_DISABLE_VALUES = new Set(["0", "false", "off", "user"]);

const cloneAdminValue = (value) => {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (error) {
    return value;
  }
};

const parseAdminStorageValue = (rawValue, fallbackValue) => {
  if (!rawValue) return fallbackValue;
  try {
    return JSON.parse(rawValue);
  } catch (error) {
    console.warn("Failed to parse admin storage value:", error);
    return fallbackValue;
  }
};

const isAdminUser = () => localStorage.getItem(ADMIN_STORAGE_KEYS.role) === ADMIN_ROLE_VALUE;

const setAdminUser = (enabled) => {
  if (enabled) {
    localStorage.setItem(ADMIN_STORAGE_KEYS.role, ADMIN_ROLE_VALUE);
    return true;
  }

  localStorage.removeItem(ADMIN_STORAGE_KEYS.role);
  return false;
};

const initializeAdminSessionFromUrl = () => {
  const currentUrl = new URL(window.location.href);
  const adminParam = currentUrl.searchParams.get("admin");
  if (!adminParam) return isAdminUser();

  const normalized = adminParam.trim().toLowerCase();
  if (ADMIN_QUERY_ENABLE_VALUES.has(normalized)) {
    setAdminUser(true);
  } else if (ADMIN_QUERY_DISABLE_VALUES.has(normalized)) {
    setAdminUser(false);
  }

  currentUrl.searchParams.delete("admin");
  window.history.replaceState({}, "", currentUrl.toString());

  return isAdminUser();
};

const applyFormsCatalogToRuntime = (formsCatalog) => {
  if (!Array.isArray(formsCatalog)) return cloneAdminValue(FORMS_DATA);

  FORMS_DATA.splice(0, FORMS_DATA.length, ...formsCatalog);
  if (typeof rebuildFormsSearchIndex === "function") {
    rebuildFormsSearchIndex(FORMS_DATA);
  }

  return cloneAdminValue(FORMS_DATA);
};

const getAdminFormsCatalog = () => {
  const storedCatalog = parseAdminStorageValue(
    localStorage.getItem(ADMIN_STORAGE_KEYS.formsCatalog),
    null
  );

  if (Array.isArray(storedCatalog) && storedCatalog.length > 0) {
    return cloneAdminValue(storedCatalog);
  }

  return cloneAdminValue(FORMS_DATA);
};

const initializeAdminFormsCatalog = () => {
  const catalog = getAdminFormsCatalog();
  return applyFormsCatalogToRuntime(catalog);
};

const saveAdminFormsCatalog = (formsCatalog) => {
  const safeCatalog = Array.isArray(formsCatalog) ? formsCatalog : [];
  localStorage.setItem(ADMIN_STORAGE_KEYS.formsCatalog, JSON.stringify(safeCatalog));
  return applyFormsCatalogToRuntime(safeCatalog);
};

const upsertAdminForm = (formPayload) => {
  const nextForm = cloneAdminValue(formPayload || {});
  const code = String(nextForm.code || "").trim().toUpperCase();
  if (!code) {
    throw new Error("Form code is required.");
  }
  nextForm.code = code;

  const catalog = getAdminFormsCatalog();
  const existingIndex = catalog.findIndex((form) => form.code === code);
  const action = existingIndex >= 0 ? "updated" : "added";

  if (existingIndex >= 0) {
    catalog[existingIndex] = nextForm;
  } else {
    catalog.unshift(nextForm);
  }

  const updatedCatalog = saveAdminFormsCatalog(catalog);
  return {
    action,
    form: cloneAdminValue(nextForm),
    formsCatalog: updatedCatalog
  };
};

const getAdminDefaultOperationsUpdate = () => cloneAdminValue(ADMIN_DEFAULT_OPERATIONS_UPDATE);

const getAdminOperationsUpdate = () => {
  const stored = parseAdminStorageValue(localStorage.getItem(ADMIN_STORAGE_KEYS.operationsUpdate), null);
  if (!stored || typeof stored !== "object") {
    return getAdminDefaultOperationsUpdate();
  }

  return {
    label: String(stored.label || ADMIN_DEFAULT_OPERATIONS_UPDATE.label),
    message: String(stored.message || ADMIN_DEFAULT_OPERATIONS_UPDATE.message),
    updatedAt: String(stored.updatedAt || ADMIN_DEFAULT_OPERATIONS_UPDATE.updatedAt)
  };
};

const saveAdminOperationsUpdate = (operationsUpdate) => {
  const safeValue = {
    label: String((operationsUpdate && operationsUpdate.label) || "").trim(),
    message: String((operationsUpdate && operationsUpdate.message) || "").trim(),
    updatedAt: String((operationsUpdate && operationsUpdate.updatedAt) || "").trim()
  };

  localStorage.setItem(ADMIN_STORAGE_KEYS.operationsUpdate, JSON.stringify(safeValue));
  return getAdminOperationsUpdate();
};

const resetAdminOperationsUpdate = () => {
  localStorage.removeItem(ADMIN_STORAGE_KEYS.operationsUpdate);
  return getAdminDefaultOperationsUpdate();
};
