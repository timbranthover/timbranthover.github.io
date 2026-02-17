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
      <div className="bg-white border border-[#CCCABC] rounded-xl shadow-xl max-w-md w-full p-5">
        <h3 className="text-base font-semibold text-[#404040]">{title}</h3>
        <p className="text-sm text-[#7A7870] mt-2">{message}</p>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onCancel} className="px-3 py-2 text-sm rounded-lg border border-[#CCCABC] text-[#5A5D5C] hover:bg-[#ECEBE4]">
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
  const [operationsErrors, setOperationsErrors] = React.useState({});
  const fileInputRef = React.useRef(null);

  const [operationsDraft, setOperationsDraft] = React.useState({
    label: operationsUpdate?.label || "",
    message: operationsUpdate?.message || "",
    updatedAt: operationsUpdate?.updatedAt || ""
  });

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
      showToast({ type: "success", message: response?.action === "added" ? "Form added" : "Form updated" });
    } catch (error) {
      showToast({ type: "error", message: error.message || "Unable to save form." });
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
    showToast({ type: "success", message: "Operations update saved" });
  };

  const handleRevertOperations = () => {
    const reset = onResetOperationsUpdate();
    setOperationsDraft(reset);
    setOperationsErrors({});
    showToast({ type: "success", message: "Operations update reverted" });
    setConfirmRevertOps(false);
  };

  return (
    <div className="mobile-admin-view space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#404040]">Admin</h2>
          <p className="text-sm text-[#8E8D83] mt-1">Prototype admin workspace for forms and operations messaging.</p>
        </div>
        <button onClick={onBack} className="text-sm hover:underline flex items-center gap-1" style={{ color: 'var(--ubs-gray-5)' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to landing
        </button>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-[#CCCABC] shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(320px,0.88fr)_minmax(0,1.42fr)] items-start">
            <div className="border-b border-[#CCCABC] lg:border-b-0 lg:border-r">
          <div className="p-4 border-b border-[#CCCABC]/50 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[#404040]">Forms catalog</h3>
              <button onClick={beginAddForm} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#404040] text-white hover:bg-[#333333] whitespace-nowrap">Create new</button>
            </div>
            <input
              type="text"
              value={formSearchQuery}
              onChange={(e) => setFormSearchQuery(e.target.value)}
              placeholder="Filter forms..."
              className="w-full px-3 py-2 text-sm border border-[#CCCABC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B8B3A2]"
            />
          </div>
          <div className="max-h-[min(72vh,860px)] overflow-y-auto divide-y divide-[#CCCABC]/50">
            {filteredForms.length === 0 ? (
              <div className="p-6 text-sm text-[#8E8D83]">No forms match your filter.</div>
            ) : (
              filteredForms.map((form) => {
                const isActive = editorMode === "edit" && selectedFormCode === form.code;
                return (
                  <button key={form.code} onClick={() => beginEditForm(form)} className={`w-full text-left px-4 py-2.5 ${isActive ? "bg-[#F5F0E1]" : "hover:bg-[#ECEBE4]"}`}>
                    <div className="flex items-start gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0 ${isActive ? "bg-[#5A5D5C]" : "bg-[#CCCABC]"}`} />
                      <span className="text-sm font-medium text-[#404040]">{form.name}</span>
                    </div>
                    <p className="text-xs text-[#8E8D83] mt-0.5 pl-3.5">{form.description}</p>
                  </button>
                );
              })
            )}
          </div>
        </div>

          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#404040]">{editorMode === "add" ? "Add form" : `Edit form ${selectedFormCode}`}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#5A5D5C] mb-1">Form code</label>
                <input
                  type="text"
                  value={formDraft.code}
                  onChange={(e) => setFormDraft((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  disabled={editorMode === "edit"}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${formErrors.code ? "border-red-300 focus:ring-red-500" : "border-[#CCCABC] focus:ring-[#B8B3A2]"} ${editorMode === "edit" ? "bg-[#F5F0E1] text-[#8E8D83]" : ""}`}
                />
                {formErrors.code && <p className="text-xs text-red-600 mt-1">{formErrors.code}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A5D5C] mb-1">Required signers</label>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <label className="flex items-center gap-2 px-3 py-2 border border-[#CCCABC] rounded-lg"><input type="radio" checked={!formDraft.requiresAllSigners} onChange={() => setFormDraft((prev) => ({ ...prev, requiresAllSigners: false }))} />Single</label>
                  <label className="flex items-center gap-2 px-3 py-2 border border-[#CCCABC] rounded-lg"><input type="radio" checked={formDraft.requiresAllSigners} onChange={() => setFormDraft((prev) => ({ ...prev, requiresAllSigners: true }))} />All signers</label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#5A5D5C] mb-1">Form name</label>
                <input type="text" value={formDraft.name} onChange={(e) => setFormDraft((prev) => ({ ...prev, name: e.target.value }))} className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${formErrors.name ? "border-red-300 focus:ring-red-500" : "border-[#CCCABC] focus:ring-[#B8B3A2]"}`} />
                {formErrors.name && <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A5D5C] mb-1">Description</label>
                <textarea rows={2} value={formDraft.description} onChange={(e) => setFormDraft((prev) => ({ ...prev, description: e.target.value }))} className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${formErrors.description ? "border-red-300 focus:ring-red-500" : "border-[#CCCABC] focus:ring-[#B8B3A2]"}`} />
                {formErrors.description && <p className="text-xs text-red-600 mt-1">{formErrors.description}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A5D5C] mb-1">Long description</label>
                <textarea rows={3} value={formDraft.longDescription} onChange={(e) => setFormDraft((prev) => ({ ...prev, longDescription: e.target.value }))} className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${formErrors.longDescription ? "border-red-300 focus:ring-red-500" : "border-[#CCCABC] focus:ring-[#B8B3A2]"}`} />
                {formErrors.longDescription && <p className="text-xs text-red-600 mt-1">{formErrors.longDescription}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5A5D5C] mb-1">Keywords</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formDraft.keywords.map((keyword) => (
                  <span key={keyword} className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-[#F5F0E1] text-[#5A5D5C]">
                    {keyword}
                    <button onClick={() => removeKeywordChip(keyword)} className="text-[#5A5D5C] hover:text-[#404040]">x</button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input type="text" value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addKeywordChip(keywordInput); } }} className="flex-1 px-3 py-2 text-sm border border-[#CCCABC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B8B3A2]" placeholder="Add keyword and press Enter" />
                <button onClick={() => addKeywordChip(keywordInput)} className="px-3 py-2 text-sm rounded-lg border border-[#CCCABC] text-[#5A5D5C] hover:bg-[#ECEBE4]">Add</button>
              </div>
              {formErrors.keywords && <p className="text-xs text-red-600 mt-1">{formErrors.keywords}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#5A5D5C]">Flags</p>
                <label className="flex items-center gap-2"><input type="checkbox" checked={formDraft.eSignEnabled} onChange={(e) => setFormDraft((prev) => ({ ...prev, eSignEnabled: e.target.checked }))} />eSign enabled</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={formDraft.docuSignEnabled} onChange={(e) => setFormDraft((prev) => ({ ...prev, docuSignEnabled: e.target.checked }))} />DocuSign enabled</label>
                {formErrors.docuSignEnabled && <p className="text-xs text-red-600">{formErrors.docuSignEnabled}</p>}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#5A5D5C]">Account types</p>
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
                <label className="block text-xs font-semibold text-[#5A5D5C] mb-1">Template ID (optional)</label>
                <input type="text" value={formDraft.templateId} onChange={(e) => setFormDraft((prev) => ({ ...prev, templateId: e.target.value }))} className="w-full px-3 py-2 text-sm border border-[#CCCABC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B8B3A2]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A5D5C] mb-1">PDF path (optional)</label>
                <input type="text" value={formDraft.pdfPath} onChange={(e) => setFormDraft((prev) => ({ ...prev, pdfPath: e.target.value }))} className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${formErrors.pdfPath ? "border-red-300 focus:ring-red-500" : "border-[#CCCABC] focus:ring-[#B8B3A2]"}`} />
                {formErrors.pdfPath && <p className="text-xs text-red-600 mt-1">{formErrors.pdfPath}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5A5D5C] mb-1">Attachment placeholder (PDF)</label>
              <div onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }} onDragLeave={() => setIsDragOver(false)} onDrop={(e) => { e.preventDefault(); setIsDragOver(false); setAttachmentFromFile(e.dataTransfer.files && e.dataTransfer.files[0]); }} className={`border-2 border-dashed rounded-lg p-4 ${isDragOver ? "border-[#B8B3A2] bg-[#F5F0E1]" : "border-[#CCCABC] bg-[#ECEBE4]"}`}>
                <p className="text-sm text-[#5A5D5C]">Drag and drop PDF here</p>
                <div className="mt-2 flex items-center gap-3">
                  <button onClick={() => fileInputRef.current && fileInputRef.current.click()} className="px-3 py-1.5 text-xs rounded-lg border border-[#CCCABC] bg-white text-[#5A5D5C] hover:bg-[#ECEBE4]">Choose file</button>
                  <span className="text-xs text-[#8E8D83]">{formDraft.attachmentFileName || "No file selected"}</span>
                </div>
                <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => setAttachmentFromFile(e.target.files && e.target.files[0])} />
              </div>
              {formDraft.attachmentFileName && <p className="text-xs text-[#8E8D83] mt-2">Preview not available in prototype</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5A5D5C] mb-1">Advanced attributes JSON (optional)</label>
              <textarea rows={4} value={formDraft.advancedJson} onChange={(e) => setFormDraft((prev) => ({ ...prev, advancedJson: e.target.value }))} className={`w-full px-3 py-2 text-sm border rounded-lg font-mono focus:outline-none focus:ring-2 ${formErrors.advancedJson ? "border-red-300 focus:ring-red-500" : "border-[#CCCABC] focus:ring-[#B8B3A2]"}`} placeholder='{\"pdfFieldMap\": {...}}' />
              {formErrors.advancedJson && <p className="text-xs text-red-600 mt-1">{formErrors.advancedJson}</p>}
            </div>

            <div className="flex justify-end">
              <button onClick={handleSaveForm} className="px-4 py-2 text-sm rounded-lg bg-[#404040] text-white hover:bg-[#333333]">{editorMode === "add" ? "Save new form" : "Save changes"}</button>
            </div>
          </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#CCCABC] shadow-sm p-5 space-y-4">
            <h3 className="text-base font-semibold text-[#404040]">Operations update editor</h3>
            <div>
              <label className="block text-xs font-semibold text-[#5A5D5C] mb-1">Label</label>
              <input type="text" value={operationsDraft.label} onChange={(e) => setOperationsDraft((prev) => ({ ...prev, label: e.target.value }))} className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${operationsErrors.label ? "border-red-300 focus:ring-red-500" : "border-[#CCCABC] focus:ring-[#B8B3A2]"}`} />
              {operationsErrors.label && <p className="text-xs text-red-600 mt-1">{operationsErrors.label}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5A5D5C] mb-1">Message</label>
              <textarea rows={3} value={operationsDraft.message} onChange={(e) => setOperationsDraft((prev) => ({ ...prev, message: e.target.value }))} className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${operationsErrors.message ? "border-red-300 focus:ring-red-500" : "border-[#CCCABC] focus:ring-[#B8B3A2]"}`} />
              {operationsErrors.message && <p className="text-xs text-red-600 mt-1">{operationsErrors.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5A5D5C] mb-1">Updated at text</label>
              <input type="text" value={operationsDraft.updatedAt} onChange={(e) => setOperationsDraft((prev) => ({ ...prev, updatedAt: e.target.value }))} className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${operationsErrors.updatedAt ? "border-red-300 focus:ring-red-500" : "border-[#CCCABC] focus:ring-[#B8B3A2]"}`} />
              {operationsErrors.updatedAt && <p className="text-xs text-red-600 mt-1">{operationsErrors.updatedAt}</p>}
            </div>

            <div>
              <p className="text-xs font-semibold text-[#5A5D5C] mb-2">Preview</p>
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
              <button onClick={() => setConfirmRevertOps(true)} className="px-3 py-2 text-sm rounded-lg border border-[#CCCABC] text-[#5A5D5C] hover:bg-[#ECEBE4]">Revert to default</button>
              <button onClick={handleSaveOperations} className="px-4 py-2 text-sm rounded-lg bg-[#404040] text-white hover:bg-[#333333]">Save update</button>
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

    </div>
  );
};
