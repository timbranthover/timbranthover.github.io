// DocuSign Service - Handles JWT authentication and envelope operations
const DocuSignService = {
  accessToken: null,
  tokenExpiry: null,

  // Helper to build API URL with proxy support
  _buildApiUrl(path, queryParams) {
    const fullPath = `/restapi/v2.1/accounts/${DOCUSIGN_CONFIG.accountId}${path}`;
    const search = queryParams ? `?${new URLSearchParams(queryParams)}` : '';
    return DOCUSIGN_CONFIG.proxyUrl
      ? `${DOCUSIGN_CONFIG.proxyUrl}${fullPath}${search}`
      : `https://demo.docusign.net${fullPath}${search}`;
  },

  // Generate JWT assertion for authentication
  generateJWTAssertion() {
    const now = Math.floor(Date.now() / 1000);

    const header = {
      typ: 'JWT',
      alg: 'RS256'
    };

    const payload = {
      iss: DOCUSIGN_CONFIG.integrationKey,
      sub: DOCUSIGN_CONFIG.userId,
      iat: now,
      exp: now + 3600, // 1 hour expiry
      aud: DOCUSIGN_CONFIG.oAuthBasePath,
      scope: DOCUSIGN_CONFIG.scopes.join(' ')
    };

    // Use jsrsasign library to sign JWT
    const sHeader = JSON.stringify(header);
    const sPayload = JSON.stringify(payload);

    // Sign with RS256 using the private key
    const jwt = KJUR.jws.JWS.sign('RS256', sHeader, sPayload, DOCUSIGN_CONFIG.rsaPrivateKey);

    return jwt;
  },

  // Get access token using JWT
  async getAccessToken() {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const assertion = this.generateJWTAssertion();

      // Use proxy if configured, otherwise direct (direct will fail with CORS in browser)
      const tokenUrl = DOCUSIGN_CONFIG.proxyUrl
        ? `${DOCUSIGN_CONFIG.proxyUrl}/oauth/token`
        : `https://${DOCUSIGN_CONFIG.oAuthBasePath}/oauth/token`;

      console.log('DocuSign: Requesting token from', tokenUrl);

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: assertion
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to get access token: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      // Set expiry to 5 minutes before actual expiry for safety
      this.tokenExpiry = Date.now() + ((data.expires_in - 300) * 1000);

      return this.accessToken;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  },

  // Send envelope using template
  // signers: array of { email, name, routingOrder }
  async sendEnvelope(signers, accountNumber, customMessage, options) {
    try {
      const accessToken = await this.getAccessToken();

      // Build template roles from signers array
      // For templates with single role, use first signer
      // For templates with multiple roles (Signer1, Signer2), map accordingly
      // Use form-specific templateId if provided, fall back to global config
      const templateId = (options && options.templateId) || DOCUSIGN_CONFIG.templateId;

      // Build textTabs: always include AccountNumber, append any form-specific tabs
      const textTabs = [{ tabLabel: 'AccountNumber', value: accountNumber }];
      if (options && options.textTabs) {
        options.textTabs.forEach(tab => textTabs.push(tab));
      }

      const templateRoles = signers.map((signer, index) => ({
        email: signer.email,
        name: signer.name,
        roleName: index === 0 ? 'Signer' : `Signer${index + 1}`,
        routingOrder: String(signer.routingOrder),
        tabs: index === 0 ? { textTabs: textTabs } : undefined
      }));

      const envelopeDefinition = {
        templateId: templateId,
        templateRoles: templateRoles,
        status: 'sent'
      };

      // Add custom message to email if provided
      if (customMessage) {
        envelopeDefinition.emailBlurb = customMessage;
      }

      console.log('DocuSign: Envelope definition:', JSON.stringify(envelopeDefinition, null, 2));

      const url = this._buildApiUrl('/envelopes');
      console.log('DocuSign: Sending envelope to', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(envelopeDefinition)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to send envelope: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        envelopeId: data.envelopeId,
        status: data.status
      };
    } catch (error) {
      console.error('Error sending envelope:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get envelope status and recipient details
  async getEnvelopeStatus(envelopeId) {
    try {
      const accessToken = await this.getAccessToken();

      // Fetch envelope and recipients in parallel
      const [envelopeRes, recipientsRes] = await Promise.all([
        fetch(this._buildApiUrl(`/envelopes/${envelopeId}`), {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }),
        fetch(this._buildApiUrl(`/envelopes/${envelopeId}/recipients`), {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
      ]);

      if (!envelopeRes.ok) {
        const err = await envelopeRes.json();
        throw new Error(err.message || envelopeRes.statusText);
      }

      const envelope = await envelopeRes.json();
      const recipients = recipientsRes.ok ? await recipientsRes.json() : null;

      return {
        success: true,
        envelopeId: envelope.envelopeId,
        status: envelope.status,
        statusChangedDateTime: envelope.statusChangedDateTime,
        sentDateTime: envelope.sentDateTime,
        deliveredDateTime: envelope.deliveredDateTime,
        completedDateTime: envelope.completedDateTime,
        voidedDateTime: envelope.voidedDateTime,
        voidedReason: envelope.voidedReason,
        recipients: recipients
      };
    } catch (error) {
      console.error('Error getting envelope status:', error);
      return { success: false, error: error.message };
    }
  },

  // Void an envelope
  async voidEnvelope(envelopeId, reason) {
    try {
      const accessToken = await this.getAccessToken();
      const url = this._buildApiUrl(`/envelopes/${envelopeId}`);

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'voided',
          voidedReason: reason || 'Voided by advisor'
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || response.statusText);
      }

      return { success: true };
    } catch (error) {
      console.error('Error voiding envelope:', error);
      return { success: false, error: error.message };
    }
  },

  // Resend envelope notifications
  async resendEnvelope(envelopeId) {
    try {
      const accessToken = await this.getAccessToken();
      const url = this._buildApiUrl(`/envelopes/${envelopeId}/recipients`, { resend_envelope: 'true' });

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || response.statusText);
      }

      return { success: true };
    } catch (error) {
      console.error('Error resending envelope:', error);
      return { success: false, error: error.message };
    }
  },

  // Download signed document as PDF
  async downloadDocument(envelopeId) {
    try {
      const accessToken = await this.getAccessToken();
      const url = this._buildApiUrl(`/envelopes/${envelopeId}/documents/combined`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to download: ${response.statusText}`);
      }

      const blob = await response.blob();

      // Trigger browser download
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `envelope-${envelopeId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      return { success: true };
    } catch (error) {
      console.error('Error downloading document:', error);
      return { success: false, error: error.message };
    }
  },

  // Send envelope with a pre-filled PDF document (bypasses template tab-label matching)
  // Fetches the source PDF, fills its AcroForm fields via pdf-lib, uploads the filled PDF
  // as a document to DocuSign, and attaches signature tabs at the specified position.
  async sendDocumentEnvelope(signers, pdfPath, pdfFieldMap, formData, customMessage, signaturePosition) {
    try {
      const accessToken = await this.getAccessToken();

      // 1. Fetch the source PDF
      const pdfResponse = await fetch(pdfPath);
      if (!pdfResponse.ok) throw new Error('Failed to fetch PDF: ' + pdfResponse.statusText);
      const pdfArrayBuffer = await pdfResponse.arrayBuffer();

      // 2. Load with pdf-lib and fill AcroForm fields
      const pdfDoc = await PDFLib.PDFDocument.load(pdfArrayBuffer);
      const form = pdfDoc.getForm();

      // Debug: log all field names so we can verify mapping
      console.log('DocuSign PDF: Available fields:', form.getFields().map(f => f.getName()));

      Object.entries(pdfFieldMap).forEach(([dataKey, fieldDef]) => {
        const value = formData[dataKey];
        if (value == null || value === '') return;
        try {
          switch (fieldDef.type) {
            case 'text':
              form.getTextField(fieldDef.name).setText(String(value));
              break;
            case 'checkbox':
              if (value === 'X' || value === 'true') {
                form.getCheckBox(fieldDef.name).check();
              } else {
                form.getCheckBox(fieldDef.name).uncheck();
              }
              break;
            case 'dropdown':
              form.getDropdown(fieldDef.name).select(String(value));
              break;
          }
          console.log('DocuSign PDF: Filled', fieldDef.name, '=', value);
        } catch (e) {
          console.warn('DocuSign PDF: Could not fill', fieldDef.name, '-', e.message);
        }
      });

      // Flatten form fields into page content so values render as static text
      form.flatten();

      // 3. Save filled PDF and base64 encode
      const filledPdfBytes = await pdfDoc.save();
      const base64PDF = this._uint8ArrayToBase64(filledPdfBytes);

      // 4. Build envelope definition with uploaded document + signature tabs
      const envelopeDefinition = {
        documents: [{
          documentBase64: base64PDF,
          documentId: '1',
          title: 'Generic Letter of Authorization'
        }],
        recipients: {
          signers: signers.map((signer, index) => ({
            email: signer.email,
            name: signer.name,
            recipientId: String(index + 1),
            routingOrder: String(signer.routingOrder),
            tabs: {
              signHereTabs: [{
                xPosition: String(signaturePosition.x),
                yPosition: String(signaturePosition.y),
                documentId: '1',
                pageNumber: String(signaturePosition.page)
              }]
            }
          }))
        },
        status: 'sent'
      };

      if (customMessage) {
        envelopeDefinition.emailBlurb = customMessage;
      }

      console.log('DocuSign PDF: Sending document envelope');

      // 5. POST to DocuSign
      const url = this._buildApiUrl('/envelopes');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(envelopeDefinition)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to send envelope: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      return { success: true, envelopeId: data.envelopeId, status: data.status };
    } catch (error) {
      console.error('Error sending document envelope:', error);
      return { success: false, error: error.message };
    }
  },

  // Helper: Uint8Array → base64 string (chunked to avoid stack overflow on large PDFs)
  _uint8ArrayToBase64(uint8Array) {
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode.apply(null, chunk);
    }
    return btoa(binary);
  }
};
