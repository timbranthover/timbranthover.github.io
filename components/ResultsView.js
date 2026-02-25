const ResultsView = ({ account, onBack, onContinue }) => {
  // ── Single-mode state (unchanged behaviour) ─────────────────────────────────
  const [selectedForms, setSelectedForms] = React.useState([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const debouncedQuery = useDebounce(searchQuery);

  // ── Multi-mode state ─────────────────────────────────────────────────────────
  const [additionalAccounts, setAdditionalAccounts] = React.useState([]);
  const [perAccountForms, setPerAccountForms] = React.useState({});
  const [addAccountInput, setAddAccountInput] = React.useState('');
  const [addAccountError, setAddAccountError] = React.useState(null);
  const [showAddInput, setShowAddInput] = React.useState(false);

  const isMultiMode = additionalAccounts.length > 0;

  const allAccounts = React.useMemo(
    () => [account, ...additionalAccounts],
    [account, additionalAccounts]
  );

  const compatibilityInfo = React.useMemo(
    () => canAccountsShareEnvelope(allAccounts),
    [allAccounts]
  );

  // ── Multi-mode CTA logic ─────────────────────────────────────────────────────
  const multiFormCount = isMultiMode
    ? Object.values(perAccountForms).reduce((sum, arr) => sum + arr.length, 0)
    : 0;

  const allAccountsHaveForms = isMultiMode
    ? allAccounts.every(a => (perAccountForms[a.accountNumber] || []).length > 0)
    : true;

  const canContinueMulti = isMultiMode && allAccountsHaveForms && multiFormCount > 0 && compatibilityInfo.compatible;

  // ── Single-mode catalog search ───────────────────────────────────────────────
  const searchResult = React.useMemo(
    () => searchFormsCatalog(debouncedQuery, { limit: debouncedQuery.trim() ? 40 : FORMS_DATA.length }),
    [debouncedQuery]
  );
  const filteredForms = searchResult.items;

  // ── Form toggle handlers ─────────────────────────────────────────────────────
  const toggleFormSelection = (form) => {
    if (!isFormSelectableForAccount(form, account)) return;
    setSelectedForms(prev =>
      prev.includes(form.code) ? prev.filter(f => f !== form.code) : [...prev, form.code]
    );
  };

  const togglePerAccountForm = (accountNumber, form) => {
    const acct = MOCK_ACCOUNTS[accountNumber] || account;
    if (!isFormSelectableForAccount(form, acct)) return;
    setPerAccountForms(prev => {
      const current = prev[accountNumber] || [];
      return {
        ...prev,
        [accountNumber]: current.includes(form.code)
          ? current.filter(c => c !== form.code)
          : [...current, form.code]
      };
    });
  };

  // ── Add / remove account ─────────────────────────────────────────────────────
  const handleAddAccount = () => {
    const normalized = addAccountInput.trim().toUpperCase();
    if (!normalized) { setShowAddInput(false); return; }

    if (normalized === account.accountNumber) {
      setAddAccountError(`${normalized} is the primary account`);
      return;
    }
    if (additionalAccounts.some(a => a.accountNumber === normalized)) {
      setAddAccountError(`${normalized} already added`);
      return;
    }
    if (allAccounts.length >= 5) {
      setAddAccountError('Maximum 5 accounts per envelope');
      return;
    }
    const newAcct = MOCK_ACCOUNTS[normalized];
    if (!newAcct) {
      setAddAccountError(`"${normalized}" not found`);
      return;
    }

    // First add — carry over selected forms and transition to multi mode
    if (additionalAccounts.length === 0) {
      setPerAccountForms({ [account.accountNumber]: [...selectedForms] });
    }

    setAdditionalAccounts(prev => [...prev, newAcct]);
    setPerAccountForms(prev => ({ ...prev, [newAcct.accountNumber]: [] }));
    setAddAccountInput('');
    setAddAccountError(null);
    setShowAddInput(false);
  };

  const handleRemoveAccount = (acctToRemove) => {
    const newAdditional = additionalAccounts.filter(a => a.accountNumber !== acctToRemove.accountNumber);
    if (newAdditional.length === 0) {
      // Revert to single mode — restore previously selected forms
      setSelectedForms(perAccountForms[account.accountNumber] || []);
      setPerAccountForms({});
    } else {
      setPerAccountForms(prev => {
        const next = { ...prev };
        delete next[acctToRemove.accountNumber];
        return next;
      });
    }
    setAdditionalAccounts(newAdditional);
  };

  // ── Continue handler ─────────────────────────────────────────────────────────
  const handleContinue = () => {
    if (isMultiMode) {
      if (!canContinueMulti) return;
      onContinue(
        Object.values(perAccountForms).flat(),
        { accounts: allAccounts.map(a => ({ account: a, forms: perAccountForms[a.accountNumber] || [] })) }
      );
    } else {
      const selectableForms = selectedForms.filter(code => {
        const form = FORMS_DATA.find(item => item.code === code);
        return form ? isFormSelectableForAccount(form, account) : false;
      });
      if (!selectableForms.length) return;
      onContinue(selectableForms, null);
    }
  };

  const isIncompatible = (acct) =>
    Array.isArray(compatibilityInfo.incompatibleAccounts) &&
    compatibilityInfo.incompatibleAccounts.includes(acct.accountNumber);

  // ── Add-account input (shared between single + multi header) ─────────────────
  const AddAccountInput = () => (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        autoFocus
        type="text"
        value={addAccountInput}
        onChange={e => { setAddAccountInput(e.target.value.toUpperCase()); setAddAccountError(null); }}
        onKeyDown={e => {
          if (e.key === 'Enter') handleAddAccount();
          if (e.key === 'Escape') { setShowAddInput(false); setAddAccountInput(''); setAddAccountError(null); }
        }}
        placeholder="Account number"
        className="px-3 py-1.5 text-sm focus:outline-none"
        style={{ border: '1px solid var(--app-input-border)', borderRadius: 'var(--app-radius)', width: '152px' }}
      />
      <button
        onClick={handleAddAccount}
        className="px-3 py-1.5 text-sm font-medium rounded text-white"
        style={{ backgroundColor: '#00759E' }}
      >
        Add
      </button>
      <button
        onClick={() => { setShowAddInput(false); setAddAccountInput(''); setAddAccountError(null); }}
        className="px-2 py-1.5 text-sm"
        style={{ color: 'var(--app-gray-4)' }}
      >
        Cancel
      </button>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="mobile-results-view space-y-6 max-w-5xl pb-24">

      {/* Nav row */}
      <div className="mobile-results-header flex items-center justify-between">
        <button onClick={onBack} className="text-sm hover:underline" style={{ color: '#00759E' }}>
          ← Back to search
        </button>
        <div className={`min-h-[24px] flex items-center transition-opacity duration-150 ${!isMultiMode && selectedForms.length > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <span className="text-sm" style={{ color: 'var(--app-gray-4)' }}>
            {selectedForms.length} form{selectedForms.length > 1 ? 's' : ''} selected
          </span>
        </div>
      </div>

      {/* Main card */}
      <div className="mobile-results-card bg-white p-6" style={{ borderRadius: 'var(--app-radius)', border: '1px solid var(--app-card-border)', boxShadow: 'var(--app-card-shadow)' }}>

        {/* ── Account header — adapts single ↔ multi ── */}
        <div className="mb-6">
          {isMultiMode ? (
            /* Multi-mode: account pill strip */
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {allAccounts.map(acct => {
                  const bad = isIncompatible(acct);
                  return (
                    <div
                      key={acct.accountNumber}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: bad ? '#FFF8E1' : '#EDF6FD',
                        color: bad ? '#8B5E0A' : '#1565C0',
                        border: `1px solid ${bad ? '#F5C842' : '#90CAF9'}`
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: bad ? '#F0A800' : '#43A047' }}
                      />
                      <span className="font-mono">{acct.accountNumber}</span>
                      <span className="opacity-50">·</span>
                      <span className="text-xs opacity-75">{acct.accountType}</span>
                      {acct.accountNumber !== account.accountNumber && (
                        <button
                          onClick={() => handleRemoveAccount(acct)}
                          className="ml-0.5 hover:opacity-60 transition-opacity"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Add another account (dashed pill) */}
                {allAccounts.length < 5 && !showAddInput && (
                  <button
                    onClick={() => { setShowAddInput(true); setAddAccountError(null); }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border border-dashed transition-colors hover:bg-gray-50"
                    style={{ borderColor: 'var(--app-gray-2)', color: 'var(--app-gray-4)' }}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add account
                  </button>
                )}
              </div>

              {/* Inline add-account input in multi mode */}
              {showAddInput && (
                <div className="mb-3">
                  <AddAccountInput />
                </div>
              )}

              {addAccountError && (
                <p className="text-xs mb-2" style={{ color: '#C62828' }}>{addAccountError}</p>
              )}

              {/* Compatibility warning */}
              {!compatibilityInfo.compatible && (
                <div
                  className="flex items-start gap-2 px-3 py-2.5 rounded-md text-sm"
                  style={{ backgroundColor: '#FFF8E1', color: '#8B5E0A', border: '1px solid #F5C842' }}
                >
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-3L13.73 3.7c-.77-1.33-2.69-1.33-3.46 0L3.2 16c-.77 1.33.19 3 1.73 3z" />
                  </svg>
                  <span>{compatibilityInfo.reason} — remove the highlighted account to continue.</span>
                </div>
              )}
            </div>
          ) : (
            /* Single-mode: original header + subtle "Add account" affordance */
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-lg font-medium" style={{ color: 'var(--app-gray-6)' }}>Account {account.accountNumber}</h2>
                <p className="text-sm" style={{ color: 'var(--app-gray-4)' }}>{account.accountName} • {account.accountType}</p>
              </div>

              <div className="flex-shrink-0">
                {showAddInput ? (
                  <>
                    <AddAccountInput />
                    {addAccountError && (
                      <p className="text-xs mt-1" style={{ color: '#C62828' }}>{addAccountError}</p>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => { setShowAddInput(true); setAddAccountError(null); }}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors hover:bg-blue-50"
                    style={{ color: '#00759E', borderColor: '#00759E' }}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add account to envelope
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Form content ── */}
        {isMultiMode ? (
          /* Multi-mode: per-account compact form sections */
          <div className="space-y-5">
            {allAccounts.map(acct => {
              const selected = perAccountForms[acct.accountNumber] || [];
              const bad = isIncompatible(acct);
              const eligibleForms = FORMS_DATA.filter(f => f.eSignEnabled);

              return (
                <div
                  key={acct.accountNumber}
                  className="rounded-lg border overflow-hidden"
                  style={{ borderColor: bad ? '#F5C842' : 'var(--app-card-border)' }}
                >
                  {/* Section header */}
                  <div
                    className="flex items-center gap-3 px-4 py-2.5"
                    style={{ backgroundColor: bad ? '#FFFBF0' : 'var(--app-pastel-1)' }}
                  >
                    <span className="font-mono text-sm font-semibold" style={{ color: 'var(--app-gray-6)' }}>
                      {acct.accountNumber}
                    </span>
                    <span className="text-sm" style={{ color: 'var(--app-gray-4)' }}>{acct.accountName}</span>
                    <span
                      className="ml-auto text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: bad ? '#FDEAAC' : 'var(--app-pastel-2)', color: bad ? '#8B5E0A' : 'var(--app-gray-5)' }}
                    >
                      {acct.accountType}
                    </span>
                    {selected.length > 0 && (
                      <span className="text-xs font-medium" style={{ color: '#00759E' }}>
                        {selected.length} selected
                      </span>
                    )}
                  </div>

                  {/* Compact form rows */}
                  <div className="divide-y" style={{ borderColor: '#F0EFE8' }}>
                    {eligibleForms.map(form => {
                      const canSelect = isFormSelectableForAccount(form, acct);
                      const disabledReason = !canSelect ? getFormSelectionDisabledReason(form, acct) : null;
                      const isSelected = selected.includes(form.code);

                      return (
                        <div
                          key={form.code}
                          onClick={() => togglePerAccountForm(acct.accountNumber, form)}
                          className={`flex items-center gap-3 px-4 py-2 transition-colors ${
                            canSelect ? 'cursor-pointer hover:bg-gray-50' : 'cursor-not-allowed opacity-50'
                          } ${isSelected ? 'bg-[#F5F0E1]' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            disabled={!canSelect}
                            className="w-4 h-4 rounded pointer-events-none accent-[#404040] flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-semibold" style={{ color: 'var(--app-gray-6)' }}>{form.code}</span>
                              <span className="text-xs" style={{ color: '#00759E' }}>{form.name}</span>
                            </div>
                            {disabledReason && (
                              <p className="text-xs mt-0.5" style={{ color: 'var(--app-bronze-2)' }}>{disabledReason}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Single-mode: original search + full form grid */
          <>
            {/* Search bar */}
            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5" style={{ color: 'var(--app-gray-3)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search forms by name, code, or keyword (e.g., 'acat', 'transfer', 'ira')..."
                  className="w-full pl-10 pr-4 py-3 text-sm focus:outline-none"
                  style={{ border: '1px solid var(--app-input-border)', borderRadius: 'var(--app-radius)' }}
                  onFocus={e => { e.target.style.boxShadow = '0 0 0 2px rgba(138,0,10,0.18)'; }}
                  onBlur={e => { e.target.style.boxShadow = 'none'; }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <svg className="w-5 h-5" style={{ color: 'var(--app-gray-3)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <p className="mt-2 text-xs" style={{ color: 'var(--app-gray-3)' }}>
                Showing {filteredForms.length}
                {searchResult.limited ? ' top' : ''} of {searchResult.totalMatches} matching forms
                {' '}from {FORMS_DATA.length} total
                {debouncedQuery && ` matching "${debouncedQuery}"`}
              </p>
            </div>

            {/* Form rows */}
            <div className="space-y-3">
              {filteredForms.length > 0 ? (
                filteredForms.map(form => {
                  const isSelected = selectedForms.includes(form.code);
                  const canSelectForm = isFormSelectableForAccount(form, account);
                  const disabledReason = getFormSelectionDisabledReason(form, account);

                  return (
                    <div
                      key={form.code}
                      onClick={() => toggleFormSelection(form)}
                      className={`mobile-results-row flex items-center gap-4 p-4 border rounded-md transition-all motion-press ${
                        canSelectForm ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                      } ${
                        isSelected
                          ? 'border-[#B8B3A2] bg-[#F5F0E1]'
                          : 'border-[#CCCABC] hover:border-[#B8B3A2] hover:bg-[#ECEBE4]/40'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        disabled={!canSelectForm}
                        className="w-5 h-5 rounded pointer-events-none accent-[#404040]"
                      />
                      <div className="mobile-results-row-main flex-1 min-w-0">
                        <div className="mobile-results-row-title flex items-center gap-3">
                          <span className="font-mono text-sm font-medium" style={{ color: 'var(--app-gray-6)' }}>{form.code}</span>
                          <span className="text-sm" style={{ color: '#00759E' }}>{form.name}</span>
                        </div>
                        <p className="text-xs mt-1" style={{ color: 'var(--app-gray-3)' }}>{form.description}</p>
                        {disabledReason && (
                          <p className="text-xs mt-1" style={{ color: 'var(--app-bronze-2)' }}>{disabledReason}</p>
                        )}
                      </div>

                      {!form.eSignEnabled ? (
                        <div className="mobile-results-badge flex items-center gap-2 px-3 py-1 rounded text-sm" style={{ backgroundColor: 'var(--app-pastel-1)', color: 'var(--app-gray-4)' }}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          Print only
                        </div>
                      ) : canSelectForm ? (
                        <div className="mobile-results-badge flex items-center gap-2 px-3 py-1 rounded text-sm font-medium" style={{ backgroundColor: '#EDF6FD', color: '#0C7EC6' }}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          eSign
                        </div>
                      ) : (
                        <div className="mobile-results-badge flex items-center gap-2 px-3 py-1 rounded text-sm font-medium" style={{ backgroundColor: 'var(--app-pastel-2)', color: 'var(--app-bronze-2)' }}>
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
                  <svg className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--app-gray-2)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="mb-2" style={{ color: 'var(--app-gray-4)' }}>No forms found matching "{searchQuery}"</p>
                  <p className="text-sm" style={{ color: 'var(--app-gray-3)' }}>Try searching by form code, name, or keyword</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Floating CTA ── */}
      {(isMultiMode || selectedForms.length > 0) && (
        <div className="mobile-floating-action-wrap fixed bottom-5 inset-x-4 sm:inset-x-auto sm:right-6 z-30 flex justify-end pointer-events-none">
          <div className="pointer-events-auto floating-glass">
            {!isMultiMode && (
              <button
                onClick={() => setSelectedForms([])}
                className="floating-clear hidden sm:inline-flex"
              >
                Clear selection
              </button>
            )}
            <button
              onClick={handleContinue}
              disabled={isMultiMode && !canContinueMulti}
              className={`floating-action ${isMultiMode && !canContinueMulti ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`}
            >
              {isMultiMode
                ? canContinueMulti
                  ? `Continue · ${multiFormCount} form${multiFormCount !== 1 ? 's' : ''} · ${allAccounts.length} accounts`
                  : !compatibilityInfo.compatible
                    ? 'Resolve account conflicts'
                    : 'Select forms for each account'
                : `Continue with ${selectedForms.length} form${selectedForms.length > 1 ? 's' : ''}`
              }
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
