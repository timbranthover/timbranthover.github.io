const App = () => {
  const [view, setView] = React.useState('landing');
  const [currentAccount, setCurrentAccount] = React.useState(null);
  const [selectedForms, setSelectedForms] = React.useState([]);
  const [draftData, setDraftData] = React.useState(null);
  const [searchError, setSearchError] = React.useState(null);
  const [workItems, setWorkItems] = React.useState(MOCK_HISTORY);

  const handleSearch = (accountNumber) => {
    // Normalize account number (remove spaces, uppercase)
    const normalizedAccount = accountNumber.trim().toUpperCase();

    // Look up account in MOCK_ACCOUNTS
    const account = MOCK_ACCOUNTS[normalizedAccount];

    if (account) {
      setCurrentAccount(account);
      setSearchError(null);
      setView('results');
    } else {
      setSearchError(`Account ${accountNumber} not found. Please check the account number and try again.`);
    }
  };

  const handleContinueToPackage = (forms) => {
    setSelectedForms(forms);
    setDraftData(null);
    setView('package');
  };

  const handleLoadDraft = (draftItem) => {
    // Look up the account from the draft
    const account = MOCK_ACCOUNTS[draftItem.account];
    setCurrentAccount(account || MOCK_ACCOUNT);
    setSelectedForms(draftItem.forms);
    setDraftData(draftItem.draftData ? { 'AC-TF': draftItem.draftData } : null);
    setView('package');
  };

  const handleSendForSignature = (packageData) => {
    // Create a new in-progress item
    const newItem = {
      id: `ip${Date.now()}`,
      account: currentAccount.accountNumber,
      names: currentAccount.accountName,
      forms: packageData.forms,
      status: packageData.signers.length > 1
        ? `Waiting for ${packageData.signers[0].name} and ${packageData.signers.length - 1} other${packageData.signers.length > 2 ? 's' : ''}`
        : `Waiting for ${packageData.signers[0]?.name || 'signer'}`,
      lastChange: 'Just now',
      progress: { signed: 0, total: packageData.signers.length }
    };

    // Add to in-progress items
    setWorkItems(prev => ({
      ...prev,
      inProgress: [newItem, ...prev.inProgress]
    }));

    // Navigate to My Work to show the new item
    setView('work');
  };

  const handleSaveDraft = (draftName, draftFormData) => {
    // Create a new draft item
    const newDraft = {
      id: `d${Date.now()}`,
      account: currentAccount.accountNumber,
      names: currentAccount.accountName,
      forms: selectedForms,
      status: 'Draft',
      lastChange: 'Just now',
      draftName: draftName,
      draftData: draftFormData
    };

    // Add to drafts
    setWorkItems(prev => ({
      ...prev,
      drafts: [newDraft, ...prev.drafts]
    }));
  };

  const handleBack = () => {
    if (view === 'package') {
      setView('results');
    } else if (view === 'results') {
      setView('landing');
      setCurrentAccount(null);
      setSearchError(null);
    } else if (view === 'work') {
      setView('landing');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigateToWork={() => setView('work')} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {view === 'landing' && (
          <>
            <SearchView onSearch={handleSearch} />
            {searchError && (
              <div className="mt-4 max-w-5xl p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-800">{searchError}</p>
                    <p className="text-xs text-red-600 mt-1">
                      Try one of these sample accounts: 1B92008, 1B92007, 1C88543, 1D12456, 1E99871, 1F44320
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {view === 'results' && currentAccount && (
          <ResultsView
            account={currentAccount}
            onBack={handleBack}
            onContinue={handleContinueToPackage}
          />
        )}

        {view === 'work' && (
          <MyWorkView
            onBack={handleBack}
            onLoadDraft={handleLoadDraft}
            workItems={workItems}
          />
        )}

        {view === 'package' && currentAccount && (
          <PackageView
            account={currentAccount}
            selectedForms={selectedForms}
            onBack={handleBack}
            initialData={draftData}
            onSendForSignature={handleSendForSignature}
            onSaveDraft={handleSaveDraft}
          />
        )}
      </div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
