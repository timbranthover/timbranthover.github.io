const MOCK_ACCOUNTS = {
  "ABC123": {
    accountNumber: "ABC123",
    accountName: "Timothy & Sarah Branthover",
    accountType: "Joint",
    accountTypeKey: "RMA_JOINT",
    signers: [
      {
        id: 1,
        name: "Timothy Branthover",
        role: "Primary",
        emails: ["timbranthover@gmail.com", "timbrant@gmail.com", "tim@work.com"],
        phones: ["9088724028", "9085559876"]
      },
      {
        id: 2,
        name: "Sarah Branthover",
        role: "Joint",
        emails: ["sarah.test@gmail.com", "timbranthover@gmail.com"],
        phones: ["9085551234"]
      }
    ]
  },
  "QWE123": {
    accountNumber: "QWE123",
    accountName: "Timothy Branthover",
    accountType: "Roth IRA",
    accountTypeKey: "IRA_ROTH",
    signers: [
      {
        id: 1,
        name: "Timothy Branthover",
        role: "Owner",
        emails: ["timbrant@gmail.com", "tim@work.com", "timothy.brant@personal.com"],
        phones: ["9088724028", "9085559876", "2015551234"]
      }
    ]
  },
  "RTY234": {
    accountNumber: "RTY234",
    accountName: "Michael Chen",
    accountType: "Individual",
    accountTypeKey: "RMA_INDIVIDUAL",
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
  "UIO345": {
    accountNumber: "UIO345",
    accountName: "Jennifer & Robert Martinez",
    accountType: "Joint",
    accountTypeKey: "RMA_JOINT",
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
  "ASD456": {
    accountNumber: "ASD456",
    accountName: "Sarah Johnson Living Trust",
    accountType: "Trust",
    accountTypeKey: "TRUST",
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
  "FGH567": {
    accountNumber: "FGH567",
    accountName: "David Williams",
    accountType: "Traditional IRA",
    accountTypeKey: "IRA_TRADITIONAL",
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
const MOCK_ACCOUNT = MOCK_ACCOUNTS["ABC123"];

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
  drafts: [],
  inProgress: [],
  completed: [],
  voided: []
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
