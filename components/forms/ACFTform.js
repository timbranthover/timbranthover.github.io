const ACFTForm = ({ formData, onUpdateField, selectedSigners, account }) => {
  return (
    <div className="mobile-form-shell bg-white shadow-lg max-w-3xl mx-auto p-8 space-y-6">
      <div className="border-b-2 border-[#404040] pb-4">
        <h2 className="text-xl font-bold">Electronic Funds Transfer (EFT) Authorization</h2>
        <p className="text-sm text-[#7A7870] mt-1">Link external bank account for deposits and withdrawals</p>
      </div>

      <div className="space-y-6">
        {/* Account Info */}
        <div>
          <h3 className="font-semibold text-[#404040] mb-3">Account Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#5A5D5C] mb-1">Account Number</label>
              <input 
                type="text" 
                value={account.accountNumber} 
                readOnly 
                className="w-full px-3 py-2 border border-[#CCCABC] rounded bg-[#F5F0E1] text-sm" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5A5D5C] mb-1">Account Holder(s)</label>
              <input 
                type="text" 
                value={account.accountName} 
                readOnly 
                className="w-full px-3 py-2 border border-[#CCCABC] rounded bg-[#F5F0E1] text-sm" 
              />
            </div>
          </div>
        </div>

        {/* Bank Account Info */}
        <div className="border-t pt-6">
          <h3 className="font-semibold text-[#404040] mb-3">Bank Account Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#5A5D5C] mb-1">Bank Name</label>
              <input 
                type="text"
                value={formData.bankName || ''}
                onChange={(e) => onUpdateField('bankName', e.target.value)}
                className="w-full px-3 py-2 border border-[#CCCABC] rounded text-sm" 
                placeholder="e.g., Chase Bank" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#5A5D5C] mb-1">Routing Number (ABA)</label>
                <input 
                  type="text"
                  value={formData.routingNumber || ''}
                  onChange={(e) => onUpdateField('routingNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-[#CCCABC] rounded text-sm font-mono" 
                  placeholder="9 digits" 
                  maxLength="9" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5A5D5C] mb-1">Account Number</label>
                <input 
                  type="text"
                  value={formData.accountNumber || ''}
                  onChange={(e) => onUpdateField('accountNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-[#CCCABC] rounded text-sm font-mono" 
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5A5D5C] mb-1">Account Type</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input 
                    type="radio" 
                    name="accountType"
                    value="checking"
                    checked={formData.accountType === 'checking'}
                    onChange={(e) => onUpdateField('accountType', e.target.value)}
                    className="w-4 h-4" 
                  />
                  <span className="text-sm">Checking</span>
                </label>
                <label className="flex items-center gap-2">
                  <input 
                    type="radio" 
                    name="accountType"
                    value="savings"
                    checked={formData.accountType === 'savings'}
                    onChange={(e) => onUpdateField('accountType', e.target.value)}
                    className="w-4 h-4" 
                  />
                  <span className="text-sm">Savings</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Initial Transfer */}
        <div className="border-t pt-6">
          <h3 className="font-semibold text-[#404040] mb-3">Initial Transfer (Optional)</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#5A5D5C] mb-1">Amount (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-[#8E8D83]">$</span>
                <input 
                  type="text"
                  value={formData.amount || ''}
                  onChange={(e) => onUpdateField('amount', e.target.value)}
                  className="w-full pl-7 pr-3 py-2 border border-[#CCCABC] rounded text-sm font-mono" 
                  placeholder="0.00" 
                />
              </div>
            </div>
          </div>
        </div>

       {/* Signature */}
        <div className="border-t-2 border-[#404040] pt-6">
          <h3 className="font-semibold text-[#404040] mb-4">Authorization Signature</h3>
          <p className="text-xs text-[#7A7870] mb-4">By signing, you authorize electronic fund transfers between the bank account specified above and your brokerage account.</p>
          
          <div className="mb-6">
            <label className="block text-xs font-medium text-[#5A5D5C] mb-2">
              Authorized Signer - Signature
            </label>
            <div className="relative">
              <input
                type="text"
                value={selectedSigners[0]?.name || ''}
                readOnly
                className="w-full px-4 py-3 border-2 border-[#CCCABC] rounded bg-white text-[#5A5D5C] font-medium"
                placeholder="[Signature field]"
              />
            </div>
            {selectedSigners[0] && (
              <div className="mt-2 text-xs text-[#7A7870]">
                Email: {selectedSigners[0].emails?.[0]} • Date: {new Date().toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Important Info */}
        <div className="bg-[#F5F0E1] p-4 rounded text-xs text-[#7A7870] space-y-2">
          <p className="font-medium">Important Information:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Bank account must be in the same name(s) as the brokerage account</li>
            <li>Initial verification may take 2-3 business days</li>
            <li>Micro-deposits may be sent for verification purposes</li>
            <li>Standard ACH processing times apply (3-5 business days)</li>
            <li>Please attach a voided check or bank letter for verification</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
