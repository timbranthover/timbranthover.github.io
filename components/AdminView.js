const ADMIN_ACCOUNT_TYPE_OPTIONS = [
  { key: ACCOUNT_TYPE_KEYS.RMA_INDIVIDUAL, label: "RMA individual" },
  { key: ACCOUNT_TYPE_KEYS.RMA_JOINT, label: "RMA joint" },
  { key: ACCOUNT_TYPE_KEYS.TRUST, label: "Trust" },
  { key: ACCOUNT_TYPE_KEYS.IRA_ROTH, label: "Roth IRA" },
  { key: ACCOUNT_TYPE_KEYS.IRA_TRADITIONAL, label: "Traditional IRA" }
];

const ADMIN_KNOWN_FORM_KEYS = new Set([
  "code",
  "name",
  "description",
  "longDescription",
  "keywords",
  "requiresAllSigners",
  "eSignEnabled",
  "docuSignEnabled",
  "validAccountTypeKeys",
  "templateId",
  "pdfPath",
  "attachmentFileName"
]);

const createEmptyAdminFormDraft = () => ({
  code: "",
  name: "",
  description: "",
  longDescription: "",
  keywords: [],
  requiresAllSigners: false,
  eSignEnabled: true,
  docuSignEnabled: false,
  validAccountTypeKeys: [...ALL_ACCOUNT_TYPE_KEYS],
  templateId: "",
  pdfPath: "",
  attachmentFileName: "",
  advancedJson: ""
});

const mapFormToAdminDraft = (form) => {
  if (!form) return createEmptyAdminFormDraft();

  const extras = {};
  Object.keys(form).forEach((key) => {
    if (!ADMIN_KNOWN_FORM_KEYS.has(key)) extras[key] = form[key];
  });

  return {
    code: String(form.code || ""),
    name: String(form.name || ""),
    description: String(form.description || ""),
    longDescription: String(form.longDescription || ""),
    keywords: Array.isArray(form.keywords) ? [...form.keywords] : [],
    requiresAllSigners: Boolean(form.requiresAllSigners),
    eSignEnabled: Boolean(form.eSignEnabled),
    docuSignEnabled: Boolean(form.docuSignEnabled),
    validAccountTypeKeys: Array.isArray(form.validAccountTypeKeys) && form.validAccountTypeKeys.length > 0
      ? [...form.validAccountTypeKeys]
      : [...ALL_ACCOUNT_TYPE_KEYS],
    templateId: String(form.templateId || ""),
    pdfPath: String(form.pdfPath || ""),
    attachmentFileName: String(form.attachmentFileName || ""),
    advancedJson: Object.keys(extras).length ? JSON.stringify(extras, null, 2) : ""
  };
};

const AdminConfirmModal = ({ isOpen, title, message, onCancel, onConfirm, confirmLabel = "Confirm" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-xl shadow-xl max-w-md w-full p-5">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 mt-2">{message}</p>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onCancel} className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-3 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminView = ({
  onBack,
  formsCatalog = [],
  operationsUpdate,
  defaultOperationsUpdate,
  onSaveForm,
  onSaveOperationsUpdate,
  onResetOperationsUpdate
}) => {
  const [formSearchQuery, setFormSearchQuery] = React.useState("");
  const [editorMode, setEditorMode] = React.useState("add");
  const [selectedFormCode, setSelectedFormCode] = React.useState(null);
  const [formDraft, setFormDraft] = React.useState(createEmptyAdminFormDraft());
  const [keywordInput, setKeywordInput] = React.useState("");
  const [formErrors, setFormErrors] = React.useState({});
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [confirmRevertOps, setConfirmRevertOps] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const [operationsErrors, setOperationsErrors] = React.useState({});
  const fileInputRef = React.useRef(null);

  const [operationsDraft, setOperationsDraft] = React.useState({
    label: operationsUpdate?.label || "",
    message: operationsUpdate?.message || "",
    updatedAt: operationsUpdate?.updatedAt || ""
  });

  React.useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  React.useEffect(() => {
    setOperationsDraft({
      label: operationsUpdate?.label || "",
      message: operationsUpdate?.message || "",
      updatedAt: operationsUpdate?.updatedAt || ""
    });
  }, [operationsUpdate]);

  const filteredForms = React.useMemo(() => {
    const normalized = formSearchQuery.trim().toLowerCase();
    if (!normalized) return formsCatalog;
    return formsCatalog.filter((form) =>
      `${form.code} ${form.name} ${form.description || ""}`.toLowerCase().includes(normalized)
    );
  }, [formSearchQuery, formsCatalog]);

  const beginAddForm = () => {
    setEditorMode("add");
    setSelectedFormCode(null);
    setFormDraft(createEmptyAdminFormDraft());
    setKeywordInput("");
    setFormErrors({});
  };

  const beginEditForm = (form) => {
    setEditorMode("edit");
    setSelectedFormCode(form.code);
    setFormDraft(mapFormToAdminDraft(form));
    setKeywordInput("");
    setFormErrors({});
  };

  const addKeywordChip = (rawKeyword) => {
    const nextKeyword = String(rawKeyword || "").trim().toLowerCase();
    if (!nextKeyword) return;
    if (formDraft.keywords.includes(nextKeyword)) return setKeywordInput("");
    if (formDraft.keywords.length >= 20) return setFormErrors((prev) => ({ ...prev, keywords: "Max 20 keywords." }));
    setFormDraft((prev) => ({ ...prev, keywords: [...prev.keywords, nextKeyword] }));
    setKeywordInput("");
    setFormErrors((prev) => ({ ...prev, keywords: null }));
  };

  const removeKeywordChip = (keyword) => {
    setFormDraft((prev) => ({ ...prev, keywords: prev.keywords.filter((value) => value !== keyword) }));
  };

  const setAttachmentFromFile = (file) => {
    if (!file) return;
    setFormDraft((prev) => ({ ...prev, attachmentFileName: file.name }));
  };

  const validateAndBuildFormPayload = () => {
    const errors = {};
    const mergedKeywords = keywordInput.trim()
      ? [...new Set([...formDraft.keywords, keywordInput.trim().toLowerCase()])]
      : [...formDraft.keywords];

    const normalizedCode = formDraft.code.trim().toUpperCase();
    const normalizedName = formDraft.name.trim();
    const normalizedDescription = formDraft.description.trim();
    const normalizedLongDescription = formDraft.longDescription.trim();
    const normalizedTemplateId = formDraft.templateId.trim();
    const normalizedPdfPath = formDraft.pdfPath.trim();
    const normalizedAttachmentName = formDraft.attachmentFileName.trim();

    if (!normalizedCode) errors.code = "Form code is required.";
    else if (!/^[A-Z0-9-]{2,24}$/.test(normalizedCode)) errors.code = "Code must be 2-24 chars (A-Z, 0-9, -).";
    else if (
      editorMode === "add" &&
      formsCatalog.some((form) => String(form.code || "").toUpperCase() === normalizedCode)
    ) errors.code = "Form code already exists.";

    if (!normalizedName) errors.name = "Form name is required.";
    if (!normalizedDescription) errors.description = "Description is required.";
    if (normalizedName.length > 120) errors.name = "Keep form name <= 120 characters.";
    if (normalizedDescription.length > 220) errors.description = "Keep description <= 220 characters.";
    if (normalizedLongDescription.length > 900) errors.longDescription = "Keep long description <= 900 characters.";
    if (!mergedKeywords.length) errors.keywords = "Add at least one keyword.";
    if (!formDraft.validAccountTypeKeys.length) errors.validAccountTypeKeys = "Select one or more account types.";
    if (!formDraft.eSignEnabled && formDraft.docuSignEnabled) errors.docuSignEnabled = "DocuSign requires eSign.";
    if (normalizedPdfPath && !/\\.pdf$/i.test(normalizedPdfPath)) errors.pdfPath = "PDF path must end in .pdf";

    let advancedAttributes = {};
    if (formDraft.advancedJson.trim()) {
      try {
        const parsed = JSON.parse(formDraft.advancedJson.trim());
        if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
          errors.advancedJson = "Advanced attributes must be a JSON object.";
        } else {
          const collisions = Object.keys(parsed).filter((key) => ADMIN_KNOWN_FORM_KEYS.has(key));
          if (collisions.length) errors.advancedJson = `Advanced JSON cannot override: ${collisions.join(", ")}`;
          else advancedAttributes = parsed;
        }
      } catch (error) {
        errors.advancedJson = "Advanced JSON is invalid.";
      }
    }

    if (Object.keys(errors).length) return { errors };

    const baseForm = editorMode === "edit"
      ? (formsCatalog.find((form) => form.code === normalizedCode) || {})
      : {};
    const payload = {
      ...baseForm,
      code: normalizedCode,
      name: normalizedName,
      description: normalizedDescription,
      longDescription: normalizedLongDescription,
      keywords: mergedKeywords,
      requiresAllSigners: Boolean(formDraft.requiresAllSigners),
      eSignEnabled: Boolean(formDraft.eSignEnabled),
      docuSignEnabled: Boolean(formDraft.docuSignEnabled),
      validAccountTypeKeys: [...formDraft.validAccountTypeKeys]
    };

    if (normalizedTemplateId) payload.templateId = normalizedTemplateId; else delete payload.templateId;
    if (normalizedPdfPath) payload.pdfPath = normalizedPdfPath; else delete payload.pdfPath;
    if (normalizedAttachmentName) payload.attachmentFileName = normalizedAttachmentName; else delete payload.attachmentFileName;
    if (!normalizedLongDescription) delete payload.longDescription;

    return { form: { ...payload, ...advancedAttributes }, errors: {} };
  };

  const handleSaveForm = () => {
    const result = validateAndBuildFormPayload();
    if (result.errors && Object.keys(result.errors).length) return setFormErrors(result.errors);

    try {
      const response = onSaveForm(result.form);
      setFormErrors({});
      setEditorMode("edit");
      setSelectedFormCode(result.form.code);
      setFormDraft(mapFormToAdminDraft(result.form));
      setKeywordInput("");
      setToast({ type: "success", message: response?.action === "added" ? "Form added" : "Form updated" });
    } catch (error) {
      setToast({ type: "error", message: error.message || "Unable to save form." });
    }
  };

  const handleSaveOperations = () => {
    const errors = {};
    const nextLabel = operationsDraft.label.trim();
    const nextMessage = operationsDraft.message.trim();
    const nextUpdatedAt = operationsDraft.updatedAt.trim();

    if (!nextLabel) errors.label = "Label is required.";
    if (!nextMessage) errors.message = "Message is required.";
    if (!nextUpdatedAt) errors.updatedAt = "Updated-at text is required.";

    if (Object.keys(errors).length) return setOperationsErrors(errors);

    const saved = onSaveOperationsUpdate({ label: nextLabel, message: nextMessage, updatedAt: nextUpdatedAt });
    setOperationsErrors({});
    setOperationsDraft(saved);
    setToast({ type: "success", message: "Operations update saved" });
  };

  const handleRevertOperations = () => {
    const reset = onResetOperationsUpdate();
    setOperationsDraft(reset);
    setOperationsErrors({});
    setToast({ type: "success", message: "Operations update reverted" });
    setConfirmRevertOps(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Admin</h2>
          <p className="text-sm text-gray-500 mt-1">Prototype admin workspace for forms and operations messaging.</p>
        </div>
        <button onClick={onBack} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to landing
        </button>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(320px,0.88fr)_minmax(0,1.42fr)] items-start">
            <div className="border-b border-gray-200 lg:border-b-0 lg:border-r">
          <div className="p-4 border-b border-gray-100 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-gray-900">Forms catalog</h3>
              <button onClick={beginAddForm} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap">Create new</button>
            </div>
            <input
              type="text"
              value={formSearchQuery}
              onChange={(e) => setFormSearchQuery(e.target.value)}
              placeholder="Filter forms..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="max-h-[min(72vh,860px)] overflow-y-auto divide-y divide-gray-100">
            {filteredForms.length === 0 ? (
              <div className="p-6 text-sm text-gray-500">No forms match your filter.</div>
            ) : (
              filteredForms.map((form) => {
                const isActive = editorMode === "edit" && selectedFormCode === form.code;
                return (
                  <button key={form.code} onClick={() => beginEditForm(form)} className={`w-full text-left px-4 py-2.5 ${isActive ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                    <div className="flex items-start gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0 ${isActive ? "bg-blue-600" : "bg-gray-300"}`} />
                      <span className="text-sm font-medium text-gray-900">{form.name}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 pl-3.5">{form.description}</p>
                  </button>
                );
              })
            )}
          </div>
        </div>

          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">{editorMode === "add" ? "Add form" : `Edit form ${selectedFormCode}`}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Form code</label>
                <input
                  type="text"
                  value={formDraft.code}
                  onChange={(e) => setFormDraft((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  disabled={editorMode === "edit"}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${formErrors.code ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"} ${editorMode === "edit" ? "bg-gray-50 text-gray-500" : ""}`}
                />
                {formErrors.code && <p className="text-xs text-red-600 mt-1">{formErrors.code}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Required signers</label>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg"><input type="radio" checked={!formDraft.requiresAllSigners} onChange={() => setFormDraft((prev) => ({ ...prev, requiresAllSigners: false }))} />Single</label>
                  <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg"><input type="radio" checked={formDraft.requiresAllSigners} onChange={() => setFormDraft((prev) => ({ ...prev, requiresAllSigners: true }))} />All signers</label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Form name</label>
                <input type="text" value={formDraft.name} onChange={(e) => setFormDraft((prev) => ({ ...prev, name: e.target.value }))} className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${formErrors.name ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`} />
                {formErrors.name && <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <textarea rows={2} value={formDraft.description} onChange={(e) => setFormDraft((prev) => ({ ...prev, description: e.target.value }))} className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${formErrors.description ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`} />
                {formErrors.description && <p className="text-xs text-red-600 mt-1">{formErrors.description}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Long description</label>
                <textarea rows={3} value={formDraft.longDescription} onChange={(e) => setFormDraft((prev) => ({ ...prev, longDescription: e.target.value }))} className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${formErrors.longDescription ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`} />
                {formErrors.longDescription && <p className="text-xs text-red-600 mt-1">{formErrors.longDescription}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Keywords</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formDraft.keywords.map((keyword) => (
                  <span key={keyword} className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-blue-50 text-blue-700">
                    {keyword}
                    <button onClick={() => removeKeywordChip(keyword)} className="text-blue-700 hover:text-blue-900">x</button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input type="text" value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addKeywordChip(keywordInput); } }} className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Add keyword and press Enter" />
                <button onClick={() => addKeywordChip(keywordInput)} className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Add</button>
              </div>
              {formErrors.keywords && <p className="text-xs text-red-600 mt-1">{formErrors.keywords}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-700">Flags</p>
                <label className="flex items-center gap-2"><input type="checkbox" checked={formDraft.eSignEnabled} onChange={(e) => setFormDraft((prev) => ({ ...prev, eSignEnabled: e.target.checked }))} />eSign enabled</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={formDraft.docuSignEnabled} onChange={(e) => setFormDraft((prev) => ({ ...prev, docuSignEnabled: e.target.checked }))} />DocuSign enabled</label>
                {formErrors.docuSignEnabled && <p className="text-xs text-red-600">{formErrors.docuSignEnabled}</p>}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-700">Account types</p>
                {ADMIN_ACCOUNT_TYPE_OPTIONS.map((option) => (
                  <label key={option.key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formDraft.validAccountTypeKeys.includes(option.key)}
                      onChange={(e) => setFormDraft((prev) => ({ ...prev, validAccountTypeKeys: e.target.checked ? [...new Set([...prev.validAccountTypeKeys, option.key])] : prev.validAccountTypeKeys.filter((key) => key !== option.key) }))}
                    />
                    {option.label}
                  </label>
                ))}
                {formErrors.validAccountTypeKeys && <p className="text-xs text-red-600">{formErrors.validAccountTypeKeys}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Template ID (optional)</label>
                <input type="text" value={formDraft.templateId} onChange={(e) => setFormDraft((prev) => ({ ...prev, templateId: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">PDF path (optional)</label>
                <input type="text" value={formDraft.pdfPath} onChange={(e) => setFormDraft((prev) => ({ ...prev, pdfPath: e.target.value }))} className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${formErrors.pdfPath ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`} />
                {formErrors.pdfPath && <p className="text-xs text-red-600 mt-1">{formErrors.pdfPath}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Attachment placeholder (PDF)</label>
              <div onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }} onDragLeave={() => setIsDragOver(false)} onDrop={(e) => { e.preventDefault(); setIsDragOver(false); setAttachmentFromFile(e.dataTransfer.files && e.dataTransfer.files[0]); }} className={`border-2 border-dashed rounded-lg p-4 ${isDragOver ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-gray-50"}`}>
                <p className="text-sm text-gray-700">Drag and drop PDF here</p>
                <div className="mt-2 flex items-center gap-3">
                  <button onClick={() => fileInputRef.current && fileInputRef.current.click()} className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">Choose file</button>
                  <span className="text-xs text-gray-500">{formDraft.attachmentFileName || "No file selected"}</span>
                </div>
                <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => setAttachmentFromFile(e.target.files && e.target.files[0])} />
              </div>
              {formDraft.attachmentFileName && <p className="text-xs text-gray-500 mt-2">Preview not available in prototype</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Advanced attributes JSON (optional)</label>
              <textarea rows={4} value={formDraft.advancedJson} onChange={(e) => setFormDraft((prev) => ({ ...prev, advancedJson: e.target.value }))} className={`w-full px-3 py-2 text-sm border rounded-lg font-mono focus:outline-none focus:ring-2 ${formErrors.advancedJson ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`} placeholder='{\"pdfFieldMap\": {...}}' />
              {formErrors.advancedJson && <p className="text-xs text-red-600 mt-1">{formErrors.advancedJson}</p>}
            </div>

            <div className="flex justify-end">
              <button onClick={handleSaveForm} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">{editorMode === "add" ? "Save new form" : "Save changes"}</button>
            </div>
          </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Operations update editor</h3>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Label</label>
              <input type="text" value={operationsDraft.label} onChange={(e) => setOperationsDraft((prev) => ({ ...prev, label: e.target.value }))} className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${operationsErrors.label ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`} />
              {operationsErrors.label && <p className="text-xs text-red-600 mt-1">{operationsErrors.label}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Message</label>
              <textarea rows={3} value={operationsDraft.message} onChange={(e) => setOperationsDraft((prev) => ({ ...prev, message: e.target.value }))} className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${operationsErrors.message ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`} />
              {operationsErrors.message && <p className="text-xs text-red-600 mt-1">{operationsErrors.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Updated at text</label>
              <input type="text" value={operationsDraft.updatedAt} onChange={(e) => setOperationsDraft((prev) => ({ ...prev, updatedAt: e.target.value }))} className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${operationsErrors.updatedAt ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`} />
              {operationsErrors.updatedAt && <p className="text-xs text-red-600 mt-1">{operationsErrors.updatedAt}</p>}
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">Preview</p>
              <div className="operations-glass px-5 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-600 flex-shrink-0" />
                    <p className="text-xs font-semibold tracking-wide text-amber-900">{operationsDraft.label || defaultOperationsUpdate.label}</p>
                  </div>
                  <span className="inline-flex items-center rounded-full border border-amber-400 bg-white/70 px-2 py-0.5 text-[11px] font-medium text-amber-900">
                    {operationsDraft.updatedAt || defaultOperationsUpdate.updatedAt}
                  </span>
                </div>
                <p className="text-sm text-amber-900 mt-1.5">{operationsDraft.message || defaultOperationsUpdate.message}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmRevertOps(true)} className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Revert to default</button>
              <button onClick={handleSaveOperations} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">Save update</button>
            </div>
          </div>
      </div>

      <AdminConfirmModal
        isOpen={confirmRevertOps}
        title="Revert operations update?"
        message="This restores the default operations label, message, and timestamp text."
        confirmLabel="Revert"
        onCancel={() => setConfirmRevertOps(false)}
        onConfirm={handleRevertOperations}
      />

      <div
        className={`fixed bottom-6 right-6 z-40 transition-all duration-300 ease-out ${
          toast ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
        }`}
      >
        {toast && (
          <div className={`rounded-lg shadow-lg border p-4 flex items-center gap-3 min-w-[260px] ${
            toast.type === "success"
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}>
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              toast.type === "success" ? "bg-green-100" : "bg-red-100"
            }`}>
              {toast.type === "success" ? (
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <p className={`text-sm font-medium ${
              toast.type === "success" ? "text-green-900" : "text-red-900"
            }`}>
              {toast.message}
            </p>
            <button
              onClick={() => setToast(null)}
              className="ml-auto p-1 hover:bg-black/5 rounded transition-colors"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
