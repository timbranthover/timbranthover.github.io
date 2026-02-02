const App = () => {
  const [view, setView] = React.useState('landing');
  const [currentAccount, setCurrentAccount] = React.useState(null);
  const [selectedForms, setSelectedForms] = React.useState([]);
  const [draftData, setDraftData] = React.useState(null);
  const [searchError, setSearchError] = React.useState(null);
  const [toast, setToast] = React.useState(null);
  const [confetti, setConfetti] = React.useState([]);

  // Konami Code Easter Egg: ↑ ↑ ↓ ↓ ← → ← → B A
  React.useEffect(() => {
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
    let konamiIndex = 0;

    const handleKeyDown = (e) => {
      if (e.code === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
          // Trigger the party!
          const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];
          const newConfetti = Array.from({ length: 150 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            color: colors[Math.floor(Math.random() * colors.length)],
            delay: Math.random() * 0.5,
            duration: 2 + Math.random() * 2,
            size: 6 + Math.random() * 8,
            rotation: Math.random() * 360
          }));
          setConfetti(newConfetti);
          setToast({ type: 'party', message: '🎉 You found the secret! 🎉', subtitle: 'Nice work, code wizard!' });
          setTimeout(() => setConfetti([]), 4000);
          konamiIndex = 0;
        }
      } else {
        konamiIndex = 0;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-dismiss toast
  React.useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

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
    // Check if we should send via DocuSign (AC-TF form with account ABC123)
    // packageData.forms is an array of form code strings like ['AC-TF']
    const shouldUseDocuSign =
      currentAccount.accountNumber === 'ABC123' &&
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
        // Build signers array with routing order
        const signers = packageData.signers.map((signer, index) => {
          const routingOrder = packageData.sequentialSigning && packageData.signerOrder
            ? packageData.signerOrder.indexOf(signer.id) + 1
            : 1; // All get order 1 for parallel signing

          return {
            email: signer.emails ? signer.emails[0] : signer.email,
            name: signer.name,
            routingOrder
          };
        });

        // Sort by routing order for sequential signing
        if (packageData.sequentialSigning) {
          signers.sort((a, b) => a.routingOrder - b.routingOrder);
        }

        console.log('DocuSign: Sending envelope with signers:', signers);

        const result = await DocuSignService.sendEnvelope(
          signers,
          currentAccount.accountNumber,
          packageData.customMessage
        );

        if (result.success) {
          docusignEnvelopeId = result.envelopeId;
          console.log('DocuSign envelope sent successfully:', result.envelopeId);
          const signerNames = signers.map(s => s.name).join(', ');
          setToast({
            type: 'success',
            message: `DocuSign envelope sent to ${signerNames}`
          });
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
      docusignEnvelopeId: docusignEnvelopeId, // Store envelope ID if sent via DocuSign
      sentAt: new Date().toISOString()
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
      draftData: draftFormData,
      savedAt: new Date().toISOString()
    };

    // Add to drafts
    setWorkItems(prev => ({
      ...prev,
      drafts: [newDraft, ...prev.drafts]
    }));
  };

  // Delete a draft
  const handleDeleteDraft = (draftItem) => {
    setWorkItems(prev => ({
      ...prev,
      drafts: prev.drafts.filter(d => d.id !== draftItem.id)
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
    } else if (view === 'work' || view === 'formsLibrary') {
      setView('landing');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigateToWork={() => setView('work')} currentView={view} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {view === 'landing' && (
          <>
            <SearchView onSearch={handleSearch} onBrowseForms={() => setView('formsLibrary')} />
            {searchError && (
              <div className="mt-4 max-w-5xl p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-800">{searchError}</p>
                    <p className="text-xs text-red-600 mt-1">
                      Try one of these sample accounts: ABC123, 1B92007, 1C88543, 1D12456, 1E99871, 1F44320
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
            onDeleteDraft={handleDeleteDraft}
            workItems={workItems}
            onVoidEnvelope={handleVoidEnvelope}
            onEnvelopeStatusChange={handleEnvelopeStatusChange}
          />
        )}

        {view === 'formsLibrary' && (
          <FormsLibraryView onBack={handleBack} />
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

      {/* Toast Notification */}
      <div
        className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ease-out ${
          toast ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
        }`}
      >
        {toast && (
          <div className={`rounded-lg shadow-lg border p-4 flex gap-3 min-w-[340px] ${
            toast.subtitle ? 'items-start' : 'items-center'
          } ${
            toast.type === 'success'
              ? 'bg-green-50 border-green-200'
              : toast.type === 'party'
              ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200'
              : 'bg-white border-gray-200'
          }`}>
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              toast.type === 'success' ? 'bg-green-100' : toast.type === 'party' ? 'bg-purple-100' : 'bg-blue-100'
            }`}>
              {toast.type === 'success' ? (
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : toast.type === 'party' ? (
                <span className="text-lg">✨</span>
              ) : (
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${
                toast.type === 'success' ? 'text-green-900' : toast.type === 'party' ? 'text-purple-900' : 'text-gray-900'
              }`}>
                {toast.message}
              </p>
              {toast.subtitle && (
                <p className={`text-sm mt-0.5 ${
                  toast.type === 'success' ? 'text-green-700' : toast.type === 'party' ? 'text-purple-600' : 'text-gray-500'
                }`}>
                  {toast.subtitle}
                </p>
              )}
            </div>
            <button
              onClick={() => setToast(null)}
              className="flex-shrink-0 p-1 hover:bg-black/5 rounded transition-colors"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Confetti */}
      {confetti.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
          {confetti.map((piece) => (
            <div
              key={piece.id}
              className="absolute animate-confetti"
              style={{
                left: `${piece.x}%`,
                top: '-20px',
                width: `${piece.size}px`,
                height: `${piece.size}px`,
                backgroundColor: piece.color,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                transform: `rotate(${piece.rotation}deg)`,
                animation: `confetti-fall ${piece.duration}s ease-out ${piece.delay}s forwards`
              }}
            />
          ))}
          <style>{`
            @keyframes confetti-fall {
              0% { transform: translateY(0) rotate(0deg); opacity: 1; }
              100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
