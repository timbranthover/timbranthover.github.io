const SearchView = ({ onSearch }) => {
  const [accountSearch, setAccountSearch] = React.useState('');
  const [aiQuery, setAiQuery] = React.useState('');
  const [aiSuggestion, setAiSuggestion] = React.useState(null);
  const [showOtherOptions, setShowOtherOptions] = React.useState(false);

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
    <div className="space-y-8 max-w-5xl">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Search by Account</h2>
        <p className="text-sm text-gray-600 mb-6">Enter account number or UAN to view available forms for e-signature.</p>
        
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Account/UAN"
            value={accountSearch}
            onChange={(e) => setAccountSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search
          </button>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <div className="flex items-start gap-3 mb-4">
          <svg className="w-5 h-5 text-blue-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 mb-1">Need help finding the right form?</h3>
            <p className="text-sm text-gray-600">Describe what your client needs to do, and we'll suggest the appropriate form.</p>
          </div>
        </div>
        
        <input
          type="text"
          placeholder="e.g., 'client wants to transfer money from another bank'"
          value={aiQuery}
          onChange={(e) => handleAiQuery(e.target.value)}
          className="w-full px-4 py-2 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
        
        {aiSuggestion && (
          <div className="mt-4 p-4 bg-white rounded border border-blue-300">
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

      <div className="border border-gray-200 rounded-lg bg-white">
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
            <button className="w-full text-left px-4 py-3 rounded hover:bg-gray-50 border border-gray-200 text-sm">
              General Forms Search
            </button>
            <button className="w-full text-left px-4 py-3 rounded hover:bg-gray-50 border border-gray-200 text-sm">
              Saved Forms
            </button>
            <button className="w-full text-left px-4 py-3 rounded hover:bg-gray-50 border border-gray-200 text-sm">
              Forms Category Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
};