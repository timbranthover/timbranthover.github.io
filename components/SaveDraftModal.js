const SaveDraftModal = ({ isOpen, onClose, onSave, currentDraftName }) => {
  const [draftName, setDraftName] = React.useState(currentDraftName || '');

  React.useEffect(() => {
    if (isOpen) {
      setDraftName(currentDraftName || '');
    }
  }, [isOpen, currentDraftName]);

  const handleSave = () => {
    if (draftName.trim()) {
      onSave(draftName.trim());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Save Draft</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Draft Name
            </label>
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value.slice(0, 40))}
              onKeyPress={(e) => e.key === 'Enter' && handleSave()}
              placeholder="e.g., Tim's Q3 account transfer"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-500">
                max 40 characters
              </p>
              <span className={`text-xs ${draftName.length >= 40 ? 'text-amber-600' : 'text-gray-400'}`}>
                {draftName.length}/40
              </span>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!draftName.trim()}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                draftName.trim()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Save Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};