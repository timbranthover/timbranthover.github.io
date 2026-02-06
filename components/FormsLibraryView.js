const FormsLibraryView = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedFormCode, setSelectedFormCode] = React.useState(null);

  const searchResult = React.useMemo(
    () => searchFormsCatalog(searchQuery, { limit: searchQuery.trim() ? 24 : FORMS_DATA.length }),
    [searchQuery]
  );

  const visibleForms = searchResult.items;

  React.useEffect(() => {
    if (selectedFormCode && !visibleForms.some((form) => form.code === selectedFormCode)) {
      setSelectedFormCode(null);
    }
  }, [visibleForms, selectedFormCode]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Forms Library</h2>
          <p className="text-sm text-gray-500 mt-1">Browse all {FORMS_DATA.length} available forms</p>
        </div>
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

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
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
          <p className="text-sm text-gray-500 mt-2">
            Showing {visibleForms.length}
            {searchResult.limited ? ' top' : ''} of {searchResult.totalMatches} matching forms
            {' '}from {FORMS_DATA.length} total
          </p>
        )}
      </div>

      {/* Forms List */}
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
            {visibleForms.map(form => (
              <div
                key={form.code}
                onClick={() => setSelectedFormCode(selectedFormCode === form.code ? null : form.code)}
                className="px-4 py-4 cursor-pointer transition-colors hover:bg-gray-50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-mono font-medium">
                        {form.code}
                      </span>
                      <h3 className="font-medium text-gray-900 truncate">{form.name}</h3>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{form.description}</p>

                    {/* Expanded Details */}
                    {selectedFormCode === form.code && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        {form.longDescription && (
                          <p className="text-sm text-gray-600 mb-4">{form.longDescription}</p>
                        )}

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Form Code:</span>
                            <span className="ml-2 font-medium text-gray-900">{form.code}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">E-Sign:</span>
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
                          <div className="mt-4 flex flex-wrap gap-2">
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

                  <svg
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                      selectedFormCode === form.code ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats Footer */}
      <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {FORMS_DATA.length} Total Forms
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {FORMS_DATA.filter(f => f.eSignEnabled).length} E-Sign Enabled
        </div>
      </div>
    </div>
  );
};
