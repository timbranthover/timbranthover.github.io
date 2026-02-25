/**
 * MultiPackageView — review, assign signers, and send a multi-account envelope.
 *
 * Props:
 *   multiAccountData  { accounts: [{ account, forms }] }
 *   onBack()          — return to ResultsView
 *   onSendForSignature(packageData) — trigger send in app.js
 *   onSaveDraft(name, data)         — save as draft
 */
const MultiPackageView = ({ multiAccountData, onBack, onSendForSignature, onSaveDraft }) => {
  const { accounts } = multiAccountData;

  // ── Build union signers list ────────────────────────────────────────────────
  // Deduplicated by name (case-insensitive); _nameKey used as stable identity
  const unionSigners = React.useMemo(() => {
    const seen = new Map();
    for (const { account } of accounts) {
      for (const signer of (account.signers || [])) {
        const key = signer.name.toLowerCase();
        if (!seen.has(key)) {
          seen.set(key, { ...signer, _nameKey: key });
        }
      }
    }
    return [...seen.values()];
  }, [accounts]);

  // ── Signers state ───────────────────────────────────────────────────────────
  const [signerOrder, setSignerOrder] = React.useState(
    () => unionSigners.map(s => s._nameKey)
  );
  // signerDetails: { [nameKey]: { email } }
  const [signerDetails, setSignerDetails] = React.useState(() => {
    const init = {};
    for (const s of unionSigners) {
      init[s._nameKey] = { email: s.emails?.[0] || s.email || '' };
    }
    return init;
  });

  const [customMessage, setCustomMessage] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const [showSaveDraftModal, setShowSaveDraftModal] = React.useState(false);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const orderedSigners = signerOrder
    .map(key => unionSigners.find(s => s._nameKey === key))
    .filter(Boolean);

  const canSend = orderedSigners.length > 0;

  const totalForms = accounts.reduce((sum, { forms }) => sum + forms.length, 0);

  // ── Signer reorder ──────────────────────────────────────────────────────────
  const moveSignerUp = (idx) => {
    if (idx === 0) return;
    setSignerOrder(prev => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  const moveSignerDown = (idx) => {
    if (idx === signerOrder.length - 1) return;
    setSignerOrder(prev => {
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  const handleEmailChange = (nameKey, email) => {
    setSignerDetails(prev => ({ ...prev, [nameKey]: { ...prev[nameKey], email } }));
  };

  // ── Account type badge ───────────────────────────────────────────────────────
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

  // ── Send ────────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!canSend || isSending) return;
    setIsSending(true);

    const packageData = {
      ...multiAccountData,
      signers: orderedSigners,
      signerOrder,
      signerDetails,
      sequentialSigning: orderedSigners.length >= 2,
      customMessage
    };

    try {
      await onSendForSignature(packageData);
    } finally {
      setIsSending(false);
    }
  };

  // ── Save draft ──────────────────────────────────────────────────────────────
  const handleSaveDraftConfirm = (draftName) => {
    onSaveDraft(draftName, { signerDetails, customMessage });
    setShowSaveDraftModal(false);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl space-y-5 pb-28">

      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={onBack}
          className="mt-0.5 flex items-center gap-1.5 text-sm font-medium px-2.5 py-1.5 rounded-md border transition-colors"
          style={{ borderColor: 'var(--app-card-border)', color: 'var(--app-gray-5)', backgroundColor: 'white' }}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--app-gray-6)' }}>
            Review &amp; Send
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--app-gray-4)' }}>
            {accounts.length} accounts · {totalForms} form{totalForms !== 1 ? 's' : ''} · {orderedSigners.length} signer{orderedSigners.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* ── Accounts & Forms summary ── */}
      <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: 'var(--app-card-border)', boxShadow: 'var(--app-card-shadow)' }}>
        <div className="px-4 py-2.5 border-b" style={{ borderColor: 'var(--app-card-border)', backgroundColor: 'var(--app-pastel-1)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--app-gray-4)' }}>
            Accounts &amp; Forms
          </p>
        </div>
        <ul className="divide-y" style={{ borderColor: 'var(--app-card-border)' }}>
          {accounts.map(({ account, forms }) => {
            const formObjs = forms
              .map(code => FORMS_DATA.find(f => f.code === code))
              .filter(Boolean);
            return (
              <li key={account.accountNumber} className="px-4 py-3">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className="font-mono text-xs font-bold" style={{ color: 'var(--app-bordeaux-1)' }}>
                    {account.accountNumber}
                  </span>
                  <span className="text-sm font-medium" style={{ color: 'var(--app-gray-6)' }}>
                    {account.accountName}
                  </span>
                  {accountTypeBadge(account)}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {formObjs.map(form => (
                    <span
                      key={form.code}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium"
                      style={{ borderColor: 'var(--app-card-border)', backgroundColor: 'var(--app-pastel-2)', color: 'var(--app-gray-6)' }}
                    >
                      <span className="font-mono font-bold" style={{ color: 'var(--app-bordeaux-1)' }}>{form.code}</span>
                      {form.name}
                    </span>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ── Signers ── */}
      <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: 'var(--app-card-border)', boxShadow: 'var(--app-card-shadow)' }}>
        <div className="px-4 py-2.5 border-b" style={{ borderColor: 'var(--app-card-border)', backgroundColor: 'var(--app-pastel-1)' }}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--app-gray-4)' }}>
              Signers
            </p>
            {orderedSigners.length >= 2 && (
              <span className="text-xs px-2 py-0.5 rounded-full border" style={{ color: 'var(--app-gray-4)', borderColor: 'var(--app-gray-1)', backgroundColor: 'var(--app-pastel-2)' }}>
                Sequential signing
              </span>
            )}
          </div>
        </div>
        <ul className="divide-y" style={{ borderColor: 'var(--app-card-border)' }}>
          {orderedSigners.map((signer, idx) => {
            const nameKey = signer._nameKey;
            const currentEmail = signerDetails[nameKey]?.email || '';
            const allEmails = signer.emails || (signer.email ? [signer.email] : []);

            return (
              <li key={nameKey} className="flex items-center gap-3 px-4 py-3">
                {/* Order badge */}
                <div
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: 'var(--app-bordeaux-1)' }}
                >
                  {idx + 1}
                </div>

                {/* Signer info + email */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: 'var(--app-gray-6)' }}>
                      {signer.name}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--app-gray-3)' }}>
                      {signer.role}
                    </span>
                  </div>
                  {/* Email selector */}
                  {allEmails.length > 1 ? (
                    <select
                      value={currentEmail}
                      onChange={e => handleEmailChange(nameKey, e.target.value)}
                      className="text-xs rounded border px-2 py-1 focus:outline-none w-full max-w-xs"
                      style={{ borderColor: 'var(--app-input-border)', color: 'var(--app-gray-6)' }}
                    >
                      {allEmails.map(email => (
                        <option key={email} value={email}>{email}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs" style={{ color: 'var(--app-gray-3)' }}>{currentEmail}</span>
                  )}
                </div>

                {/* Reorder buttons */}
                {orderedSigners.length > 1 && (
                  <div className="flex-shrink-0 flex flex-col gap-0.5">
                    <button
                      onClick={() => moveSignerUp(idx)}
                      className={`p-0.5 rounded transition-opacity ${idx === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                      style={{ color: 'var(--app-gray-3)' }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveSignerDown(idx)}
                      className={`p-0.5 rounded transition-opacity ${idx === orderedSigners.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                      style={{ color: 'var(--app-gray-3)' }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* ── Personal message ── */}
      <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: 'var(--app-card-border)', boxShadow: 'var(--app-card-shadow)' }}>
        <div className="px-4 py-2.5 border-b" style={{ borderColor: 'var(--app-card-border)', backgroundColor: 'var(--app-pastel-1)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--app-gray-4)' }}>
            Personal Message <span className="normal-case font-normal">(optional)</span>
          </p>
        </div>
        <div className="p-4">
          <textarea
            value={customMessage}
            onChange={e => setCustomMessage(e.target.value.slice(0, 150))}
            placeholder="Add a note to your client…"
            rows={3}
            className="w-full rounded-md border px-3 py-2 text-sm resize-none focus:outline-none"
            style={{ borderColor: 'var(--app-input-border)', color: 'var(--app-gray-6)' }}
          />
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs" style={{ color: 'var(--app-gray-3)' }}>Included in the DocuSign email to signers</span>
            <span className={`text-xs font-medium ${customMessage.length >= 150 ? 'text-amber-600' : ''}`} style={customMessage.length < 150 ? { color: 'var(--app-gray-3)' } : {}}>
              {customMessage.length}/150
            </span>
          </div>
        </div>
      </div>

      {/* ── Floating glass CTA ── */}
      <div className="mobile-floating-action-wrap fixed bottom-5 inset-x-4 sm:inset-x-auto sm:right-6 z-30 flex justify-end pointer-events-none">
        <div className="pointer-events-auto floating-glass">
          <button
            onClick={() => setShowSaveDraftModal(true)}
            className="floating-clear hidden sm:inline-flex"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
            </svg>
            Save Draft
          </button>
          <button
            onClick={handleSend}
            disabled={!canSend || isSending}
            className={`floating-action ${!canSend || isSending ? 'is-disabled' : ''}`}
          >
            {isSending ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Sending…
              </>
            ) : (
              <>
                Send for Signature
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Save Draft Modal */}
      {showSaveDraftModal && (
        <SaveDraftModal
          onClose={() => setShowSaveDraftModal(false)}
          onSave={handleSaveDraftConfirm}
          defaultName={`Multi-Envelope: ${accounts.map(a => a.account.accountNumber).join(', ')}`}
        />
      )}
    </div>
  );
};
