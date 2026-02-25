/**
 * MultiEnvelopeView — two-step wizard for building a multi-account envelope.
 *
 * Step 1 (accountPicker): search & add accounts, compatibility checking.
 * Step 2 (formPicker):    per-account form selection.
 *
 * Props:
 *   onBack()            — navigate back to landing
 *   onContinue(data)    — advance to MultiPackageView
 *     data: { accounts: [{ account, forms }] }
 */
const MultiEnvelopeView = ({ onBack, onContinue }) => {
  const [step, setStep] = React.useState('accountPicker');
  const [searchInput, setSearchInput] = React.useState('');
  const [searchError, setSearchError] = React.useState('');
  const [selectedAccounts, setSelectedAccounts] = React.useState([]);

  // { [accountNumber]: [formCode, ...] }
  const [formSelections, setFormSelections] = React.useState({});

  // ── Derived: compatibility ──────────────────────────────────────────────────
  const compatibility = React.useMemo(
    () => canAccountsShareEnvelope(selectedAccounts),
    [selectedAccounts]
  );

  // ── Account picker ──────────────────────────────────────────────────────────
  const handleAddAccount = () => {
    const num = searchInput.trim().toUpperCase();
    if (!num) return;

    if (selectedAccounts.some(a => a.accountNumber === num)) {
      setSearchError('This account is already in the envelope.');
      return;
    }
    if (selectedAccounts.length >= 5) {
      setSearchError('Maximum 5 accounts per envelope.');
      return;
    }

    const account = MOCK_ACCOUNTS[num];
    if (!account) {
      setSearchError('Account not found. Verify and retry.');
      return;
    }

    setSelectedAccounts(prev => [...prev, account]);
    setFormSelections(prev => ({ ...prev, [num]: [] }));
    setSearchInput('');
    setSearchError('');
  };

  const handleRemoveAccount = (accountNumber) => {
    setSelectedAccounts(prev => prev.filter(a => a.accountNumber !== accountNumber));
    setFormSelections(prev => {
      const next = { ...prev };
      delete next[accountNumber];
      return next;
    });
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') handleAddAccount();
  };

  // ── Form picker ─────────────────────────────────────────────────────────────
  const getEligibleForms = (account) =>
    FORMS_DATA.filter(form => isFormSelectableForAccount(form, account));

  const toggleForm = (accountNumber, formCode) => {
    setFormSelections(prev => {
      const current = prev[accountNumber] || [];
      const updated = current.includes(formCode)
        ? current.filter(c => c !== formCode)
        : [...current, formCode];
      return { ...prev, [accountNumber]: updated };
    });
  };

  // All accounts must have ≥1 form selected
  const allAccountsHaveForms = selectedAccounts.every(
    a => (formSelections[a.accountNumber] || []).length > 0
  );

  const totalFormsSelected = Object.values(formSelections).reduce(
    (sum, codes) => sum + codes.length,
    0
  );

  const handleContinueToForms = () => {
    if (selectedAccounts.length < 2) return;
    if (!compatibility.compatible) return;
    setStep('formPicker');
  };

  const handleContinueToPackage = () => {
    if (!allAccountsHaveForms) return;
    const accounts = selectedAccounts.map(account => ({
      account,
      forms: formSelections[account.accountNumber] || []
    }));
    onContinue({ accounts });
  };

  // ── Account type badge ──────────────────────────────────────────────────────
  const accountTypeBadge = (account) => {
    const typeColors = {
      RMA_INDIVIDUAL: 'bg-blue-50 text-blue-700 border-blue-200',
      RMA_JOINT:      'bg-purple-50 text-purple-700 border-purple-200',
      TRUST:          'bg-amber-50 text-amber-700 border-amber-200',
      IRA_ROTH:       'bg-emerald-50 text-emerald-700 border-emerald-200',
      IRA_TRADITIONAL:'bg-teal-50 text-teal-700 border-teal-200'
    };
    const cls = typeColors[account.accountTypeKey] || 'bg-gray-50 text-gray-600 border-gray-200';
    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border tracking-wide ${cls}`}>
        {account.accountType}
      </span>
    );
  };

  // ── Is account incompatible in current set ──────────────────────────────────
  const isIncompatible = (accountNumber) =>
    !compatibility.compatible && compatibility.incompatibleAccounts.includes(accountNumber);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start gap-3">
        <button
          onClick={step === 'formPicker' ? () => setStep('accountPicker') : onBack}
          className="mt-0.5 flex items-center gap-1.5 text-sm font-medium px-2.5 py-1.5 rounded-md border transition-colors"
          style={{ borderColor: 'var(--ubs-card-border)', color: 'var(--ubs-gray-5)', backgroundColor: 'white' }}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back
        </button>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--ubs-gray-6)' }}>
              Multi-Account Envelope
            </h1>
            {/* Step indicator */}
            <div className="flex items-center gap-1">
              <span
                className={`h-2 w-2 rounded-full transition-colors ${step === 'accountPicker' ? '' : 'opacity-30'}`}
                style={{ backgroundColor: 'var(--ubs-bordeaux-1)' }}
              />
              <span
                className={`h-2 w-2 rounded-full transition-colors ${step === 'formPicker' ? '' : 'opacity-30'}`}
                style={{ backgroundColor: 'var(--ubs-bordeaux-1)' }}
              />
            </div>
          </div>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ubs-gray-4)' }}>
            {step === 'accountPicker'
              ? 'Add accounts to combine into one envelope — step 1 of 2'
              : 'Choose which forms to include per account — step 2 of 2'}
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* STEP 1: Account Picker                                                */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {step === 'accountPicker' && (
        <div className="space-y-4">

          {/* Search row */}
          <div className="bg-white rounded-lg border p-4 space-y-3" style={{ borderColor: 'var(--ubs-card-border)', boxShadow: 'var(--ubs-card-shadow)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--ubs-gray-4)' }}>
              Search &amp; Add Accounts
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={e => { setSearchInput(e.target.value); setSearchError(''); }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Account number (e.g. TIM001)"
                className="flex-1 px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 transition"
                style={{
                  borderColor: searchError ? '#EF4444' : 'var(--ubs-input-border)',
                  fontSize: '0.875rem',
                  color: 'var(--ubs-gray-6)',
                  '--tw-ring-color': 'var(--ubs-bordeaux-1)'
                }}
              />
              <button
                onClick={handleAddAccount}
                className="px-4 py-2 rounded-md text-sm font-semibold text-white transition-colors"
                style={{ backgroundColor: 'var(--ubs-bordeaux-1)' }}
              >
                Add
              </button>
            </div>
            {searchError && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {searchError}
              </p>
            )}
          </div>

          {/* Selected accounts list */}
          {selectedAccounts.length > 0 && (
            <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: 'var(--ubs-card-border)', boxShadow: 'var(--ubs-card-shadow)' }}>
              <div className="px-4 py-2.5 border-b flex items-center justify-between" style={{ borderColor: 'var(--ubs-card-border)', backgroundColor: 'var(--ubs-pastel-1)' }}>
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--ubs-gray-4)' }}>
                  Selected Accounts
                </p>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--ubs-bordeaux-1)', color: 'white' }}>
                  {selectedAccounts.length}
                </span>
              </div>
              <ul className="divide-y" style={{ borderColor: 'var(--ubs-card-border)' }}>
                {selectedAccounts.map(account => {
                  const bad = isIncompatible(account.accountNumber);
                  return (
                    <li key={account.accountNumber} className={`flex items-center gap-3 px-4 py-3 transition-colors ${bad ? 'bg-amber-50' : ''}`}>
                      {/* Status dot */}
                      <span
                        className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${bad ? 'bg-amber-400' : 'bg-emerald-500'}`}
                      />
                      {/* Account info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold" style={{ color: 'var(--ubs-gray-6)' }}>
                            {account.accountNumber}
                          </span>
                          <span className="text-sm font-medium truncate" style={{ color: 'var(--ubs-gray-6)' }}>
                            {account.accountName}
                          </span>
                          {accountTypeBadge(account)}
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--ubs-gray-4)' }}>
                          {account.signers.map(s => s.name).join(' · ')}
                        </p>
                      </div>
                      {/* Remove */}
                      <button
                        onClick={() => handleRemoveAccount(account.accountNumber)}
                        className="flex-shrink-0 p-1 rounded-md hover:bg-red-50 transition-colors"
                        title="Remove account"
                        style={{ color: 'var(--ubs-gray-3)' }}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Compatibility warning */}
          {!compatibility.compatible && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 flex gap-3">
              <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-amber-800">Incompatible account types</p>
                <p className="text-sm text-amber-700 mt-0.5">{compatibility.reason}</p>
                <p className="text-xs text-amber-600 mt-1">
                  Remove accounts marked in amber or start a separate envelope for those account types.
                </p>
              </div>
            </div>
          )}

          {/* Empty state hint */}
          {selectedAccounts.length === 0 && (
            <div className="rounded-lg border border-dashed p-8 text-center" style={{ borderColor: 'var(--ubs-gray-1)' }}>
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--ubs-gray-2)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm" style={{ color: 'var(--ubs-gray-3)' }}>Search above to add accounts.</p>
              <p className="text-xs mt-1" style={{ color: 'var(--ubs-gray-2)' }}>
                Try: ABC123, TIM001, TIM002, TIM003
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs" style={{ color: 'var(--ubs-gray-3)' }}>
              {selectedAccounts.length < 2
                ? 'Add at least 2 accounts to continue'
                : selectedAccounts.length === 1
                  ? '1 account selected'
                  : `${selectedAccounts.length} accounts selected`}
            </span>
            <div className="relative group">
              <button
                onClick={handleContinueToForms}
                disabled={selectedAccounts.length < 2 || !compatibility.compatible}
                className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold text-white transition-all"
                style={{
                  backgroundColor: (selectedAccounts.length >= 2 && compatibility.compatible)
                    ? 'var(--ubs-bordeaux-1)'
                    : 'var(--ubs-gray-1)',
                  cursor: (selectedAccounts.length >= 2 && compatibility.compatible) ? 'pointer' : 'not-allowed'
                }}
              >
                Select Forms
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* STEP 2: Form Picker                                                    */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {step === 'formPicker' && (
        <div className="space-y-4">
          {selectedAccounts.map(account => {
            const eligible = getEligibleForms(account);
            const selected = formSelections[account.accountNumber] || [];
            const hasSelection = selected.length > 0;

            return (
              <div
                key={account.accountNumber}
                className="bg-white rounded-lg border overflow-hidden"
                style={{ borderColor: hasSelection ? 'var(--ubs-bordeaux-1)' : 'var(--ubs-card-border)', boxShadow: 'var(--ubs-card-shadow)' }}
              >
                {/* Account header */}
                <div
                  className="px-4 py-3 border-b flex items-center gap-3 flex-wrap"
                  style={{ borderColor: 'var(--ubs-card-border)', backgroundColor: 'var(--ubs-pastel-1)' }}
                >
                  <span className="font-mono text-xs font-bold" style={{ color: 'var(--ubs-bordeaux-1)' }}>
                    {account.accountNumber}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--ubs-gray-6)' }}>
                    {account.accountName}
                  </span>
                  {accountTypeBadge(account)}
                  {hasSelection && (
                    <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--ubs-bordeaux-1)', color: 'white' }}>
                      {selected.length} selected
                    </span>
                  )}
                  {!hasSelection && (
                    <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full border" style={{ color: 'var(--ubs-gray-4)', borderColor: 'var(--ubs-gray-1)' }}>
                      None selected
                    </span>
                  )}
                </div>

                {/* Form rows */}
                <ul className="divide-y" style={{ borderColor: 'var(--ubs-card-border)' }}>
                  {eligible.length === 0 && (
                    <li className="px-4 py-4 text-sm" style={{ color: 'var(--ubs-gray-3)' }}>
                      No eSign-eligible forms for this account type.
                    </li>
                  )}
                  {eligible.map(form => {
                    const checked = selected.includes(form.code);
                    return (
                      <li
                        key={form.code}
                        onClick={() => toggleForm(account.accountNumber, form.code)}
                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${checked ? '' : 'hover:bg-gray-50'}`}
                        style={checked ? { backgroundColor: 'rgba(189,0,12,0.04)' } : {}}
                      >
                        {/* Checkbox */}
                        <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${checked ? 'border-red-700' : ''}`}
                          style={checked ? { backgroundColor: 'var(--ubs-bordeaux-1)', borderColor: 'var(--ubs-bordeaux-1)' } : { borderColor: 'var(--ubs-gray-2)' }}
                        >
                          {checked && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </div>
                        {/* Form info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold" style={{ color: checked ? 'var(--ubs-bordeaux-1)' : 'var(--ubs-gray-5)' }}>
                              {form.code}
                            </span>
                            <span className="text-sm font-medium" style={{ color: 'var(--ubs-gray-6)' }}>
                              {form.name}
                            </span>
                            {form.docuSignEnabled && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-blue-200 bg-blue-50 text-blue-700">
                                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                                </svg>
                                eSign
                              </span>
                            )}
                          </div>
                          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--ubs-gray-3)' }}>
                            {form.description}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}

          {/* Footer */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm" style={{ color: 'var(--ubs-gray-4)' }}>
              {allAccountsHaveForms
                ? `${totalFormsSelected} form${totalFormsSelected !== 1 ? 's' : ''} across ${selectedAccounts.length} accounts`
                : 'Select at least 1 form per account to continue'}
            </span>
            <div className="relative group">
              <button
                onClick={handleContinueToPackage}
                disabled={!allAccountsHaveForms}
                className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold text-white transition-all"
                style={{
                  backgroundColor: allAccountsHaveForms ? 'var(--ubs-bordeaux-1)' : 'var(--ubs-gray-1)',
                  cursor: allAccountsHaveForms ? 'pointer' : 'not-allowed'
                }}
              >
                Continue
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
