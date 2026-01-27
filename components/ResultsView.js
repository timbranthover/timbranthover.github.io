const ResultsView = ({ account, onBack, onContinue }) => {
  const [selectedForms, setSelectedForms] = React.useState([]);
  const [searchQuery, setSearchQuery] = React.useState('');

  const toggleFormSelection = (formCode) => {
    setSelectedForms(prev => 
      prev.includes(formCode) 
        ? prev.filter(f => f !== formCode) 
        : [...prev, formCode]
    );
  };

  const handleContinue = () => {
    onContinue(selectedForms);
  };

   // Enhanced fuzzy search function
  const searchForms = (query) => {
    if (!query.trim()) return FORMS_DATA;
    
    const lowerQuery = query.toLowerCase().trim();
    const tokens = lowerQuery.split(/\s+/);
    
    // Helper: Calculate similarity score (simple Levenshtein-like)
    const getSimilarity = (str1, str2) => {
      str1 = str1.toLowerCase();
      str2 = str2.toLowerCase();
      
      // Exact match
      if (str1 === str2) return 100;
      
      // Contains match
      if (str1.includes(str2) || str2.includes(str1)) return 80;
      
      // Fuzzy match - remove hyphens and spaces for comparison
      const clean1 = str1.replace(/[-\s]/g, '');
      const clean2 = str2.replace(/[-\s]/g, '');
      
      if (clean1.includes(clean2) || clean2.includes(clean1)) return 70;
      
      // Character overlap
      const overlap = [...clean2].filter(char => clean1.includes(char)).length;
      return (overlap / clean2.length) * 60;
    };
    
    return FORMS_DATA.filter(form => {
      // Direct matches
      if (form.code.toLowerCase().includes(lowerQuery)) return true;
      if (form.name.toLowerCase().includes(lowerQuery)) return true;
      if (form.description.toLowerCase().includes(lowerQuery)) return true;
      
      // Fuzzy match on form code (e.g., "clacra" matches "CL-ACRA")
      const codeScore = getSimilarity(form.code, lowerQuery);
      if (codeScore > 60) return true;
      
      // Token-based search
      const allText = `${form.code} ${form.name} ${form.description}`.toLowerCase();
      const matchesAllTokens = tokens.every(token => allText.includes(token));
      if (matchesAllTokens) return true;
      
      // Keyword aliases
      const aliases = {
        'acat': ['ac-tf', 'account transfer'],
        'transfer': ['ac-tf', 'ac-ft'],
        'eft': ['ac-ft', 'electronic funds'],
        'wire': ['ac-ft'],
        'ira': ['ac-dq', 'wp-maint-ba', 'ac-rc', 'la25', 'ac-dbt'],
        'beneficiary': ['wp-maint-ba', 'bene'],
        'loan': ['loan-u1', 'loan-ha'],
        'advisory': ['cl-acra', 'acra'],
        'w9': ['cl-w9', 'tefra'],
        'tax': ['cl-w9', 'la25', 'withholding'],
        'tod': ['ac-to', 'transfer on death'],
        'options': ['ac-opi'],
        'distribution': ['ac-dq', 'ac-dbt'],
        'roth': ['ac-rc', 'conversion'],
        'beneficiary': ['wp-maint-ba'],
        'trustee': ['cl-ts'],
        'entity': ['cl-boe']
      };
      
      for (const [alias, targets] of Object.entries(aliases)) {
        if (lowerQuery.includes(alias)) {
          if (targets.some(target => form.code.toLowerCase().includes(target) || 
                                     form.name.toLowerCase().includes(target) ||
                                     form.description.toLowerCase().includes(target))) {
            return true;
          }
        }
      }
      
      return false;
    });
  };

  const filteredForms = searchForms(searchQuery);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          ← Back to search
        </button>
        
        {selectedForms.length > 0 && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {selectedForms.length} form{selectedForms.length > 1 ? 's' : ''} selected
            </span>
            <button 
              onClick={handleContinue}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm flex items-center gap-2 font-medium"
            >
              Continue with {selectedForms.length} form{selectedForms.length > 1 ? 's' : ''}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
            Showing {filteredForms.length} of {FORMS_DATA.length} forms
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>

        <div className="space-y-3">
          {filteredForms.length > 0 ? (
            filteredForms.map((form) => (
              <div
                key={form.code}
                onClick={() => form.eSignEnabled && toggleFormSelection(form.code)}
                className={`flex items-center gap-4 p-4 border rounded transition-all ${
                  form.eSignEnabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                } ${
                  selectedForms.includes(form.code)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
                }`}
              >
                <input 
                  type="checkbox" 
                  checked={selectedForms.includes(form.code)} 
                  onChange={() => {}}
                  disabled={!form.eSignEnabled}
                  className="w-5 h-5 text-blue-600 rounded pointer-events-none" 
                />
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-medium text-gray-900">{form.code}</span>
                    <span className="text-sm text-gray-700">{form.name}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{form.description}</p>
                </div>
                
                {form.eSignEnabled ? (
                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    e-Sign
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print Only
                  </div>
                )}
              </div>
            ))
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
    </div>
  );
};