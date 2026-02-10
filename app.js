const App = () => {
  const [isAdmin] = React.useState(() => initializeAdminSessionFromUrl());
  const [formsCatalog, setFormsCatalog] = React.useState(() => initializeAdminFormsCatalog());
  const [operationsUpdate, setOperationsUpdate] = React.useState(() => getAdminOperationsUpdate());
  const [view, setView] = React.useState(() => (
    window.location.hash === '#admin' && isAdminUser() ? 'admin' : 'landing'
  ));
  const [currentAccount, setCurrentAccount] = React.useState(null);
  const [selectedForms, setSelectedForms] = React.useState([]);
  const [draftData, setDraftData] = React.useState(null);
  const [searchError, setSearchError] = React.useState(null);
  const [toast, setToast] = React.useState(null);
  const [confetti, setConfetti] = React.useState([]);
  const [savedFormCodes, setSavedFormCodes] = React.useState(() => {
    try {
      const saved = localStorage.getItem('formsLibrary_savedFormCodes');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error loading saved forms from localStorage:', error);
      return [];
    }
  });

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

  const clearAdminHash = React.useCallback(() => {
    const currentUrl = new URL(window.location.href);
    if (currentUrl.hash !== '#admin') return;
    currentUrl.hash = '';
    window.history.replaceState({}, '', currentUrl.toString());
  }, []);

  React.useEffect(() => {
    if (view === 'admin') {
      if (!isAdmin) {
        clearAdminHash();
        setView('landing');
        setToast({
          message: 'Admin access required',
          subtitle: 'This workspace is only available to admin users.'
        });
        return;
      }

      if (window.location.hash !== '#admin') {
        const currentUrl = new URL(window.location.href);
        currentUrl.hash = 'admin';
        window.history.replaceState({}, '', currentUrl.toString());
      }
      return;
    }

    clearAdminHash();
  }, [view, isAdmin, clearAdminHash]);

  React.useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash !== '#admin') return;

      if (isAdmin) {
        setView('admin');
      } else {
        clearAdminHash();
        setView('landing');
        setToast({
          message: 'Admin access required',
          subtitle: 'Direct access to /#admin is blocked for non-admin users.'
        });
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isAdmin, clearAdminHash]);

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

  React.useEffect(() => {
    try {
      localStorage.setItem('formsLibrary_savedFormCodes', JSON.stringify(savedFormCodes));
    } catch (error) {
      console.error('Error saving saved forms to localStorage:', error);
    }
  }, [savedFormCodes]);

  const handleToggleSavedForm = (formCode) => {
    setSavedFormCodes((prev) => (
      prev.includes(formCode)
        ? prev.filter((code) => code !== formCode)
        : [formCode, ...prev]
    ));
  };

  const handleAdminSaveForm = (formPayload) => {
    const result = upsertAdminForm(formPayload);
    setFormsCatalog(result.formsCatalog);
    return result;
  };

  const handleAdminSaveOperationsUpdate = (nextValue) => {
    const saved = saveAdminOperationsUpdate(nextValue);
    setOperationsUpdate(saved);
    return saved;
  };

  const handleAdminResetOperationsUpdate = () => {
    const reset = resetAdminOperationsUpdate();
    setOperationsUpdate(reset);
    return reset;
  };

  const handleNavigateToAdmin = () => {
    if (!isAdmin) {
      setToast({
        message: 'Admin access required',
        subtitle: 'You do not have permission to open the admin workspace.'
      });
      return;
    }

    setView('admin');
  };

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
      setSearchError('Account not found. Verify and retry.');
    }
  };

  const handleContinueToPackage = (forms) => {
    setSelectedForms(forms);
    setDraftData(null);
    setView('package');
  };

  const handleContinueFromFormsLibrary = (forms, account) => {
    setCurrentAccount(account);
    setSelectedForms(forms);
    setDraftData(null);
    setSearchError(null);
    setView('package');
  };

  const handleLoadDraft = (draftItem) => {
    // Look up the account from the draft
    const account = MOCK_ACCOUNTS[draftItem.account];
    if (!account) {
      setToast({ message: 'Draft account not found', subtitle: `Account ${draftItem.account} no longer exists` });
      return;
    }
    setCurrentAccount(account);
    setSelectedForms(draftItem.forms);
    setDraftData(draftItem.draftData || null);
    setView('package');
  };

  const handleSendForSignature = async (packageData) => {
    // Check if any selected form has DocuSign enabled via the docuSignEnabled flag
    const shouldUseDocuSign = packageData.forms.some(formCode => {
      const form = FORMS_DATA.find(f => f.code === formCode);
      return form && form.docuSignEnabled;
    });

    console.log('DocuSign check:', {
      account: currentAccount.accountNumber,
      forms: packageData.forms,
      shouldUseDocuSign: shouldUseDocuSign
    });

    let docusignEnvelopeId = null;

    // Send via DocuSign if conditions are met
    if (shouldUseDocuSign) {
      try {
        // Build signers array with routing order, using dropdown-selected emails
        const signers = packageData.signers.map((signer) => {
          const routingOrder = packageData.sequentialSigning && packageData.signerOrder
            ? packageData.signerOrder.indexOf(signer.id) + 1
            : 1; // All get order 1 for parallel signing

          const email = (packageData.signerDetails && packageData.signerDetails[signer.id])
            ? packageData.signerDetails[signer.id].email
            : (signer.emails ? signer.emails[0] : signer.email);

          return {
            email: email,
            name: signer.name,
            routingOrder
          };
        });

        // Sort by routing order for sequential signing
        if (packageData.sequentialSigning) {
          signers.sort((a, b) => a.routingOrder - b.routingOrder);
        }

        console.log('DocuSign: Sending envelope with signers:', signers);

        // Find the first docuSignEnabled form for its template/PDF config
        const docuSignForm = packageData.forms
          .map(code => FORMS_DATA.find(f => f.code === code))
          .find(f => f && f.docuSignEnabled);

        let result;
        if (docuSignForm && docuSignForm.pdfPath) {
          // PDF fill path: fill the source PDF with form data, upload as document
          result = await DocuSignService.sendDocumentEnvelope(
            signers,
            docuSignForm.pdfPath,
            docuSignForm.pdfFieldMap,
            packageData.formData[docuSignForm.code],
            packageData.customMessage,
            docuSignForm.signaturePosition,
            currentAccount.accountNumber
          );
        } else {
          // Template path: use textTabs to pre-fill template fields
          const textTabs = [];
          packageData.forms.forEach(formCode => {
            const form = FORMS_DATA.find(f => f.code === formCode);
            if (form && form.textTabFields && packageData.formData && packageData.formData[formCode]) {
              const formFields = packageData.formData[formCode];
              Object.entries(form.textTabFields).forEach(([dataKey, tabLabel]) => {
                if (formFields[dataKey] != null && formFields[dataKey] !== '') {
                  textTabs.push({ tabLabel: tabLabel, value: String(formFields[dataKey]) });
                }
              });
            }
          });
          result = await DocuSignService.sendEnvelope(
            signers,
            currentAccount.accountNumber,
            packageData.customMessage,
            {
              templateId: docuSignForm && docuSignForm.templateId ? docuSignForm.templateId : undefined,
              textTabs: textTabs.length > 0 ? textTabs : undefined
            }
          );
        }

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
          setToast({ message: 'DocuSign error', subtitle: result.error + ' — item still added to My work' });
        }
      } catch (error) {
        console.error('Error sending DocuSign envelope:', error);
        setToast({ message: 'DocuSign error', subtitle: error.message + ' — item still added to My work' });
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
      setToast({ type: 'success', message: 'Envelope voided successfully' });
    } else {
      setToast({ message: 'Failed to void envelope', subtitle: result.error });
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
    } else if (view === 'work' || view === 'formsLibrary' || view === 'savedForms' || view === 'admin') {
      setView('landing');
    }
  };

  const renderActiveView = () => {
    if (view === 'landing') {
      return (
        <>
          <SearchView
            onSearch={handleSearch}
            searchError={searchError}
            onAccountInputChange={() => setSearchError(null)}
            onBrowseForms={() => setView('formsLibrary')}
            onBrowseSavedForms={() => setView('savedForms')}
            onResumeLastDraft={() => {
              const latestDraft = workItems.drafts[0];
              if (latestDraft) {
                handleLoadDraft(latestDraft);
              }
            }}
            hasSavedDrafts={workItems.drafts.length > 0}
            savedFormsCount={savedFormCodes.length}
            operationsUpdate={operationsUpdate}
          />
        </>
      );
    }

    if (view === 'results' && currentAccount) {
      return (
        <ResultsView
          account={currentAccount}
          onBack={handleBack}
          onContinue={handleContinueToPackage}
        />
      );
    }

    if (view === 'work') {
      return (
        <MyWorkView
          onBack={handleBack}
          onLoadDraft={handleLoadDraft}
          onDeleteDraft={handleDeleteDraft}
          workItems={workItems}
          onVoidEnvelope={handleVoidEnvelope}
          onEnvelopeStatusChange={handleEnvelopeStatusChange}
        />
      );
    }

    if (view === 'admin') {
      if (!isAdmin) {
        return null;
      }

      return (
        <AdminView
          onBack={handleBack}
          formsCatalog={formsCatalog}
          operationsUpdate={operationsUpdate}
          defaultOperationsUpdate={getAdminDefaultOperationsUpdate()}
          onSaveForm={handleAdminSaveForm}
          onSaveOperationsUpdate={handleAdminSaveOperationsUpdate}
          onResetOperationsUpdate={handleAdminResetOperationsUpdate}
        />
      );
    }

    if (view === 'formsLibrary') {
      return (
        <FormsLibraryView
          onBack={handleBack}
          savedFormCodes={savedFormCodes}
          onToggleSaveForm={handleToggleSavedForm}
          onContinue={handleContinueFromFormsLibrary}
          initialAccountNumber={currentAccount?.accountNumber || ''}
        />
      );
    }

    if (view === 'savedForms') {
      return (
        <SavedFormsView
          onBack={handleBack}
          onBrowseForms={() => setView('formsLibrary')}
          savedFormCodes={savedFormCodes}
          onToggleSaveForm={handleToggleSavedForm}
          onContinue={handleContinueFromFormsLibrary}
          initialAccountNumber={currentAccount?.accountNumber || ''}
        />
      );
    }

    if (view === 'package' && currentAccount) {
      return (
        <PackageView
          account={currentAccount}
          selectedForms={selectedForms}
          onBack={handleBack}
          initialData={draftData}
          onSendForSignature={handleSendForSignature}
          onSaveDraft={handleSaveDraft}
        />
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen site-grid-bg">
      <Header
        onNavigateToWork={() => setView('work')}
        onNavigateToAdmin={handleNavigateToAdmin}
        currentView={view}
        isAdmin={isAdmin}
      />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div key={view} className="view-enter">
          {renderActiveView()}
        </div>
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
