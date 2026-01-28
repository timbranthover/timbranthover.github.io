const App = () => {
  const [view, setView] = React.useState('landing');
  const [currentAccount, setCurrentAccount] = React.useState(null);
  const [selectedForms, setSelectedForms] = React.useState([]);
  const [draftData, setDraftData] = React.useState(null);
  const [searchError, setSearchError] = React.useState(null);

  // Initialize workItems from localStorage or fall back to MOCK_HISTORY
  const [workItems, setWorkItems] = React.useState(() => {
    try {
      const savedItems = localStorage.getItem('formsLibrary_workItems');
      return savedItems ? JSON.parse(savedItems) : MOCK_HISTORY;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return MOCK_HISTORY;
    }
  });

  // Save workItems to localStorage whenever they change
  React.useEffect(() => {
    try {
      localStorage.setItem('formsLibrary_workItems', JSON.stringify(workItems));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [workItems]);

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

  const handleSendForSignature = async (packageData) => {
    // Check if we should send via DocuSign (AC-TF form with account 1B92008)
    // packageData.forms is an array of form code strings like ['AC-TF']
    const shouldUseDocuSign =
      currentAccount.accountNumber === '1B92008' &&
      packageData.forms.includes('AC-TF');

    console.log('DocuSign check:', {
      account: currentAccount.accountNumber,
      forms: packageData.forms,
      shouldUseDocuSign: shouldUseDocuSign
    });

    let docusignEnvelopeId = null;

    // Send via DocuSign if conditions are met
    if (shouldUseDocuSign) {
      try {
        // Get the first signer's email - signers have emails[] array, use first email
        const primarySigner = packageData.signers[0];
        const signerEmail = primarySigner.emails ? primarySigner.emails[0] : primarySigner.email;
        const signerName = primarySigner.name;

        console.log('DocuSign: Sending envelope to', signerEmail, signerName);

        const result = await DocuSignService.sendEnvelope(
          signerEmail,
          signerName,
          currentAccount.accountNumber
        );

        if (result.success) {
          docusignEnvelopeId = result.envelopeId;
          console.log('DocuSign envelope sent successfully:', result.envelopeId);
          alert(`Success! Real DocuSign envelope sent to ${signerEmail}!\n\nEnvelope ID: ${result.envelopeId}\n\nCheck your email!`);
        } else {
          console.error('DocuSign error:', result.error);
          alert(`DocuSign Error: ${result.error}\n\nThe item will still be added to My Work for demo purposes.`);
        }
      } catch (error) {
        console.error('Error sending DocuSign envelope:', error);
        alert(`Error: ${error.message}\n\nThe item will still be added to My Work for demo purposes.`);
      }
    }

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
      progress: { signed: 0, total: packageData.signers.length },
      docusignEnvelopeId: docusignEnvelopeId // Store envelope ID if sent via DocuSign
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

  // Void a real DocuSign envelope and move to voided tab
  const handleVoidEnvelope = async (item, reason) => {
    if (!item.docusignEnvelopeId) return;

    const result = await DocuSignService.voidEnvelope(item.docusignEnvelopeId, reason);
    if (result.success) {
      setWorkItems(prev => ({
        ...prev,
        inProgress: prev.inProgress.filter(i => i.id !== item.id),
        voided: [{
          ...item,
          status: 'Voided',
          lastChange: 'Just now',
          reason: reason
        }, ...prev.voided]
      }));
      alert('Envelope voided successfully.');
    } else {
      alert(`Failed to void envelope: ${result.error}`);
    }
  };

  // Handle envelope status changes from polling (auto-move completed/voided)
  const handleEnvelopeStatusChange = (itemId, envelopeData) => {
    if (envelopeData.status === 'completed') {
      setWorkItems(prev => {
        const item = prev.inProgress.find(i => i.id === itemId);
        if (!item) return prev;

        return {
          ...prev,
          inProgress: prev.inProgress.filter(i => i.id !== itemId),
          completed: [{
            ...item,
            status: 'Completed',
            lastChange: 'Just now',
            progress: { signed: item.progress?.total || 1, total: item.progress?.total || 1 }
          }, ...prev.completed]
        };
      });
    } else if (envelopeData.status === 'voided') {
      setWorkItems(prev => {
        const item = prev.inProgress.find(i => i.id === itemId);
        if (!item) return prev;

        return {
          ...prev,
          inProgress: prev.inProgress.filter(i => i.id !== itemId),
          voided: [{
            ...item,
            status: 'Voided',
            lastChange: 'Just now',
            reason: envelopeData.voidedReason || 'Voided'
          }, ...prev.voided]
        };
      });
    }
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
      <Header onNavigateToWork={() => setView('work')} currentView={view} />

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
            onVoidEnvelope={handleVoidEnvelope}
            onEnvelopeStatusChange={handleEnvelopeStatusChange}
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
