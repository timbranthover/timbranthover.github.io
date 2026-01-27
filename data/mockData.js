const MOCK_ACCOUNT = {
  accountNumber: "1B92008",
  accountName: "Timothy & Sarah Branthover",
  accountType: "Joint",
  signers: [
    { 
      id: 1, 
      name: "Timothy Branthover", 
      role: "Primary",
      emails: ["timbrant@gmail.com", "tim@ubs.com"],
      phones: ["9088724028", "9085559876"]
    },
    { 
      id: 2, 
      name: "Sarah Branthover", 
      role: "Joint",
      emails: ["sarah.test@gmail.com"],
      phones: ["9085551234"]
    }
  ]
};

const MOCK_DRAFT_DATA = {
  transferringFirm: "Fidelity Investments",
  transferringAccount: "Z12345678",
  dtccNumber: "0226",
  transferType: "partial",
  assetHandling: "in-kind",
  securities: [
    { symbol: "AAPL", quantity: "50", description: "Apple Inc. Common Stock" },
    { symbol: "MSFT", quantity: "75", description: "Microsoft Corp. Common Stock" }
  ]
};

const MOCK_HISTORY = {
  drafts: [
    { 
      id: 'd1', 
      account: '1B92008', 
      names: 'Timothy & Sarah Branthover', 
      forms: ['AC-TF'], 
      status: 'Draft', 
      lastChange: '1 day ago',
      draftName: "Tim's Fidelity Transfer - Q1 2026",
      draftData: MOCK_DRAFT_DATA 
    }
  ],
  inProgress: [
    { 
      id: 'ip1', 
      account: '1B92008', 
      names: 'Timothy & Sarah Branthover', 
      forms: ['AC-TF', 'AC-FT'], 
      status: 'Waiting for Timothy Branthover', 
      lastChange: '2 hours ago', 
      progress: { signed: 0, total: 2 } 
    },
    { 
      id: 'ip2', 
      account: '1C45920', 
      names: 'Jennifer Martinez', 
      forms: ['CL-ACRA'], 
      status: 'Waiting for Jennifer Martinez', 
      lastChange: '5 hours ago', 
      progress: { signed: 0, total: 1 } 
    }
  ],
  completed: [
    { 
      id: 'c1', 
      account: '1B92008', 
      names: 'Timothy & Sarah Branthover', 
      forms: ['AC-UND'], 
      status: 'Completed', 
      lastChange: '3 days ago', 
      progress: { signed: 2, total: 2 } 
    },
    { 
      id: 'c2', 
      account: '1D78234', 
      names: 'Robert Chen', 
      forms: ['AC-FT'], 
      status: 'Completed', 
      lastChange: '1 week ago', 
      progress: { signed: 1, total: 1 } 
    }
  ],
  voided: [
    { 
      id: 'v1', 
      account: '1B92008', 
      names: 'Timothy & Sarah Branthover', 
      forms: ['AC-TF'], 
      status: 'Voided', 
      lastChange: '4 days ago', 
      reason: 'Replaced with corrected version' 
    }
  ]
};

const AI_SUGGESTIONS = {
  "transfer": { form: "AC-TF", reason: "ACAT transfer from external institution" },
  "money": { form: "AC-FT", reason: "Electronic Funds Transfer authorization" },
  "fund": { form: "AC-FT", reason: "Electronic Funds Transfer authorization" },
  "eft": { form: "AC-FT", reason: "Electronic Funds Transfer authorization" },
  "advisory": { form: "CL-ACRA", reason: "Investment advisory agreement" },
  "beneficiary": { form: "WP-MAINT-BA", reason: "Update IRA beneficiary information" },
  "ira": { form: "AC-DQ", reason: "IRA distribution request and approval" },
  "distribution": { form: "AC-DQ", reason: "IRA distribution request and approval" }
};