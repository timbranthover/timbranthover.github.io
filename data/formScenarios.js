const FORM_SCENARIOS = Object.freeze([
  {
    id: 'move-money',
    title: 'Move money',
    subtitle: 'ACAT, ACH, wire, and recurring disbursement flows.',
    seedCategory: 'money-movement',
    seedQuery: 'wire ach',
    recommendedCodes: ['AC-TF', 'AC-FT', 'AC-WIRE-OUT']
  },
  {
    id: 'retirement',
    title: 'Retirement distributions',
    subtitle: 'IRA distributions, RMD elections, and rollover intake.',
    seedCategory: 'retirement',
    seedQuery: 'ira distribution rmd rollover',
    recommendedCodes: ['AC-DQ', 'AC-RMD', 'AC-401K-ROLL']
  },
  {
    id: 'beneficiary-estate',
    title: 'Beneficiary and estate',
    subtitle: 'TOD designations and inherited IRA beneficiary updates.',
    seedCategory: 'beneficiary',
    seedQuery: 'beneficiary tod estate',
    recommendedCodes: ['WP-MAINT-BA', 'AC-TO', 'AC-DBT']
  },
  {
    id: 'advisory',
    title: 'Advisory setup and updates',
    subtitle: 'Advisory agreements, managed programs, and billing changes.',
    seedCategory: 'advisory',
    seedQuery: 'advisory managed fee',
    recommendedCodes: ['CL-ACRA', 'AC-ACCESS-IST', 'AC-FEE-WAIVE']
  },
  {
    id: 'tax-compliance',
    title: 'Tax and compliance',
    subtitle: 'Withholding elections and tax certification workflows.',
    seedCategory: 'compliance',
    seedQuery: 'withholding w9 w8 fatca',
    recommendedCodes: ['CL-W9', 'CL-W8BEN', 'AC-FED-WH']
  },
  {
    id: 'special-authorization',
    title: 'Special authorization',
    subtitle: 'LOA and POA requests for exception-driven actions.',
    seedCategory: 'loa',
    seedQuery: 'loa authorization poa',
    recommendedCodes: ['LA-GEN', 'LA-STANDING', 'AC-POA']
  }
]);
