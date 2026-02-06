const SearchView = ({ onSearch, onBrowseForms, onBrowseSavedForms = () => {}, savedFormsCount = 0 }) => {
  const [accountSearch, setAccountSearch] = React.useState('');
  const [aiQuery, setAiQuery] = React.useState('');
  const [aiSuggestion, setAiSuggestion] = React.useState(null);
  const [showOtherOptions, setShowOtherOptions] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);

  const operationsCallout = {
    label: 'Operations update',
    message: 'AC-DEBIT-CARD is now enabled for e-sign on eligible account workflows.'
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
        className={`rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-slate-50 px-5 py-3 transition-all duration-500 ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-600 flex-shrink-0" />
          <p className="text-xs font-semibold tracking-wide text-blue-800">{operationsCallout.label}</p>
        </div>
        <p className="text-sm text-slate-700 mt-1.5">{operationsCallout.message}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div
          className={`bg-white rounded-lg shadow-sm border border-gray-300 p-6 lg:p-7 transition-all duration-500 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
          }`}
          style={{ transitionDelay: '80ms' }}
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Search by Account</h2>
          <p className="text-sm text-gray-600 mb-5">Enter account number or UAN to view available forms for eSign.</p>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Account/UAN"
                value={accountSearch}
                onChange={(e) => setAccountSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            </button>
          </div>
        </div>

        <div
          className={`bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg border border-slate-300 p-6 lg:p-7 transition-all duration-500 ${
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

      <div className="border border-gray-300 rounded-lg bg-white">
        <button
          onClick={() => setShowOtherOptions(!showOtherOptions)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
        >
          <span className="text-sm font-medium text-gray-700">Other search options</span>
          <svg className={`w-5 h-5 transition-transform ${showOtherOptions ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showOtherOptions && (
          <div className="px-6 pb-6 pt-2 border-t border-gray-200 space-y-3">
            <button
              onClick={onBrowseForms}
              className="w-full text-left px-4 py-3 rounded hover:bg-gray-50 border border-gray-200 text-sm flex items-center gap-3"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <div>
                <span className="font-medium text-gray-900">General Forms Search</span>
                <p className="text-xs text-gray-500 mt-0.5">Browse all {FORMS_DATA.length} forms in the library</p>
              </div>
            </button>
            <button
              onClick={onBrowseSavedForms}
              className="w-full text-left px-4 py-3 rounded hover:bg-gray-50 border border-gray-200 text-sm flex items-center gap-3"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <div>
                <span className="font-medium text-gray-900">Saved Forms</span>
                <p className="text-xs text-gray-500 mt-0.5">{savedFormsCount} saved form{savedFormsCount === 1 ? '' : 's'}</p>
              </div>
            </button>
            <button className="w-full text-left px-4 py-3 rounded hover:bg-gray-50 border border-gray-200 text-sm flex items-center gap-3 opacity-50 cursor-not-allowed">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <div>
                <span className="font-medium text-gray-500">Forms Category Search</span>
                <p className="text-xs text-gray-400 mt-0.5">Coming soon</p>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
