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

// ── Multi-account envelope ─────────────────────────────────────────────────────

/**
 * Builds a deduplicated signer array from multiple accounts.
 * Signers are deduped by name (case-insensitive). Each signer's email is
 * resolved from multiAccountData.signerDetails[name.toLowerCase()] or
 * defaults to the first email on the account. Signing order is applied if
 * multiAccountData.signerOrder is present.
 */
const buildMultiAccountSignerPayload = (multiAccountData) => {
  const seenNames = new Set();
  const signers = [];

  multiAccountData.accounts.forEach(({ account }) => {
    account.signers.forEach(signer => {
      const nameKey = signer.name.toLowerCase();
      if (seenNames.has(nameKey)) return;
      seenNames.add(nameKey);

      const detail = multiAccountData.signerDetails && multiAccountData.signerDetails[nameKey];
      const email = detail
        ? detail.email
        : (signer.emails ? signer.emails[0] : signer.email);

      signers.push({ email, name: signer.name, routingOrder: signers.length + 1, _nameKey: nameKey });
    });
  });

  if (multiAccountData.signerOrder && multiAccountData.signerOrder.length > 0) {
    const orderMap = {};
    multiAccountData.signerOrder.forEach((key, idx) => { orderMap[key] = idx + 1; });
    signers.forEach(s => {
      if (orderMap[s._nameKey] !== undefined) s.routingOrder = orderMap[s._nameKey];
    });
    signers.sort((a, b) => a.routingOrder - b.routingOrder);
  }

  return signers.map(({ _nameKey, ...rest }) => rest);
};

/**
 * Sends a single DocuSign envelope for a multi-account package.
 * Uses the template path with the first docuSignEnabled non-PDF form found.
 * Returns { success, envelopeId, error }.
 */
const sendMultiAccountEnvelope = async (multiAccountData) => {
  const allFormCodes = multiAccountData.accounts.flatMap(({ forms }) => forms);
  const docuSignForm = allFormCodes
    .map(code => FORMS_DATA.find(f => f.code === code))
    .find(f => f && f.docuSignEnabled && !f.pdfPath);

  if (!docuSignForm) {
    return { success: true, envelopeId: null };
  }

  const signers = buildMultiAccountSignerPayload(multiAccountData);
  const primaryAccountNumber = multiAccountData.accounts[0].account.accountNumber;

  return DocuSignService.sendEnvelope(
    signers,
    primaryAccountNumber,
    multiAccountData.customMessage || '',
    {
      templateId: docuSignForm.templateId || undefined,
      textTabs: undefined
    }
  );
};
