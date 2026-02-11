const ResultsView = ({ account, onBack, onContinue }) => {
  const [selectedForms, setSelectedForms] = React.useState([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const debouncedQuery = useDebounce(searchQuery);
  const hasSelection = selectedForms.length > 0;

  const toggleFormSelection = (form) => {
    if (!isFormSelectableForAccount(form, account)) return;

    const formCode = form.code;
    setSelectedForms(prev => 
      prev.includes(formCode) 
        ? prev.filter(f => f !== formCode) 
        : [...prev, formCode]
    );
  };

  const handleContinue = () => {
    const selectableForms = selectedForms.filter((code) => {
      const form = FORMS_DATA.find((item) => item.code === code);
      return form ? isFormSelectableForAccount(form, account) : false;
    });
    if (!selectableForms.length) return;
    onContinue(selectableForms);
  };

  const searchResult = React.useMemo(
    () => searchFormsCatalog(debouncedQuery, { limit: debouncedQuery.trim() ? 40 : FORMS_DATA.length }),
    [debouncedQuery]
  );

  const filteredForms = searchResult.items;

  return (
    <div className="mobile-results-view space-y-6 max-w-5xl pb-24">
      <div className="mobile-results-header flex items-center justify-between">
        <button 
          onClick={onBack}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          ← Back to search
        </button>
        
        <div className={`min-h-[24px] flex items-center transition-opacity duration-150 ${hasSelection ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <span className="text-sm text-gray-600">
            {selectedForms.length} form{selectedForms.length > 1 ? 's' : ''} selected
          </span>
        </div>
      </div>

      <div className="mobile-results-card bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900">Account {account.accountNumber}</h2>
          <p className="text-sm text-gray-600">{account.accountName} • {account.accountType}</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search forms by name, code, or keyword (e.g., 'acat', 'transfer', 'ira')..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Showing {filteredForms.length}
            {searchResult.limited ? ' top' : ''} of {searchResult.totalMatches} matching forms
            {' '}from {FORMS_DATA.length} total
            {debouncedQuery && ` matching "${debouncedQuery}"`}
          </p>
        </div>

        <div className="space-y-3">
          {filteredForms.length > 0 ? (
            filteredForms.map((form) => {
              const isSelected = selectedForms.includes(form.code);
              const canSelectForm = isFormSelectableForAccount(form, account);
              const disabledReason = getFormSelectionDisabledReason(form, account);

              return (
                <div
                  key={form.code}
                  onClick={() => toggleFormSelection(form)}
                  className={`mobile-results-row flex items-center gap-4 p-4 border rounded transition-all motion-press ${
                    canSelectForm ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                  } ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    disabled={!canSelectForm}
                    className="w-5 h-5 text-blue-600 rounded pointer-events-none"
                  />
                  <div className="mobile-results-row-main flex-1 min-w-0">
                    <div className="mobile-results-row-title flex items-center gap-3">
                      <span className="font-mono text-sm font-medium text-gray-900">{form.code}</span>
                      <span className="text-sm text-gray-700">{form.name}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{form.description}</p>
                    {disabledReason && (
                      <p className="text-xs text-amber-700 mt-1">{disabledReason}</p>
                    )}
                  </div>

                  {!form.eSignEnabled ? (
                    <div className="mobile-results-badge flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Print only
                    </div>
                  ) : canSelectForm ? (
                    <div className="mobile-results-badge flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      eSign
                    </div>
                  ) : (
                    <div className="mobile-results-badge flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 rounded text-sm font-medium">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-3L13.73 3.7c-.77-1.33-2.69-1.33-3.46 0L3.2 16c-.77 1.33.19 3 1.73 3z" />
                      </svg>
                      Unavailable
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-600 mb-2">No forms found matching "{searchQuery}"</p>
              <p className="text-sm text-gray-500">Try searching by form code, name, or keyword</p>
            </div>
          )}
        </div>
      </div>

      {hasSelection && (
        <div className="mobile-floating-action-wrap fixed bottom-5 inset-x-4 sm:inset-x-auto sm:right-6 z-30 flex justify-end pointer-events-none">
          <div className="pointer-events-auto floating-glass">
            <button
              onClick={() => setSelectedForms([])}
              className="floating-clear hidden sm:inline-flex"
            >
              Clear selection
            </button>
            <button
              onClick={handleContinue}
              className="floating-action"
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
