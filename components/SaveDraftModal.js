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
      <div className="bg-white max-w-md w-full mx-4" style={{ borderRadius: 'var(--app-radius)', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--app-gray-6)' }}>Save draft</h3>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--app-gray-5)' }}>
              Draft name
            </label>
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value.slice(0, 40))}
              onKeyPress={(e) => e.key === 'Enter' && handleSave()}
              placeholder="e.g., Tim's Q3 account transfer"
              className="w-full px-3 py-2 focus:outline-none"
              style={{ border: '1px solid var(--app-input-border)', borderRadius: 'var(--app-radius)' }}
              onFocus={(e) => { e.target.style.boxShadow = '0 0 0 2px rgba(138,0,10,0.18)'; }}
              onBlur={(e) => { e.target.style.boxShadow = 'none'; }}
              autoFocus
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs" style={{ color: 'var(--app-gray-3)' }}>
                Give this draft a memorable name
              </p>
              <span className="text-xs" style={{ color: draftName.length >= 40 ? 'var(--app-bronze-1)' : 'var(--app-gray-3)' }}>
                {draftName.length}/40
              </span>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-md transition-colors"
              style={{ color: 'var(--app-gray-5)', border: '1px solid var(--app-gray-1)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--app-pastel-1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!draftName.trim()}
              className="px-4 py-2 text-sm font-medium rounded-md transition-colors"
              style={{
                backgroundColor: draftName.trim() ? 'var(--app-gray-6)' : 'var(--app-pastel-1)',
                color: draftName.trim() ? 'white' : 'var(--app-gray-3)',
                cursor: draftName.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              Save draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
