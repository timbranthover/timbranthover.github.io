// DocuSign Service - Handles JWT authentication and envelope sending
const DocuSignService = {
  accessToken: null,
  tokenExpiry: null,

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
  async sendEnvelope(recipientEmail, recipientName, accountNumber) {
    try {
      const accessToken = await this.getAccessToken();

      const envelopeDefinition = {
        templateId: DOCUSIGN_CONFIG.templateId,
        templateRoles: [
          {
            email: recipientEmail,
            name: recipientName,
            roleName: 'Signer',
            tabs: {
              textTabs: [
                {
                  tabLabel: 'AccountNumber',
                  value: accountNumber
                }
              ]
            }
          }
        ],
        status: 'sent'
      };

      // Use proxy if configured, otherwise direct (direct will fail with CORS in browser)
      const envelopeUrl = DOCUSIGN_CONFIG.proxyUrl
        ? `${DOCUSIGN_CONFIG.proxyUrl}/restapi/v2.1/accounts/${DOCUSIGN_CONFIG.accountId}/envelopes`
        : `${DOCUSIGN_CONFIG.basePath}/v2.1/accounts/${DOCUSIGN_CONFIG.accountId}/envelopes`;

      console.log('DocuSign: Sending envelope to', envelopeUrl);

      const response = await fetch(envelopeUrl, {
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
  }
};
