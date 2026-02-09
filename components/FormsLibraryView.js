const FormsLibraryView = ({
  onBack,
  onContinue,
  savedFormCodes = [],
  onToggleSaveForm,
  initialAccountNumber = ''
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedFormCode, setSelectedFormCode] = React.useState(null);
  const [selectedForms, setSelectedForms] = React.useState([]);
  const [accountInput, setAccountInput] = React.useState(initialAccountNumber);
  const [accountError, setAccountError] = React.useState(null);

  const searchResult = React.useMemo(
    () => searchFormsCatalog(searchQuery, { limit: searchQuery.trim() ? 24 : FORMS_DATA.length }),
    [searchQuery]
  );

  const visibleForms = searchResult.items;
  const normalizedAccount = accountInput.trim().toUpperCase();
  const resolvedAccount = normalizedAccount ? MOCK_ACCOUNTS[normalizedAccount] : null;
  const hasSelection = selectedForms.length > 0;
  const accountStatusMessage = accountError
    ? accountError
    : (resolvedAccount ? `${resolvedAccount.accountNumber} - ${resolvedAccount.accountName} (${resolvedAccount.accountType})` : '');

  React.useEffect(() => {
    if (selectedFormCode && !visibleForms.some((form) => form.code === selectedFormCode)) {
      setSelectedFormCode(null);
    }
  }, [visibleForms, selectedFormCode]);

  React.useEffect(() => {
    setSelectedForms((prev) => prev.filter((code) => {
      const form = FORMS_DATA.find((item) => item.code === code);
      return form ? isFormSelectableForAccount(form, resolvedAccount) : false;
    }));
  }, [resolvedAccount]);

  const toggleFormSelection = (form) => {
    if (!isFormSelectableForAccount(form, resolvedAccount)) return;

    setSelectedForms((prev) => (
      prev.includes(form.code)
        ? prev.filter((code) => code !== form.code)
        : [...prev, form.code]
    ));
  };

  const handleContinue = () => {
    const selectableForms = selectedForms.filter((code) => {
      const form = FORMS_DATA.find((item) => item.code === code);
      return form ? isFormSelectableForAccount(form, resolvedAccount) : false;
    });
    if (!selectableForms.length) return;

    if (!resolvedAccount) {
      setAccountError('Enter a valid account/UAN to continue.');
      return;
    }

    if (onContinue) {
      onContinue(selectableForms, resolvedAccount);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-start gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">General forms search</h2>
          <p className="text-sm text-gray-500 mt-1">Browse and select from {FORMS_DATA.length} available forms</p>
        </div>

        <div className="ml-auto">
          <button
            onClick={onBack}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to search
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-full">
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
            <div className="mt-1.5 h-5 flex items-center" aria-live="polite">
              <p
                className={`text-xs truncate transition-opacity duration-150 ${
                  accountStatusMessage ? 'opacity-100' : 'opacity-0'
                } ${accountError ? 'text-red-600' : 'text-green-700'}`}
                title={accountStatusMessage || undefined}
              >
                {accountStatusMessage || ' '}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-full">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search forms by name, code, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {searchQuery && (
            <p className="mt-1.5 text-sm text-gray-500">
              Showing {visibleForms.length}
              {searchResult.limited ? ' top' : ''} of {searchResult.totalMatches} matching forms
              {' '}from {FORMS_DATA.length} total
            </p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {visibleForms.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500">No forms match your search</p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-sm text-blue-600 hover:text-blue-700 mt-2"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {visibleForms.map((form) => {
              const isSaved = savedFormCodes.includes(form.code);
              const isSelected = selectedForms.includes(form.code);
              const isExpanded = selectedFormCode === form.code;
              const canSelectForm = isFormSelectableForAccount(form, resolvedAccount);
              const disabledReason = getFormSelectionDisabledReason(form, resolvedAccount);

              return (
                <div
                  key={form.code}
                  onClick={() => toggleFormSelection(form)}
                  className={`px-4 py-4 transition-all motion-press ${
                    canSelectForm ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'
                  } ${
                    isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          disabled={!canSelectForm}
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
                          {disabledReason && (
                            <p className="text-xs text-amber-700 mt-1">{disabledReason}</p>
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-200 ml-8 panel-enter">
                          {form.longDescription && (
                            <p className="text-sm text-gray-600 mb-4">{form.longDescription}</p>
                          )}

                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-gray-500">Form code:</span>
                              <span className="ml-2 font-medium text-gray-900">{form.code}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">eSign:</span>
                              <span className={`ml-2 font-medium ${form.eSignEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                                {form.eSignEnabled ? 'Enabled' : 'Not available'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Signers required:</span>
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
                        {!form.eSignEnabled ? (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium whitespace-nowrap">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Print only
                          </div>
                        ) : canSelectForm ? (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium whitespace-nowrap">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            eSign
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium whitespace-nowrap">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-3L13.73 3.7c-.77-1.33-2.69-1.33-3.46 0L3.2 16c-.77 1.33.19 3 1.73 3z" />
                            </svg>
                            Unavailable
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

      <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {FORMS_DATA.length} Total forms
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {FORMS_DATA.filter((f) => f.eSignEnabled).length} eSign enabled
        </div>
      </div>

      {hasSelection && (
        <div className="fixed bottom-5 inset-x-4 sm:inset-x-auto sm:right-6 z-30 flex justify-end pointer-events-none">
          <div className="pointer-events-auto floating-glass">
            <button
              onClick={() => setSelectedForms([])}
              className="floating-clear hidden sm:inline-flex"
            >
              Clear selection
            </button>
            <button
              onClick={handleContinue}
              disabled={!resolvedAccount}
              className={`floating-action ${!resolvedAccount ? 'is-disabled' : ''}`}
            >
              Continue with {selectedForms.length} form{selectedForms.length > 1 ? 's' : ''}
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
