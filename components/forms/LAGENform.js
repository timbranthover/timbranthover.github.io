const LAGENForm = ({ formData, onUpdateField, selectedSigners, account }) => {
  return (
    <div className="bg-white shadow-lg max-w-3xl mx-auto p-8 space-y-6">
      <div className="border-b-2 border-gray-900 pb-4">
        <h2 className="text-xl font-bold">Generic Letter of Authorization</h2>
        <p className="text-sm text-gray-600 mt-1">Grant authorization to a designated party</p>
      </div>

      <div className="space-y-6">
        {/* Account Info */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Account Information</h3>
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Account Holder(s)</label>
              <input
                type="text"
                value={account.accountName}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Authorized Party */}
        <div className="border-t pt-6">
          <h3 className="font-semibold text-gray-900 mb-3">Authorized Party</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Authorized Person Name</label>
              <input
                type="text"
                value={formData.authorizedName || ''}
                onChange={(e) => onUpdateField('authorizedName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                placeholder="Full legal name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Relationship</label>
              <select
                value={formData.relationship || ''}
                onChange={(e) => onUpdateField('relationship', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white"
              >
                <option value="">Select...</option>
                <option value="Choice 1">Choice 1</option>
                <option value="Choice 2">Choice 2</option>
                <option value="Choice 3">Choice 3</option>
                <option value="Choice 4">Choice 4</option>
              </select>
            </div>
          </div>
        </div>

        {/* Authorization Scope */}
        <div className="border-t pt-6">
          <h3 className="font-semibold text-gray-900 mb-3">Authorization Scope</h3>
          <div className="space-y-3">
            {[
              { key: 'option1', label: 'Option 1' },
              { key: 'option2', label: 'Option 2' },
              { key: 'option3', label: 'Option 3' }
            ].map(opt => (
              <label key={opt.key} className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-colors ${
                formData[opt.key] === 'X'
                  ? 'bg-blue-50 border-blue-300'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input
                  type="checkbox"
                  checked={formData[opt.key] === 'X'}
                  onChange={() => onUpdateField(opt.key, formData[opt.key] === 'X' ? '' : 'X')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-900">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Dependent Information */}
        <div className="border-t pt-6">
          <h3 className="font-semibold text-gray-900 mb-3">Dependent Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Dependent Name</label>
              <input
                type="text"
                value={formData.dependentName || ''}
                onChange={(e) => onUpdateField('dependentName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Age</label>
              <input
                type="text"
                value={formData.dependentAge || ''}
                onChange={(e) => onUpdateField('dependentAge', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                placeholder="Age"
              />
            </div>
          </div>
        </div>

        {/* Signature */}
        <div className="border-t-2 border-gray-900 pt-6">
          <h3 className="font-semibold text-gray-900 mb-4">Account Holder Signature</h3>
          <p className="text-xs text-gray-600 mb-4">By signing, you authorize the person named above to act on your behalf as described in the scope section.</p>

          <div className="mb-6">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Authorized Signer — Signature
            </label>
            <input
              type="text"
              value={selectedSigners[0]?.name || ''}
              readOnly
              className="w-full px-4 py-3 border-2 border-gray-300 rounded bg-white text-gray-700 font-medium"
              placeholder="[Signature field]"
            />
            {selectedSigners[0] && (
              <div className="mt-2 text-xs text-gray-600">
                Email: {selectedSigners[0].emails?.[0]} • Date: {new Date().toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Important Info */}
        <div className="bg-gray-50 p-4 rounded text-xs text-gray-600 space-y-2">
          <p className="font-medium">Important Information:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>This authorization grants the named party limited access as specified</li>
            <li>You may revoke this authorization at any time with written notice</li>
            <li>The authorized party cannot transfer ownership or close the account</li>
            <li>All actions taken under this LOA remain the account holder's responsibility</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
