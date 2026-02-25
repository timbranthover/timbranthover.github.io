/**
 * Work item service.
 * Pure functions that produce new workItems state objects.
 * Each function returns a new workItems object (immutable update).
 */

const WORK_ITEMS_STORAGE_KEY = 'formsLibrary_workItems';

/**
 * Load work items from localStorage, falling back to MOCK_HISTORY.
 */
const loadWorkItems = () => {
  try {
    const saved = localStorage.getItem(WORK_ITEMS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : MOCK_HISTORY;
  } catch (error) {
    console.error('Error loading work items from localStorage:', error);
    return MOCK_HISTORY;
  }
};

/**
 * Persist work items to localStorage.
 */
const saveWorkItems = (workItems) => {
  try {
    localStorage.setItem(WORK_ITEMS_STORAGE_KEY, JSON.stringify(workItems));
  } catch (error) {
    console.error('Error saving work items to localStorage:', error);
  }
};

/**
 * Create an in-progress work item after sending for signature.
 */
const createInProgressItem = (account, packageData, envelopeId) => {
  return {
    id: `ip${Date.now()}`,
    account: account.accountNumber,
    names: account.accountName,
    forms: packageData.forms,
    status: packageData.signers.length > 1
      ? `Waiting for ${packageData.signers[0].name} and ${packageData.signers.length - 1} other${packageData.signers.length > 2 ? 's' : ''}`
      : `Waiting for ${packageData.signers[0]?.name || 'signer'}`,
    lastChange: 'Just now',
    progress: { signed: 0, total: packageData.signers.length },
    docusignEnvelopeId: envelopeId,
    sentAt: new Date().toISOString()
  };
};

/**
 * Add an in-progress item to workItems. Returns new workItems.
 */
const addInProgressItem = (workItems, item) => ({
  ...workItems,
  inProgress: [item, ...workItems.inProgress]
});

/**
 * Create a draft work item.
 */
const createDraftItem = (account, forms, draftName, draftFormData) => {
  return {
    id: `d${Date.now()}`,
    account: account.accountNumber,
    names: account.accountName,
    forms,
    status: 'Draft',
    lastChange: 'Just now',
    draftName,
    draftData: draftFormData,
    savedAt: new Date().toISOString()
  };
};

/**
 * Add a draft to workItems. Returns new workItems.
 */
const addDraft = (workItems, draft) => ({
  ...workItems,
  drafts: [draft, ...workItems.drafts]
});

/**
 * Remove a draft by id. Returns new workItems.
 */
const removeDraft = (workItems, draftId) => ({
  ...workItems,
  drafts: workItems.drafts.filter(d => d.id !== draftId)
});

/**
 * Move an in-progress item to voided. Returns new workItems.
 */
const voidItem = (workItems, item, reason) => ({
  ...workItems,
  inProgress: workItems.inProgress.filter(i => i.id !== item.id),
  voided: [{
    ...item,
    status: 'Voided',
    lastChange: 'Just now',
    reason
  }, ...workItems.voided]
});

/**
 * Handle envelope status change (auto-move completed/voided).
 * Returns new workItems or original if no change needed.
 */
const applyEnvelopeStatusChange = (workItems, itemId, envelopeData) => {
  const item = workItems.inProgress.find(i => i.id === itemId);
  if (!item) return workItems;

  if (envelopeData.status === 'completed') {
    return {
      ...workItems,
      inProgress: workItems.inProgress.filter(i => i.id !== itemId),
      completed: [{
        ...item,
        status: 'Completed',
        lastChange: 'Just now',
        progress: { signed: item.progress?.total || 1, total: item.progress?.total || 1 }
      }, ...workItems.completed]
    };
  }

  if (envelopeData.status === 'voided') {
    return {
      ...workItems,
      inProgress: workItems.inProgress.filter(i => i.id !== itemId),
      voided: [{
        ...item,
        status: 'Voided',
        lastChange: 'Just now',
        reason: envelopeData.voidedReason || 'Voided'
      }, ...workItems.voided]
    };
  }

  return workItems;
};

/**
 * Create an in-progress work item for a multi-account envelope.
 */
const createMultiAccountInProgressItem = (multiAccountData, envelopeId) => {
  const allAccounts = multiAccountData.accounts.map(({ account }) => account);
  const primaryAccount = allAccounts[0];

  const seenNames = new Set();
  const allSigners = [];
  allAccounts.forEach(acct => {
    acct.signers.forEach(s => {
      const key = s.name.toLowerCase();
      if (!seenNames.has(key)) {
        seenNames.add(key);
        allSigners.push(s);
      }
    });
  });

  const namesDisplay = allSigners.length > 1
    ? `${allSigners[0].name} + ${allSigners.length - 1} more`
    : allSigners[0]?.name || primaryAccount.accountName;

  const accountFormMap = {};
  multiAccountData.accounts.forEach(({ account, forms }) => {
    accountFormMap[account.accountNumber] = forms;
  });

  const allFormCodes = [...new Set(multiAccountData.accounts.flatMap(({ forms }) => forms))];

  const statusText = allSigners.length > 1
    ? `Waiting for ${allSigners[0].name} and ${allSigners.length - 1} other${allSigners.length > 2 ? 's' : ''}`
    : `Waiting for ${allSigners[0]?.name || 'signer'}`;

  return {
    id: `ip${Date.now()}`,
    isMultiAccount: true,
    accounts: allAccounts.map(a => a.accountNumber),
    account: primaryAccount.accountNumber,
    names: namesDisplay,
    accountFormMap,
    forms: allFormCodes,
    status: statusText,
    lastChange: 'Just now',
    progress: { signed: 0, total: allSigners.length },
    docusignEnvelopeId: envelopeId,
    sentAt: new Date().toISOString()
  };
};
