const PackageView = ({ account, selectedForms, onBack, initialData, onSendForSignature, onSaveDraft }) => {
  const [currentFormIndex, setCurrentFormIndex] = React.useState(0);
  const [formDataMap, setFormDataMap] = React.useState(initialData || {});
  const [formSigners, setFormSigners] = React.useState({});
  const [signerDetails, setSignerDetails] = React.useState({});
  const [expandedForms, setExpandedForms] = React.useState({ [selectedForms[0]]: true });
  const [showSaveDraftModal, setShowSaveDraftModal] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const [isSending, setIsSending] = React.useState(false);
  const [customMessage, setCustomMessage] = React.useState('');

  const MAX_MESSAGE_LENGTH = 150;

  // Auto-dismiss toast
  React.useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const currentFormCode = selectedForms[currentFormIndex];
  const currentFormData = formDataMap[currentFormCode] || {};
  const currentForm = FORMS_DATA.find(f => f.code === currentFormCode);

  // Check if all forms have required signers selected
  const hasRequiredSigners = selectedForms.every(formCode => {
    const form = FORMS_DATA.find(f => f.code === formCode);
    const signers = formSigners[formCode] || [];
    const required = form?.requiresAllSigners ? account.signers.length : 1;
    return signers.length >= required;
  });

  // Initialize signer details with default email and phone
  React.useEffect(() => {
    const defaultDetails = {};
    account.signers.forEach(signer => {
      defaultDetails[signer.id] = {
        email: signer.emails[0],
        phone: signer.phones[0]
      };
    });
    setSignerDetails(defaultDetails);
  }, [account.signers]);

  // Get selected signers for current form
  const selectedSigners = formSigners[currentFormCode] || [];

  const updateFormData = (field, value) => {
    setFormDataMap(prev => ({
      ...prev,
      [currentFormCode]: {
        ...prev[currentFormCode],
        [field]: value
      }
    }));
  };

  const goToNextForm = () => {
    if (currentFormIndex < selectedForms.length - 1) {
      setCurrentFormIndex(currentFormIndex + 1);
    }
  };

  const goToPreviousForm = () => {
    if (currentFormIndex > 0) {
      setCurrentFormIndex(currentFormIndex - 1);
    }
  };

  const handleSaveDraft = (draftName) => {
    console.log('Saving draft:', draftName, formDataMap);

    // Call the parent's save draft handler
    if (onSaveDraft) {
      onSaveDraft(draftName, formDataMap);
    }

    setToast({ message: `Draft "${draftName}" saved`, subtitle: 'Check "My Work" to view your draft' });
  };

  const handleSendForSignature = async () => {
    // Check if all forms have the required signers
    const missingSigners = [];
    selectedForms.forEach(formCode => {
      const form = FORMS_DATA.find(f => f.code === formCode);
      const signers = formSigners[formCode] || [];
      const required = form?.requiresAllSigners ? account.signers.length : 1;

      if (signers.length < required) {
        missingSigners.push(formCode);
      }
    });

    if (missingSigners.length > 0) {
      setToast({ message: 'Signers required', subtitle: `Please select signers for: ${missingSigners.join(', ')}` });
      return;
    }

    // Collect all unique signers across all forms
    const allSigners = Object.values(formSigners).flat();
    const uniqueSigners = Array.from(new Set(allSigners.map(s => s.id)))
      .map(id => allSigners.find(s => s.id === id));

    console.log('Sending for signature:', {
      forms: selectedForms,
      formSigners: formSigners,
      formData: formDataMap
    });

    // Call the parent's send for signature handler
    if (onSendForSignature) {
      setIsSending(true);
      try {
        await onSendForSignature({
          forms: selectedForms,
          signers: uniqueSigners,
          formData: formDataMap,
          customMessage: customMessage.trim(),
          signerDetails: signerDetails
        });
      } finally {
        setIsSending(false);
      }
    }
  };

  const toggleSigner = (formCode, signer) => {
    setFormSigners(prev => {
      const currentSigners = prev[formCode] || [];
      const exists = currentSigners.find(s => s.id === signer.id);
      const form = FORMS_DATA.find(f => f.code === formCode);

      if (exists) {
        return {
          ...prev,
          [formCode]: currentSigners.filter(s => s.id !== signer.id)
        };
      } else {
        // If form requires only one signer (requiresAllSigners: false), replace the selection
        if (form && !form.requiresAllSigners) {
          return {
            ...prev,
            [formCode]: [signer]
          };
        }
        return {
          ...prev,
          [formCode]: [...currentSigners, signer]
        };
      }
    });
  };

  const updateSignerDetail = (signerId, field, value) => {
    setSignerDetails(prev => ({
      ...prev,
      [signerId]: {
        ...prev[signerId],
        [field]: value
      }
    }));
  };

  const toggleFormExpansion = (formCode) => {
    setExpandedForms(prev => ({
      ...prev,
      [formCode]: !prev[formCode]
    }));
  };

  const getSignerRequirementText = (form) => {
    if (form.requiresAllSigners) {
      return `All signers required`;
    }
    return `One signer required`;
  };

  const renderFormComponent = () => {
    switch (currentFormCode) {
      case 'AC-TF':
        return (
          <ACTFForm
            formData={currentFormData}
            onUpdateField={updateFormData}
            selectedSigners={selectedSigners}
            account={account}
          />
        );
      case 'AC-FT':
        return (
          <ACFTForm
            formData={currentFormData}
            onUpdateField={updateFormData}
            selectedSigners={selectedSigners}
            account={account}
          />
        );
      case 'CL-ACRA':
        return (
          <CLACRAForm
            formData={currentFormData}
            onUpdateField={updateFormData}
            selectedSigners={selectedSigners}
            account={account}
          />
        );
      case 'LA-GEN':
        return (
          <LAGENForm
            formData={currentFormData}
            onUpdateField={updateFormData}
            selectedSigners={selectedSigners}
            account={account}
          />
        );
      default:
        return (
          <div className="bg-white shadow-lg max-w-3xl mx-auto p-8">
            <div className="border-b-2 border-gray-900 pb-4">
              <h2 className="text-xl font-bold">{currentForm?.name}</h2>
              <p className="text-sm text-gray-600 mt-1">{currentForm?.description}</p>
            </div>
            <div className="mt-6 p-8 bg-gray-50 rounded text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600">Form preview coming soon</p>
              <p className="text-sm text-gray-500 mt-2">This form will be available for editing in the next release</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div>
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to form selection
        </button>
      </div>

      {/* Main content with sidebar */}
      <div className="flex gap-4">
        {/* Form content - Left side */}
        <div className="flex-1 space-y-4">
          {renderFormComponent()}

          {/* Navigation buttons */}
          {selectedForms.length > 1 && (
            <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <button
                onClick={goToPreviousForm}
                disabled={currentFormIndex === 0}
                className={`px-4 py-2 text-sm rounded-lg flex items-center gap-2 ${
                  currentFormIndex === 0
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous Form
              </button>

              <button
                onClick={goToNextForm}
                disabled={currentFormIndex === selectedForms.length - 1}
                className={`px-4 py-2 text-sm rounded-lg flex items-center gap-2 ${
                  currentFormIndex === selectedForms.length - 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-blue-600 hover:bg-blue-50 font-medium'
                }`}
              >
                Next Form
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Sidebar - Right side */}
        <div className="w-96 space-y-4">
          {/* Signer Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Select Signers</h3>
            <div className="space-y-3 mb-6">
              {selectedForms.map((formCode, formIndex) => {
                const form = FORMS_DATA.find(f => f.code === formCode);
                const isExpanded = expandedForms[formCode];
                const isCurrentForm = formIndex === currentFormIndex;
                const formSignersList = formSigners[formCode] || [];

                return (
                  <div key={formCode} className="border border-gray-200 rounded">
                    {/* Form header */}
                    <div
                      onClick={() => toggleFormExpansion(formCode)}
                      className="flex items-start gap-2 p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <svg
                        className={`w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0 transition-transform ${
                          isExpanded ? 'transform rotate-90' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${isCurrentForm ? 'text-blue-600' : 'text-gray-900'}`}>
                            Form {formIndex + 1}: {form?.name}
                          </span>
                          {isCurrentForm && (
                            <span className="text-xs text-blue-600">← Currently viewing</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-600 mt-0.5">
                          {form?.code}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {getSignerRequirementText(form)}
                        </div>
                      </div>
                    </div>

                    {/* Signers list - shown when expanded */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 px-3 py-2 space-y-3">
                        {account.signers.map(signer => {
                          const isSelected = formSignersList.find(s => s.id === signer.id);
                          return (
                            <div key={signer.id} className="space-y-2">
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSigner(formCode, signer);
                                }}
                                className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-blue-50'
                                    : 'hover:bg-gray-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={!!isSelected}
                                  onChange={() => {}}
                                  className="w-4 h-4 text-blue-600 rounded pointer-events-none"
                                />
                                <span className="text-sm text-gray-900">{signer.name}</span>
                              </div>

                              {isSelected && (
                                <div className="ml-6 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-600 w-12">Email</span>
                                    <select
                                      value={signerDetails[signer.id]?.email || signer.emails[0]}
                                      onChange={(e) => updateSignerDetail(signer.id, 'email', e.target.value)}
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                      {signer.emails.map(email => (
                                        <option key={email} value={email}>{email}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-600 w-12">Phone</span>
                                    <select
                                      value={signerDetails[signer.id]?.phone || signer.phones[0]}
                                      onChange={(e) => updateSignerDetail(signer.id, 'phone', e.target.value)}
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                      {signer.phones.map(phone => (
                                        <option key={phone} value={phone}>{phone}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Custom Message */}
            <div className="pt-4 border-t border-gray-200">
              <div className="relative">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Personal Message
                </label>
                <div className="relative">
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
                    disabled={!hasRequiredSigners}
                    placeholder={hasRequiredSigners ? "Add a note for the signer..." : ""}
                    rows={2}
                    className={`w-full px-3 py-2 text-sm border rounded-lg resize-none transition-all ${
                      hasRequiredSigners
                        ? 'border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                    }`}
                  />
                  {!hasRequiredSigners && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
                {hasRequiredSigners && (
                  <div className="flex justify-end mt-1">
                    <span className={`text-xs ${customMessage.length >= MAX_MESSAGE_LENGTH ? 'text-amber-600' : 'text-gray-400'}`}>
                      {customMessage.length}/{MAX_MESSAGE_LENGTH}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowSaveDraftModal(true)}
                className="w-full px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save Draft
              </button>

              <button
                onClick={handleSendForSignature}
                disabled={isSending}
                className={`w-full px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm flex items-center justify-center gap-2 font-medium transition-all ${
                  isSending ? 'opacity-75 cursor-not-allowed' : 'hover:bg-blue-700'
                }`}
              >
                {isSending ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
                {isSending ? 'Sending...' : 'Send for Signature'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Draft Modal */}
      <SaveDraftModal
        isOpen={showSaveDraftModal}
        onClose={() => setShowSaveDraftModal(false)}
        onSave={handleSaveDraft}
      />

      {/* Toast Notification */}
      <div
        className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ease-out ${
          toast ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
        }`}
      >
        {toast && (
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 flex items-start gap-3 min-w-[320px]">
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{toast.message}</p>
              {toast.subtitle && (
                <p className="text-sm text-gray-500 mt-0.5">{toast.subtitle}</p>
              )}
            </div>
            <button
              onClick={() => setToast(null)}
              className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
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
