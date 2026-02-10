const SearchView = ({
  onSearch,
  onBrowseForms,
  onBrowseSavedForms = () => {},
  onResumeLastDraft = () => {},
  onAccountInputChange = () => {},
  searchError = null,
  hasSavedDrafts = false,
  savedFormsCount = 0,
  operationsUpdate = null
}) => {
  const [accountSearch, setAccountSearch] = React.useState('');
  const [aiQuery, setAiQuery] = React.useState('');
  const [aiSuggestion, setAiSuggestion] = React.useState(null);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const eSignEnabledCount = React.useMemo(
    () => FORMS_DATA.filter((form) => form.eSignEnabled).length,
    []
  );

  const defaultOperationsCallout = {
    label: 'Operations update',
    message: 'AC-DEBIT-CARD is now enabled for eSign on eligible account workflows.',
    updatedAt: 'Updated today'
  };

  const operationsCallout = {
    label: operationsUpdate?.label || defaultOperationsCallout.label,
    message: operationsUpdate?.message || defaultOperationsCallout.message,
    updatedAt: operationsUpdate?.updatedAt || defaultOperationsCallout.updatedAt
  };

  React.useEffect(() => {
    const frame = requestAnimationFrame(() => setIsLoaded(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleSearch = () => {
    if (accountSearch.trim()) {
      onSearch(accountSearch);
    }
  };

  const handleAiQuery = (query) => {
    setAiQuery(query);
    if (query.length > 3) {
      const matchedKey = Object.keys(AI_SUGGESTIONS).find(key =>
        query.toLowerCase().includes(key)
      );
      setAiSuggestion(matchedKey ? AI_SUGGESTIONS[matchedKey] : null);
    } else {
      setAiSuggestion(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div
        className={`operations-glass sticky top-4 z-20 px-5 py-3 transition-all duration-500 ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-600 flex-shrink-0" />
            <p className="text-xs font-semibold tracking-wide text-amber-900">{operationsCallout.label}</p>
          </div>
          <span className="inline-flex items-center rounded-full border border-amber-400 bg-white/70 px-2 py-0.5 text-[11px] font-medium text-amber-900">
            {operationsCallout.updatedAt}
          </span>
        </div>
        <p className="text-sm text-amber-900 mt-1.5">{operationsCallout.message}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_0.95fr] gap-6 items-stretch">
        <div
          className={`bg-white rounded-lg shadow-md border border-slate-300 p-6 lg:p-7 transition-all duration-500 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
          }`}
          style={{ transitionDelay: '80ms' }}
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Search by account</h2>
          <p className="text-sm text-gray-600 mb-4">Enter account number or UAN to view available forms for eSign.</p>
          <div className="mb-5 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700">
              <svg className="h-3.5 w-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              {savedFormsCount} saved form{savedFormsCount === 1 ? '' : 's'}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800">
              <svg className="h-3.5 w-3.5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              {eSignEnabledCount} eSign-enabled forms
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Account/UAN"
                value={accountSearch}
                onChange={(e) => {
                  setAccountSearch(e.target.value);
                  onAccountInputChange(e.target.value);
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 ${
                  searchError
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            </button>
          </div>

          <div className="mt-2 h-5" aria-live="polite">
            <div className={`flex items-center gap-1.5 text-[11px] text-red-700 transition-opacity duration-150 ${searchError ? 'opacity-100' : 'opacity-0'}`}>
              <svg className="w-3.5 h-3.5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{searchError || ' '}</span>
            </div>
          </div>
        </div>

        <div
          className={`bg-gradient-to-r from-slate-50 via-blue-50 to-slate-50 rounded-lg border border-slate-300 p-6 lg:p-7 transition-all duration-500 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
          }`}
          style={{ transitionDelay: '140ms' }}
        >
          <div className="flex items-start gap-3 mb-4">
            <svg className="w-5 h-5 text-blue-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Need help finding the right form?</h3>
              <p className="text-sm text-gray-600">Describe what your client needs to do, and we&apos;ll suggest the appropriate form.</p>
            </div>
          </div>

          <input
            type="text"
            placeholder="e.g., 'client wants to transfer money from another bank'"
            value={aiQuery}
            onChange={(e) => handleAiQuery(e.target.value)}
            className="w-full px-4 py-2.5 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />

          {aiSuggestion && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900">{aiSuggestion.form}</p>
                  <p className="text-sm text-gray-600 mt-1">{aiSuggestion.reason}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className={`bg-white rounded-lg border border-gray-300 shadow-sm p-4 transition-all duration-500 ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
        }`}
        style={{ transitionDelay: '200ms' }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Quick start</h3>
          <p className="text-xs text-gray-500 invisible select-none">Common advisor actions</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={onResumeLastDraft}
            disabled={!hasSavedDrafts}
            className={`w-full text-left rounded-lg border px-4 py-3 text-sm transition-colors ${
              hasSavedDrafts
                ? 'quick-wash-surface quick-wash-purple hover:brightness-[1.015] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2'
                : 'border-gray-200 bg-gray-50 opacity-75 cursor-not-allowed'
            }`}
          >
            <p className={`font-medium ${hasSavedDrafts ? 'text-indigo-900' : 'text-gray-600'}`}>Resume last draft</p>
            <p className={`text-xs mt-0.5 ${hasSavedDrafts ? 'text-indigo-700' : 'text-gray-500'}`}>
              {hasSavedDrafts ? 'Jump back into your most recent draft' : 'No saved drafts yet'}
            </p>
          </button>
          <button
            onClick={onBrowseSavedForms}
            className="w-full text-left rounded-lg border quick-wash-surface quick-wash-blue px-4 py-3 text-sm hover:brightness-[1.015] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <p className="font-medium text-blue-900">Open saved forms</p>
            <p className="text-xs text-blue-700 mt-0.5">{savedFormsCount} saved form{savedFormsCount === 1 ? '' : 's'}</p>
          </button>
        </div>
      </div>

      <div
        className={`rounded-lg border border-gray-300 bg-white p-4 transition-all duration-500 ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
        }`}
        style={{ transitionDelay: '260ms' }}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <button
            onClick={onBrowseForms}
            className="md:col-span-7 w-full text-left rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm flex items-start gap-3 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
          >
            <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <div>
              <p className="font-medium text-gray-900">General forms search</p>
              <p className="text-xs text-gray-500 mt-0.5">Browse all {FORMS_DATA.length} forms in the library</p>
            </div>
          </button>

          <button
            onClick={onBrowseSavedForms}
            className="md:col-span-5 w-full text-left rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm flex items-start gap-3 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
          >
            <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <div>
              <p className="font-medium text-gray-900">Saved forms</p>
              <p className="text-xs text-gray-500 mt-0.5">{savedFormsCount} saved form{savedFormsCount === 1 ? '' : 's'}</p>
            </div>
          </button>

          <div className="md:col-span-12 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm flex items-start gap-3 opacity-60 cursor-not-allowed">
            <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <div>
              <p className="font-medium text-gray-500">Forms category search</p>
              <p className="text-xs text-gray-400 mt-0.5">Coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
