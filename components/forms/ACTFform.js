const ACTFForm = ({ formData, onUpdateField, selectedSigners, account }) => {
  const addSecurity = () => {
    const newSecurities = [...(formData.securities || []), { symbol: '', quantity: '', description: '' }];
    onUpdateField('securities', newSecurities);
  };

  const updateSecurity = (index, field, value) => {
    const newSecurities = [...(formData.securities || [])];
    newSecurities[index] = { ...newSecurities[index], [field]: value };
    onUpdateField('securities', newSecurities);
  };

  const removeSecurity = (index) => {
    const newSecurities = formData.securities.filter((_, i) => i !== index);
    onUpdateField('securities', newSecurities);
  };

  return (
    <div className="bg-white shadow-lg max-w-3xl mx-auto p-8 space-y-6">
      <div className="border-b-2 border-gray-900 pb-4">
        <h2 className="text-xl font-bold">ACATS Account Transfer Form</h2>
        <p className="text-sm text-gray-600 mt-1">Transfer assets from external financial institution</p>
      </div>

      <div className="space-y-6">
        {/* UBS Account Info */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">UBS Account Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Account Number</label>
              <input 
                type="text" 
                value={account.accountNumber} 
                readOnly 
                className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50 text-sm" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Account Type</label>
              <input 
                type="text" 
                value={account.accountType} 
                readOnly 
                className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50 text-sm" 
              />
            </div>
          </div>
        </div>

        {/* Transferring From */}
        <div className="border-t pt-6">
          <h3 className="font-semibold text-gray-900 mb-3">Transferring From (Previous Institution)</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Name of Firm/Institution</label>
              <input 
                type="text" 
                value={formData.transferringFirm || ''}
                onChange={(e) => onUpdateField('transferringFirm', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm" 
                placeholder="e.g., Fidelity Investments" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Account Number at Previous Firm</label>
                <input 
                  type="text"
                  value={formData.transferringAccount || ''}
                  onChange={(e) => onUpdateField('transferringAccount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">DTCC Number (if known)</label>
                <input 
                  type="text"
                  value={formData.dtccNumber || ''}
                  onChange={(e) => onUpdateField('dtccNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Transfer Type */}
        <div className="border-t pt-6">
          <h3 className="font-semibold text-gray-900 mb-3">Type of Transfer</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input 
                type="radio" 
                name="transferType" 
                value="full"
                checked={formData.transferType === 'full'}
                onChange={(e) => onUpdateField('transferType', e.target.value)}
                className="w-4 h-4" 
              />
              <span className="text-sm">Full Transfer - Transfer all assets</span>
            </label>
            <label className="flex items-center gap-2">
              <input 
                type="radio" 
                name="transferType"
                value="partial"
                checked={formData.transferType === 'partial'}
                onChange={(e) => onUpdateField('transferType', e.target.value)}
                className="w-4 h-4" 
              />
              <span className="text-sm">Partial Transfer - Specify assets below</span>
            </label>
          </div>
        </div>

        {/* Asset Handling */}
        <div className="border-t pt-6">
          <h3 className="font-semibold text-gray-900 mb-3">Asset Handling</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input 
                type="radio" 
                name="assetHandling"
                value="in-kind"
                checked={formData.assetHandling === 'in-kind'}
                onChange={(e) => onUpdateField('assetHandling', e.target.value)}
                className="w-4 h-4" 
              />
              <span className="text-sm">Transfer In-Kind (maintain positions)</span>
            </label>
            <label className="flex items-center gap-2">
              <input 
                type="radio" 
                name="assetHandling"
                value="liquidate"
                checked={formData.assetHandling === 'liquidate'}
                onChange={(e) => onUpdateField('assetHandling', e.target.value)}
                className="w-4 h-4" 
              />
              <span className="text-sm">Liquidate and transfer cash</span>
            </label>
          </div>
        </div>

        {/* Partial Transfer Details */}
        {formData.transferType === 'partial' && (
          <div className="border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Partial Transfer Details</h3>
            <div className="space-y-3">
              {(formData.securities || []).map((security, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={security.symbol}
                      onChange={(e) => updateSecurity(index, 'symbol', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded text-sm"
                      placeholder="Symbol"
                    />
                    <input
                      type="text"
                      value={security.quantity}
                      onChange={(e) => updateSecurity(index, 'quantity', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded text-sm"
                      placeholder="Quantity"
                    />
                    <input
                      type="text"
                      value={security.description}
                      onChange={(e) => updateSecurity(index, 'description', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded text-sm"
                      placeholder="Description"
                    />
                  </div>
                  <button
                    onClick={() => removeSecurity(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
              <button 
                onClick={addSecurity}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add security
              </button>
            </div>
          </div>
        )}

       {/* Signatures */}
        <div className="border-t-2 border-gray-900 pt-6">
          <h3 className="font-semibold text-gray-900 mb-4">Signatures Required</h3>
          <p className="text-xs text-gray-600 mb-4">All account holders must sign below. Electronic signatures will be captured via DocuSign.</p>
          
          {/* Signer 1 */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Account Holder 1 - Signature
            </label>
            <div className="relative">
              <input
                type="text"
                value={selectedSigners[0]?.name || ''}
                readOnly
                className="w-full px-4 py-3 border-2 border-gray-300 rounded bg-white text-gray-700 font-medium"
                placeholder="[Signature field]"
              />
            </div>
            {selectedSigners[0] && (
              <div className="mt-2 text-xs text-gray-600">
                Email: {selectedSigners[0].emails?.[0]} • Date: {new Date().toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Signer 2 */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Account Holder 2 - Signature
            </label>
            <div className="relative">
              <input
                type="text"
                value={selectedSigners[1]?.name || ''}
                readOnly
                className="w-full px-4 py-3 border-2 border-gray-300 rounded bg-white text-gray-700 font-medium"
                placeholder="[Signature field]"
              />
            </div>
            {selectedSigners[1] && (
              <div className="mt-2 text-xs text-gray-600">
                Email: {selectedSigners[1].emails?.[0]} • Date: {new Date().toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Important Info */}
        <div className="bg-gray-50 p-4 rounded text-xs text-gray-600 space-y-2">
          <p className="font-medium">Important Information:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Please attach a copy of your most recent account statement from the transferring firm</li>
            <li>Transfer typically completes within 5-7 business days</li>
            <li>Fractional shares will be liquidated by the delivering firm</li>
            <li>Outstanding fees may be deducted from your credit balance</li>
          </ul>
        </div>
      </div>
    </div>
  );
};