const MOCK_ACCOUNTS = {
  "1B92008": {
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
  },
  "1B92007": {
    accountNumber: "1B92007",
    accountName: "Timothy Branthover",
    accountType: "Roth IRA",
    signers: [
      {
        id: 1,
        name: "Timothy Branthover",
        role: "Owner",
        emails: ["timbrant@gmail.com", "tim@ubs.com", "timothy.brant@personal.com"],
        phones: ["9088724028", "9085559876", "2015551234"]
      }
    ]
  },
  "1C88543": {
    accountNumber: "1C88543",
    accountName: "Michael Chen",
    accountType: "Individual",
    signers: [
      {
        id: 1,
        name: "Michael Chen",
        role: "Owner",
        emails: ["mchen@email.com", "michael.chen@work.com"],
        phones: ["4155551234", "4155559876"]
      }
    ]
  },
  "1D12456": {
    accountNumber: "1D12456",
    accountName: "Jennifer & Robert Martinez",
    accountType: "Joint",
    signers: [
      {
        id: 1,
        name: "Jennifer Martinez",
        role: "Primary",
        emails: ["jmartinez@email.com", "jennifer.m@work.com"],
        phones: ["3105551234", "3105559876"]
      },
      {
        id: 2,
        name: "Robert Martinez",
        role: "Joint",
        emails: ["rmartinez@email.com", "robert.martinez@business.com"],
        phones: ["3105552345", "3105558765"]
      }
    ]
  },
  "1E99871": {
    accountNumber: "1E99871",
    accountName: "Sarah Johnson Living Trust",
    accountType: "Trust",
    signers: [
      {
        id: 1,
        name: "Sarah Johnson",
        role: "Trustee",
        emails: ["sjohnson@email.com", "sarah.j.trust@legal.com"],
        phones: ["6175551234", "6175559876"]
      }
    ]
  },
  "1F44320": {
    accountNumber: "1F44320",
    accountName: "David Williams",
    accountType: "Traditional IRA",
    signers: [
      {
        id: 1,
        name: "David Williams",
        role: "Owner",
        emails: ["dwilliams@email.com", "david.w@company.com", "dwill88@personal.net"],
        phones: ["7025551234", "7025559876"]
      }
    ]
  }
};

// Default account for backward compatibility
const MOCK_ACCOUNT = MOCK_ACCOUNTS["1B92008"];

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