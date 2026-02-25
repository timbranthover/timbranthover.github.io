/**
 * Envelope builder service.
 * Builds signer payloads and orchestrates DocuSign send calls.
 */

/**
 * Returns true if any form in the package has docuSignEnabled.
 */
const shouldUseDocuSign = (formCodes) => {
  return formCodes.some(code => {
    const form = FORMS_DATA.find(f => f.code === code);
    return form && form.docuSignEnabled;
  });
};

/**
 * Builds sorted signer array with routing order and resolved emails.
 */
const buildSignerPayload = (packageData) => {
  const signers = packageData.signers.map((signer) => {
    const routingOrder = packageData.sequentialSigning && packageData.signerOrder
      ? packageData.signerOrder.indexOf(signer.id) + 1
      : 1;

    const email = (packageData.signerDetails && packageData.signerDetails[signer.id])
      ? packageData.signerDetails[signer.id].email
      : (signer.emails ? signer.emails[0] : signer.email);

    return { email, name: signer.name, routingOrder };
  });

  if (packageData.sequentialSigning) {
    signers.sort((a, b) => a.routingOrder - b.routingOrder);
  }

  return signers;
};

/**
 * Sends an envelope via DocuSign (template or PDF-fill path).
 * Returns { success, envelopeId, error }.
 */
const sendDocuSignEnvelope = async (packageData, accountNumber) => {
  const signers = buildSignerPayload(packageData);

  // Find the first docuSignEnabled form for template/PDF config
  const docuSignForm = packageData.forms
    .map(code => FORMS_DATA.find(f => f.code === code))
    .find(f => f && f.docuSignEnabled);

  if (docuSignForm && docuSignForm.pdfPath) {
    // PDF fill path
    return DocuSignService.sendDocumentEnvelope(
      signers,
      docuSignForm.pdfPath,
      docuSignForm.pdfFieldMap,
      packageData.formData[docuSignForm.code],
      packageData.customMessage,
      docuSignForm.signaturePosition,
      accountNumber
    );
  }

  // Template path
  const textTabs = [];
  packageData.forms.forEach(formCode => {
    const form = FORMS_DATA.find(f => f.code === formCode);
    if (form && form.textTabFields && packageData.formData && packageData.formData[formCode]) {
      const formFields = packageData.formData[formCode];
      Object.entries(form.textTabFields).forEach(([dataKey, tabLabel]) => {
        if (formFields[dataKey] != null && formFields[dataKey] !== '') {
          textTabs.push({ tabLabel, value: String(formFields[dataKey]) });
        }
      });
    }
  });

  return DocuSignService.sendEnvelope(
    signers,
    accountNumber,
    packageData.customMessage,
    {
      templateId: docuSignForm && docuSignForm.templateId ? docuSignForm.templateId : undefined,
      textTabs: textTabs.length > 0 ? textTabs : undefined
    }
  );
};

// ── Multi-account envelope helpers ───────────────────────────────────────────

/**
 * Builds a deduplicated, sorted signer array from all accounts in a
 * multi-account envelope.  Signers are deduped by name (case-insensitive).
 * signerDetails map: { [signerId_accountNum]: { email } }
 */
const buildMultiAccountSignerPayload = (multiAccountData) => {
  const seen = new Map(); // name.toLowerCase() → signer entry
  let position = 1;

  for (const { account, forms } of multiAccountData.accounts) {
    for (const signer of (account.signers || [])) {
      const key = signer.name.toLowerCase();
      if (!seen.has(key)) {
        const detailKey = `${signer.id}_${account.accountNumber}`;
        const email = (
          multiAccountData.signerDetails &&
          multiAccountData.signerDetails[detailKey]
        )
          ? multiAccountData.signerDetails[detailKey].email
          : (signer.emails ? signer.emails[0] : signer.email);

        seen.set(key, { email, name: signer.name, routingOrder: position++ });
      }
    }
  }

  return [...seen.values()].sort((a, b) => a.routingOrder - b.routingOrder);
};

/**
 * Sends a single DocuSign envelope covering all accounts in multiAccountData.
 * Uses the template path (first docuSignEnabled non-PDF form found).
 * Returns { success, envelopeId, error }.
 */
const sendMultiAccountEnvelope = async (multiAccountData, customMessage) => {
  const allFormCodes = multiAccountData.accounts.flatMap(({ forms }) => forms);
  const primaryAccountNumber = multiAccountData.accounts[0]?.account?.accountNumber || 'MULTI';

  // Find first docuSignEnabled template form (skip PDF-fill forms for multi-account v1)
  const docuSignForm = allFormCodes
    .map(code => FORMS_DATA.find(f => f.code === code))
    .find(f => f && f.docuSignEnabled && !f.pdfPath);

  if (!docuSignForm) {
    return { success: false, error: 'No eSign-eligible template forms selected' };
  }

  const signers = buildMultiAccountSignerPayload(multiAccountData);
  const accountNumbers = multiAccountData.accounts.map(a => a.account.accountNumber).join(', ');

  return DocuSignService.sendEnvelope(
    signers,
    primaryAccountNumber,
    customMessage || '',
    {
      templateId: docuSignForm.templateId,
      emailSubject: `Multi-Account eSign: ${accountNumbers}`
    }
  );
};
