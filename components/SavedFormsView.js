const SavedFormsView = ({
  onBack,
  onBrowseForms = () => {},
  onContinue,
  savedFormCodes = [],
  onToggleSaveForm,
  initialAccountNumber = ''
}) => {
  const [selectedFormCode, setSelectedFormCode] = React.useState(null);
  const [selectedForms, setSelectedForms] = React.useState([]);
  const [accountInput, setAccountInput] = React.useState(initialAccountNumber);
  const [accountError, setAccountError] = React.useState(null);

  const savedForms = React.useMemo(() => {
    const codeSet = new Set(savedFormCodes);
    return FORMS_DATA
      .filter((form) => codeSet.has(form.code))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [savedFormCodes]);

  const normalizedAccount = accountInput.trim().toUpperCase();
  const resolvedAccount = normalizedAccount ? MOCK_ACCOUNTS[normalizedAccount] : null;

  React.useEffect(() => {
    if (selectedFormCode && !savedForms.some((form) => form.code === selectedFormCode)) {
      setSelectedFormCode(null);
    }
  }, [savedForms, selectedFormCode]);

  React.useEffect(() => {
    const currentCodes = new Set(savedForms.map((form) => form.code));
    setSelectedForms((prev) => prev.filter((code) => currentCodes.has(code)));
  }, [savedForms]);

  const toggleFormSelection = (form) => {
    if (!form.eSignEnabled) return;

    setSelectedForms((prev) => (
      prev.includes(form.code)
        ? prev.filter((code) => code !== form.code)
        : [...prev, form.code]
    ));
  };

  const handleContinue = () => {
    if (!selectedForms.length) return;

    if (!resolvedAccount) {
      setAccountError('Enter a valid account/UAN to continue.');
      return;
    }

    if (onContinue) {
      onContinue(selectedForms, resolvedAccount);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Saved Forms</h2>
          <p className="text-sm text-gray-500 mt-1">Quick access to your saved forms list</p>
        </div>

        <div className="ml-auto flex flex-col items-end gap-3">
          <button
            onClick={onBack}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to search
          </button>

          {selectedForms.length > 0 && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {selectedForms.length} form{selectedForms.length > 1 ? 's' : ''} selected
              </span>
              <button
                onClick={handleContinue}
                disabled={!resolvedAccount || !selectedForms.length}
                className={`px-6 py-2 rounded-lg flex items-center gap-2 font-medium transition-all ${
                  !resolvedAccount || !selectedForms.length
                    ? 'bg-blue-100 text-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Continue with {selectedForms.length} form{selectedForms.length > 1 ? 's' : ''}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Account/UAN for package</label>
          <input
            type="text"
            placeholder="e.g. ABC123"
            value={accountInput}
            onChange={(e) => {
              setAccountInput(e.target.value);
              if (accountError) setAccountError(null);
            }}
            className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              accountError ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {accountError && <p className="text-xs text-red-600 mt-1.5">{accountError}</p>}
          {resolvedAccount && (
            <p className="text-xs text-green-700 mt-1.5">
              {resolvedAccount.accountNumber} - {resolvedAccount.accountName} ({resolvedAccount.accountType})
            </p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {savedForms.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <p className="text-gray-500">No saved forms yet</p>
            <button
              onClick={onBrowseForms}
              className="text-sm text-blue-600 hover:text-blue-700 mt-2"
            >
              Browse forms library
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {savedForms.map((form) => {
              const isSaved = savedFormCodes.includes(form.code);
              const isSelected = selectedForms.includes(form.code);
              const isExpanded = selectedFormCode === form.code;

              return (
                <div
                  key={form.code}
                  onClick={() => toggleFormSelection(form)}
                  className={`px-4 py-4 transition-all ${
                    form.eSignEnabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'
                  } ${
                    isSelected ? 'bg-blue-50 border-l-2 border-blue-500' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          disabled={!form.eSignEnabled}
                          className="w-5 h-5 mt-0.5 text-blue-600 rounded pointer-events-none"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-mono font-medium">
                              {form.code}
                            </span>
                            <h3 className="font-medium text-gray-900 truncate">{form.name}</h3>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{form.description}</p>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-200 ml-8">
                          {form.longDescription && (
                            <p className="text-sm text-gray-600 mb-4">{form.longDescription}</p>
                          )}

                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-gray-500">Form Code:</span>
                              <span className="ml-2 font-medium text-gray-900">{form.code}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">eSign:</span>
                              <span className={`ml-2 font-medium ${form.eSignEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                                {form.eSignEnabled ? 'Enabled' : 'Not Available'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Signers Required:</span>
                              <span className="ml-2 font-medium text-gray-900">
                                {form.requiresAllSigners ? 'All account holders' : 'Single signer'}
                              </span>
                            </div>
                          </div>

                          {Array.isArray(form.keywords) && form.keywords.length > 0 && (
                            <div className="mt-5 flex flex-wrap gap-2">
                              {form.keywords.slice(0, 6).map((keyword) => (
                                <span key={keyword} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onToggleSaveForm) onToggleSaveForm(form.code);
                        }}
                        className="inline-flex items-center gap-1.5 px-0.5 py-1 text-sm font-medium text-blue-700 hover:text-blue-800"
                      >
                        <svg className={`w-4 h-4 ${isSaved ? 'fill-blue-600 stroke-blue-600' : 'fill-none stroke-blue-600'}`} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        {isSaved ? 'Saved' : 'Save'}
                      </button>

                      <div className="w-24 flex justify-start">
                        {form.eSignEnabled ? (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium whitespace-nowrap">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            eSign
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium whitespace-nowrap">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Print Only
                          </div>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFormCode(isExpanded ? null : form.code);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <svg
                          className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
