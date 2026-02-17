const CLACRAForm = ({ formData, onUpdateField, selectedSigners, account }) => {
  return (
    <div className="mobile-form-shell bg-white shadow-lg max-w-3xl mx-auto p-8 space-y-6">
      <div className="border-b-2 border-[#404040] pb-4">
        <h2 className="text-xl font-bold">Advisory Relationship Application</h2>
        <p className="text-sm text-[#7A7870] mt-1">Establish an investment advisory relationship</p>
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

        {/* Advisory Details */}
        <div className="border-t pt-6">
          <h3 className="font-semibold text-[#404040] mb-3">Advisory Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#5A5D5C] mb-1">Advisor Name</label>
              <input
                type="text"
                value={formData.advisorName || ''}
                onChange={(e) => onUpdateField('advisorName', e.target.value)}
                className="w-full px-3 py-2 border border-[#CCCABC] rounded text-sm"
                placeholder="e.g., Jane Smith, CFP"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5A5D5C] mb-1">Agreement Type</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="agreementType"
                    value="discretionary"
                    checked={formData.agreementType === 'discretionary'}
                    onChange={(e) => onUpdateField('agreementType', e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Discretionary</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="agreementType"
                    value="non-discretionary"
                    checked={formData.agreementType === 'non-discretionary'}
                    onChange={(e) => onUpdateField('agreementType', e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Non-Discretionary</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5A5D5C] mb-1">Fee Schedule</label>
              <input
                type="text"
                value={formData.feeSchedule || ''}
                onChange={(e) => onUpdateField('feeSchedule', e.target.value)}
                className="w-full px-3 py-2 border border-[#CCCABC] rounded text-sm"
                placeholder="e.g., 1.00% annually"
              />
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="border-t-2 border-[#404040] pt-6">
          <h3 className="font-semibold text-[#404040] mb-4">Signatures</h3>
          <p className="text-xs text-[#7A7870] mb-4">By signing, you agree to the terms of the investment advisory relationship as outlined above.</p>

          {account.signers.map((signer, index) => {
            const matched = selectedSigners.find(s => s.id === signer.id);
            return (
              <div key={signer.id} className="mb-6">
                <label className="block text-xs font-medium text-[#5A5D5C] mb-2">
                  {signer.role} — Signature {index + 1}
                </label>
                <input
                  type="text"
                  value={matched ? matched.name : ''}
                  readOnly
                  className="w-full px-4 py-3 border-2 border-[#CCCABC] rounded bg-white text-[#5A5D5C] font-medium"
                  placeholder="[Signature field]"
                />
                {matched && (
                  <div className="mt-2 text-xs text-[#7A7870]">
                    Email: {matched.emails?.[0]} • Date: {new Date().toLocaleDateString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Important Info */}
        <div className="bg-[#F5F0E1] p-4 rounded text-xs text-[#7A7870] space-y-2">
          <p className="font-medium">Important Information:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>This agreement governs the advisory relationship between you and your advisor</li>
            <li>Fee rates and terms are subject to change with prior written notice</li>
            <li>You may terminate this agreement at any time with written notice</li>
            <li>Please review the advisor's Form ADV prior to signing</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
