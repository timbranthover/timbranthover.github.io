const PackageView = ({ account, selectedForms, onBack, initialData, onSendForSignature, onSaveDraft }) => {
  const [currentFormIndex, setCurrentFormIndex] = React.useState(0);
  const [formDataMap, setFormDataMap] = React.useState(initialData || {});
  const [formSigners, setFormSigners] = React.useState({});
  const [signerDetails, setSignerDetails] = React.useState({});
  const [expandedForms, setExpandedForms] = React.useState({ [selectedForms[0]]: true });
  const [showSaveDraftModal, setShowSaveDraftModal] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [customMessage, setCustomMessage] = React.useState('');
  const [signerOrder, setSignerOrder] = React.useState([]);

  const MAX_MESSAGE_LENGTH = 150;

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

  // How many additional signers are still needed (drives the tooltip)
  const signerShortfall = hasRequiredSigners ? 0 : selectedForms.reduce((total, formCode) => {
    const form = FORMS_DATA.find(f => f.code === formCode);
    const signers = formSigners[formCode] || [];
    const required = form?.requiresAllSigners ? account.signers.length : 1;
    return total + Math.max(0, required - signers.length);
  }, 0);

  // Get unique signers across all forms
  const uniqueSelectedSigners = React.useMemo(() => {
    const allSigners = Object.values(formSigners).flat();
    const uniqueIds = [...new Set(allSigners.map(s => s.id))];
    return uniqueIds.map(id => allSigners.find(s => s.id === id));
  }, [formSigners]);

  // Update signer order when signers change
  React.useEffect(() => {
    const currentIds = uniqueSelectedSigners.map(s => s.id);
    setSignerOrder(prev => {
      // Keep existing order for signers still selected, add new ones at end
      const kept = prev.filter(id => currentIds.includes(id));
      const newIds = currentIds.filter(id => !prev.includes(id));
      return [...kept, ...newIds];
    });
  }, [uniqueSelectedSigners]);

  // Reorder helper functions
  const moveSignerUp = (signerId) => {
    setSignerOrder(prev => {
      const idx = prev.indexOf(signerId);
      if (idx <= 0) return prev;
      const newOrder = [...prev];
      [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
      return newOrder;
    });
  };

  const moveSignerDown = (signerId) => {
    setSignerOrder(prev => {
      const idx = prev.indexOf(signerId);
      if (idx >= prev.length - 1) return prev;
      const newOrder = [...prev];
      [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
      return newOrder;
    });
  };

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

    showToast({ message: `Draft "${draftName}" saved`, subtitle: 'Check "My work" to view your draft' });
  };

  const handleSendForSignature = async () => {
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
          signerDetails: signerDetails,
          // Sequential signing is always on when 2+ signers (legal requirement).
          // To re-enable parallel: add back a sequentialSigning state toggle,
          // surface it as a UI option, and pass it here instead of the derived value.
          sequentialSigning: uniqueSelectedSigners.length >= 2,
          signerOrder: uniqueSelectedSigners.length >= 2 ? signerOrder : null
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
          <div className="mobile-form-shell bg-white shadow-lg max-w-3xl mx-auto p-8">
            <div className="border-b-2 border-[#404040] pb-4">
              <h2 className="text-xl font-bold">{currentForm?.name}</h2>
              <p className="text-sm text-[#7A7870] mt-1">{currentForm?.description}</p>
            </div>
            <div className="mt-6 p-8 bg-[#F5F0E1] rounded text-center">
              <svg className="w-16 h-16 text-[#B8B3A2] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-[#7A7870]">Form preview coming soon</p>
              <p className="text-sm text-[#8E8D83] mt-2">This form will be available for editing in the next release</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="mobile-package-view">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="text-sm hover:underline flex items-center gap-1"
          style={{ color: '#00759E' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to form selection
        </button>
      </div>

      {/* Main content with sidebar */}
      <div className="mobile-package-layout flex gap-4">
        {/* Form content - Left side */}
        <div className="flex-1 space-y-4">
          {renderFormComponent()}

          {/* Navigation buttons */}
          {selectedForms.length > 1 && (
            <div className="mobile-form-nav flex items-center justify-between bg-white rounded-lg shadow-sm border border-[#CCCABC] p-4">
              <button
                onClick={goToPreviousForm}
                disabled={currentFormIndex === 0}
                className={`px-4 py-2 text-sm rounded-lg flex items-center gap-2 ${
                  currentFormIndex === 0
                    ? 'text-[#B8B3A2] cursor-not-allowed'
                    : 'text-[#5A5D5C] hover:bg-[#ECEBE4]'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous form
              </button>

              <button
                onClick={goToNextForm}
                disabled={currentFormIndex === selectedForms.length - 1}
                className={`px-4 py-2 text-sm rounded-lg flex items-center gap-2 ${
                  currentFormIndex === selectedForms.length - 1
                    ? 'text-[#B8B3A2] cursor-not-allowed'
                    : 'text-[#5A5D5C] hover:bg-[#ECEBE4] font-medium'
                }`}
              >
                Next form
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Sidebar - Right side */}
        <div className="mobile-package-sidebar w-96 space-y-4">
          {/* Signer Selection */}
          <div className="mobile-package-sidebar-panel bg-white rounded-lg shadow-sm border border-[#CCCABC] p-4 sticky top-6">
            <h3 className="text-sm font-semibold text-[#404040] mb-4">Select signers</h3>
            <div className="space-y-3 mb-6">
              {selectedForms.map((formCode, formIndex) => {
                const form = FORMS_DATA.find(f => f.code === formCode);
                const isExpanded = expandedForms[formCode];
                const isCurrentForm = formIndex === currentFormIndex;
                const formSignersList = formSigners[formCode] || [];

                // When 2+ signers are selected package-wide, render selected
                // signers first in true signing order, unselected signers below
                const displaySigners = uniqueSelectedSigners.length >= 2
                  ? [
                      ...signerOrder
                        .filter(id => formSignersList.find(s => s.id === id))
                        .map(id => account.signers.find(s => s.id === id))
                        .filter(Boolean),
                      ...account.signers.filter(s => !formSignersList.find(fs => fs.id === s.id))
                    ]
                  : account.signers;

                return (
                  <div key={formCode} className="border border-[#CCCABC] rounded">
                    {/* Form header */}
                    <div
                      onClick={() => toggleFormExpansion(formCode)}
                      className="flex items-start gap-2 p-3 cursor-pointer hover:bg-[#ECEBE4] transition-colors"
                    >
                      <svg
                        className={`w-4 h-4 text-[#7A7870] mt-0.5 flex-shrink-0 transition-transform ${
                          isExpanded ? 'transform rotate-90' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <div className="mobile-form-header-row flex items-center gap-2">
                          <span className={`text-sm font-medium ${isCurrentForm ? 'text-[#5A5D5C]' : 'text-[#404040]'}`}>
                            Form {formIndex + 1}: {form?.name}
                          </span>
                          {isCurrentForm && (
                            <span className="text-xs text-[#5A5D5C]">← Currently viewing</span>
                          )}
                        </div>
                        <div className="text-xs text-[#7A7870] mt-0.5">
                          {form?.code}
                        </div>
                        <div className="text-xs text-[#8E8D83] mt-1">
                          {getSignerRequirementText(form)}
                        </div>
                      </div>
                    </div>

                    {/* Signers list - shown when expanded */}
                    {isExpanded && (
                      <div className="border-t border-[#CCCABC] px-3 py-2 space-y-3">
                        {displaySigners.map(signer => {
                          const isSelected = formSignersList.find(s => s.id === signer.id);
                          const orderIndex = signerOrder.indexOf(signer.id);
                          const showOrder = isSelected && uniqueSelectedSigners.length >= 2;
                          return (
                            <div key={signer.id} className="space-y-2">
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSigner(formCode, signer);
                                }}
                                className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-[#F5F0E1]'
                                    : 'hover:bg-[#ECEBE4]'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={!!isSelected}
                                  onChange={() => {}}
                                  className="w-4 h-4 accent-[#404040] rounded pointer-events-none"
                                />
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 transition-all ${
                                  showOrder ? 'bg-[#ECEBE4] text-[#5A5D5C]' : 'opacity-0'
                                }`}>
                                  {showOrder ? orderIndex + 1 : ''}
                                </span>
                                <span className="text-sm text-[#404040] flex-1">{signer.name}</span>
                                <div className={`flex gap-0.5 transition-opacity ${showOrder ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => moveSignerUp(signer.id)}
                                    disabled={orderIndex === 0}
                                    className={`p-1 rounded transition-colors ${
                                      orderIndex === 0
                                        ? 'text-[#CCCABC] cursor-not-allowed'
                                        : 'text-[#8E8D83] hover:bg-[#ECEBE4] hover:text-[#5A5D5C]'
                                    }`}
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => moveSignerDown(signer.id)}
                                    disabled={orderIndex === signerOrder.length - 1}
                                    className={`p-1 rounded transition-colors ${
                                      orderIndex === signerOrder.length - 1
                                        ? 'text-[#CCCABC] cursor-not-allowed'
                                        : 'text-[#8E8D83] hover:bg-[#ECEBE4] hover:text-[#5A5D5C]'
                                    }`}
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                </div>
                              </div>

                              {isSelected && (
                                <div className="ml-6 space-y-2">
                                  <div className="mobile-signer-detail-row flex items-center gap-2">
                                    <span className="mobile-signer-detail-label text-xs text-[#7A7870] w-12">Email</span>
                                    <select
                                      value={signerDetails[signer.id]?.email || signer.emails[0]}
                                      onChange={(e) => updateSignerDetail(signer.id, 'email', e.target.value)}
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex-1 px-2 py-1 text-xs border border-[#CCCABC] rounded focus:outline-none focus:ring-1 focus:ring-[#B8B3A2]"
                                    >
                                      {signer.emails.map(email => (
                                        <option key={email} value={email}>{email}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="mobile-signer-detail-row flex items-center gap-2">
                                    <span className="mobile-signer-detail-label text-xs text-[#7A7870] w-12">Phone</span>
                                    <select
                                      value={signerDetails[signer.id]?.phone || signer.phones[0]}
                                      onChange={(e) => updateSignerDetail(signer.id, 'phone', e.target.value)}
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex-1 px-2 py-1 text-xs border border-[#CCCABC] rounded focus:outline-none focus:ring-1 focus:ring-[#B8B3A2]"
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
            <div className="pt-4 border-t border-[#CCCABC]">
              <div className="relative">
                <label className="block text-xs font-medium text-[#5A5D5C] mb-1.5">
                  Personal message
                </label>
                <div className="relative">
                  <textarea
                    value={hasRequiredSigners ? customMessage : ''}
                    onChange={(e) => setCustomMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
                    disabled={!hasRequiredSigners}
                    placeholder={hasRequiredSigners ? "Add a note for the signer..." : ""}
                    rows={2}
                    className={`w-full px-3 py-2 text-sm border rounded-lg resize-none transition-all ${
                      hasRequiredSigners
                        ? 'border-[#CCCABC] bg-white focus:outline-none focus:ring-2 focus:ring-[#B8B3A2] focus:border-transparent'
                        : 'border-[#CCCABC] bg-[#F5F0E1] cursor-not-allowed'
                    }`}
                  />
                  {!hasRequiredSigners && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-8 h-8 bg-[#ECEBE4] rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#B8B3A2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
                {hasRequiredSigners && (
                  <div className="flex justify-end mt-1">
                    <span className={`text-xs ${customMessage.length >= MAX_MESSAGE_LENGTH ? 'text-[#AF8626]' : 'text-[#B8B3A2]'}`}>
                      {customMessage.length}/{MAX_MESSAGE_LENGTH}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2 pt-4 border-t border-[#CCCABC]">
              <button
                onClick={() => setShowSaveDraftModal(true)}
                className="w-full px-4 py-2 text-sm text-[#5A5D5C] bg-white border border-[#CCCABC] rounded-lg hover:bg-[#ECEBE4] flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save draft
              </button>

              <div className="relative group">
                <button
                  onClick={handleSendForSignature}
                  disabled={isSending || !hasRequiredSigners}
                  className={`w-full px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-all ${
                    !hasRequiredSigners
                      ? 'bg-[#ECEBE4] text-[#8E8D83] cursor-not-allowed pointer-events-none'
                      : isSending
                        ? 'bg-[#E60000] text-white shadow-sm opacity-75 cursor-not-allowed'
                        : 'bg-[#E60000] text-white shadow-sm hover:bg-[#BD000C]'
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
                  {isSending ? 'Sending...' : 'Send for signature'}
                </button>
                {!hasRequiredSigners && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-[#404040] bg-opacity-90 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                    Select {signerShortfall} more {signerShortfall === 1 ? 'signer' : 'signers'} to continue
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-[#404040]"></div>
                  </div>
                )}
              </div>
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

    </div>
  );
};
