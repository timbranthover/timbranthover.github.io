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
