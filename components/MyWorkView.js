const MyWorkView = ({ onBack, onLoadDraft, onDeleteDraft, workItems = MOCK_HISTORY, onVoidEnvelope, onEnvelopeStatusChange }) => {
  const [workTab, setWorkTab] = React.useState('inProgress');
  const [activeActionMenu, setActiveActionMenu] = React.useState(null);
  const [envelopeStatuses, setEnvelopeStatuses] = React.useState({});
  const [loadingActions, setLoadingActions] = React.useState({});
  const [isPolling, setIsPolling] = React.useState(false);
  const [lastRefreshed, setLastRefreshed] = React.useState(null);

  // Status badge config
  const STATUS_BADGES = {
    sent: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Sent' },
    delivered: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Viewed' },
    completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
    voided: { bg: 'bg-red-100', text: 'text-red-800', label: 'Voided' },
    declined: { bg: 'bg-red-100', text: 'text-red-800', label: 'Declined' }
  };

  // Fetch status for all items with DocuSign envelope IDs (in parallel)
  const fetchAllStatuses = async () => {
    const allItems = [
      ...workItems.inProgress,
      ...workItems.completed,
      ...workItems.voided
    ].filter(item => item.docusignEnvelopeId);

    if (allItems.length === 0) return;

    setIsPolling(true);

    // Fire all API calls in parallel
    const results = await Promise.all(
      allItems.map(async (item) => {
        try {
          const result = await DocuSignService.getEnvelopeStatus(item.docusignEnvelopeId);
          return { item, result };
        } catch (err) {
          console.error('Error polling status for', item.docusignEnvelopeId, err);
          return { item, result: null };
        }
      })
    );

    // Process all results and batch update state
    const newStatuses = {};
    for (const { item, result } of results) {
      if (result && result.success) {
        newStatuses[item.docusignEnvelopeId] = result;

        // Auto-move items if DocuSign status changed to terminal state
        const isInProgress = workItems.inProgress.some(i => i.id === item.id);
        if (isInProgress && onEnvelopeStatusChange) {
          if (result.status === 'completed' || result.status === 'voided') {
            onEnvelopeStatusChange(item.id, result);
          }
        }
      }
    }

    setEnvelopeStatuses(prev => ({ ...prev, ...newStatuses }));
    setIsPolling(false);
    setLastRefreshed(new Date());
  };

  // Poll on mount and every 30 seconds
  React.useEffect(() => {
    fetchAllStatuses();
    const interval = setInterval(fetchAllStatuses, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close action menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => setActiveActionMenu(null);
    if (activeActionMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeActionMenu]);

  // Action handlers
  const handleResend = async (item) => {
    if (!item.docusignEnvelopeId) return;
    setLoadingActions(prev => ({ ...prev, [item.id]: 'resending' }));
    setActiveActionMenu(null);

    const result = await DocuSignService.resendEnvelope(item.docusignEnvelopeId);
    if (result.success) {
      alert('Notification resent successfully! The signer will receive a new email.');
    } else {
      alert(`Failed to resend: ${result.error}`);
    }

    setLoadingActions(prev => { const next = { ...prev }; delete next[item.id]; return next; });
  };

  const handleVoid = async (item) => {
    if (!item.docusignEnvelopeId) return;
    const reason = prompt('Enter reason for voiding this envelope:');
    if (!reason) return;

    setLoadingActions(prev => ({ ...prev, [item.id]: 'voiding' }));
    setActiveActionMenu(null);

    if (onVoidEnvelope) {
      await onVoidEnvelope(item, reason);
    }

    setLoadingActions(prev => { const next = { ...prev }; delete next[item.id]; return next; });
  };

  const handleDownload = async (item) => {
    if (!item.docusignEnvelopeId) return;
    setLoadingActions(prev => ({ ...prev, [item.id]: 'downloading' }));
    setActiveActionMenu(null);

    const result = await DocuSignService.downloadDocument(item.docusignEnvelopeId);
    if (!result.success) {
      alert(`Failed to download: ${result.error}`);
    }

    setLoadingActions(prev => { const next = { ...prev }; delete next[item.id]; return next; });
  };

  // Get recipient info from envelope status
  const getRecipientInfo = (item) => {
    if (!item.docusignEnvelopeId) return null;
    const status = envelopeStatuses[item.docusignEnvelopeId];
    if (!status || !status.recipients) return null;

    const signers = status.recipients.signers || [];
    const completed = signers.filter(s => s.status === 'completed').length;
    return { signers, completed, total: signers.length };
  };

  // Format relative time
  const formatTime = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // Format date/time elegantly for saved drafts
  const formatDateTime = (isoString) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' at ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  // Format date/time for sent envelopes (DD/MM/YYYY format)
  const formatSentDate = (isoString) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `${day}/${month}/${year} at ${time}`;
  };

  // Render the hover popup with recipient detail
  const renderDetailPopup = (recipientInfo, envStatus) => {
    if (!recipientInfo && !envStatus) return null;

    return (
      <div className="absolute left-0 top-full mt-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-20 w-60 bg-white rounded-lg shadow-lg border border-gray-200 p-3 pointer-events-none">
        <div className="absolute -top-1 left-3 w-2 h-2 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
        {envStatus && envStatus.voidedReason && (
          <div className="text-xs text-gray-600 mb-2">
            <span className="font-medium">Reason:</span> {envStatus.voidedReason}
          </div>
        )}
        {recipientInfo && recipientInfo.signers.map(signer => (
          <div key={signer.recipientId || signer.email} className="flex items-center gap-1.5 text-xs text-gray-600 py-0.5">
            {signer.status === 'completed' ? (
              <svg className="w-3 h-3 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : signer.status === 'delivered' ? (
              <svg className="w-3 h-3 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            ) : (
              <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span>{signer.name}: {signer.status === 'completed' ? 'Signed' : signer.status === 'delivered' ? 'Viewed' : 'Pending'}</span>
            {signer.signedDateTime && (
              <span className="text-gray-400 ml-auto flex-shrink-0">({formatTime(signer.signedDateTime)})</span>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render status cell for an item
  const renderStatusCell = (item) => {
    const envStatus = item.docusignEnvelopeId ? envelopeStatuses[item.docusignEnvelopeId] : null;
    const recipientInfo = getRecipientInfo(item);
    const loading = loadingActions[item.id];

    // Loading state
    if (loading) {
      const labels = { voiding: 'Voiding...', resending: 'Resending...', downloading: 'Downloading...' };
      return (
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm text-blue-600">{labels[loading]}</span>
        </div>
      );
    }

    // Real DocuSign status (or pending fetch for DocuSign items)
    if (item.docusignEnvelopeId) {
      // If we have status from API, use it; otherwise default to 'sent' while loading
      const status = envStatus?.status || 'sent';
      const badge = STATUS_BADGES[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };

      return (
        <div className="relative group inline-flex items-center gap-2">
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium cursor-default ${badge.bg} ${badge.text}`}>
            {badge.label}
          </span>
          {/* Always show progress bar for in-progress items to prevent layout shift */}
          {workTab === 'inProgress' && status !== 'completed' && status !== 'voided' && (
            <div className="flex items-center gap-2">
              <div className="w-32 h-2.5 bg-gray-200 rounded-full">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${recipientInfo && recipientInfo.total > 0 ? (recipientInfo.completed / recipientInfo.total) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">
                {recipientInfo ? `${recipientInfo.completed}/${recipientInfo.total}` : '0/1'}
              </span>
            </div>
          )}
          {envStatus && (recipientInfo || envStatus.voidedReason) && renderDetailPopup(recipientInfo, envStatus)}
        </div>
      );
    }

    // Default mock display
    return (
      <div className="flex items-center gap-2">
        {item.progress && workTab === 'inProgress' && (
          <div className="flex items-center gap-2">
            <div className="w-32 h-2.5 bg-gray-200 rounded-full">
              <div
                className="h-full bg-blue-600 rounded-full"
                style={{ width: `${(item.progress.signed / item.progress.total) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-600">{item.progress.signed}/{item.progress.total}</span>
          </div>
        )}
        {workTab === 'completed' && (
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        <span className="text-sm text-gray-900">{item.status}</span>
      </div>
    );
  };

  // Render action buttons for an item
  const renderActionMenu = (item) => {
    const hasEnvelope = !!item.docusignEnvelopeId;

    return (
      <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
        {workTab === 'drafts' && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onLoadDraft(item); setActiveActionMenu(null); }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Resume editing
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete draft "${item.draftName || 'Untitled'}"?`)) {
                  if (onDeleteDraft) onDeleteDraft(item);
                }
                setActiveActionMenu(null);
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete draft
            </button>
          </>
        )}
        {workTab === 'inProgress' && (
          <>
            {hasEnvelope && (
              <button
                onClick={(e) => { e.stopPropagation(); handleResend(item); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Resend notification
              </button>
            )}
            {!hasEnvelope && (
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View envelope
              </button>
            )}
            {hasEnvelope ? (
              <button
                onClick={(e) => { e.stopPropagation(); handleVoid(item); }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                Void envelope
              </button>
            ) : (
              <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Void envelope
              </button>
            )}
          </>
        )}
        {workTab === 'completed' && (
          <>
            {hasEnvelope && (
              <button
                onClick={(e) => { e.stopPropagation(); handleDownload(item); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download signed PDF
              </button>
            )}
            <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View details
            </button>
          </>
        )}
        {workTab === 'voided' && (
          <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View details
          </button>
        )}
      </div>
    );
  };

  const tabConfig = [
    { key: 'drafts', label: 'Drafts' },
    { key: 'inProgress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
    { key: 'voided', label: 'Voided' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-gray-900">My Work</h2>
          {isPolling && (
            <svg className="w-4 h-4 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
        </div>
        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <span className="text-xs text-gray-400">Updated {formatTime(lastRefreshed.toISOString())}</span>
          )}
          <button
            onClick={fetchAllStatuses}
            disabled={isPolling}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${isPolling ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            onClick={onBack}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Back to search
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 flex gap-1 p-2">
          {tabConfig.map(tab => (
            <button
              key={tab.key}
              onClick={() => setWorkTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded ${
                workTab === tab.key
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label} ({workItems[tab.key].length})
            </button>
          ))}
        </div>

        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr className="h-11">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-700 uppercase">To</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-700 uppercase">Forms</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-700 uppercase">Status</th>
              {workTab === 'drafts' && (
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-700 uppercase">Saved</th>
              )}
              {workTab === 'inProgress' && (
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-700 uppercase">Sent</th>
              )}
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-700 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {workItems[workTab].length === 0 && (
              <tr>
                <td colSpan={(workTab === 'drafts' || workTab === 'inProgress') ? 5 : 4} className="px-6 py-8 text-center text-sm text-gray-500">
                  No items in this tab
                </td>
              </tr>
            )}
            {workItems[workTab].map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{item.account}</span>
                    <span className="text-sm text-gray-500">{item.names}</span>
                  </div>
                  {item.draftName && workTab === 'drafts' && (
                    <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      {item.draftName}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {item.forms.map(form => (
                      <span key={form} className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {form}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {renderStatusCell(item)}
                </td>
                {workTab === 'drafts' && (
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDateTime(item.savedAt)}
                  </td>
                )}
                {workTab === 'inProgress' && (
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatSentDate(item.sentAt)}
                  </td>
                )}
                <td className="px-6 py-4 text-right relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveActionMenu(activeActionMenu === item.id ? null : item.id); }}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>

                  {activeActionMenu === item.id && renderActionMenu(item)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
