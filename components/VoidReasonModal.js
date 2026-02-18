const VoidReasonModal = ({ isOpen, onClose, onConfirm, envelopeName }) => {
  const [reason, setReason] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      setReason('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason.trim());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white max-w-md w-full mx-4" style={{ borderRadius: 'var(--app-radius)', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#FDF2F3] flex items-center justify-center">
              <svg className="w-5 h-5 text-[#AD3E4A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--app-gray-6)' }}>Void envelope</h3>
              {envelopeName && (
                <p className="text-sm" style={{ color: 'var(--app-gray-3)' }}>{envelopeName}</p>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--app-gray-5)' }}>
              Reason for voiding
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, 200))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleConfirm();
                }
              }}
              placeholder="e.g., Incorrect signer information"
              rows={3}
              className="w-full px-3 py-2 resize-none focus:outline-none"
              style={{ border: '1px solid var(--app-input-border)', borderRadius: 'var(--app-radius)' }}
              onFocus={(e) => { e.target.style.boxShadow = '0 0 0 2px rgba(138,0,10,0.18)'; }}
              onBlur={(e) => { e.target.style.boxShadow = 'none'; }}
              autoFocus
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs" style={{ color: 'var(--app-gray-3)' }}>
                This reason will be recorded on the voided envelope
              </p>
              <span className="text-xs" style={{ color: reason.length >= 200 ? 'var(--app-bronze-1)' : 'var(--app-gray-3)' }}>
                {reason.length}/200
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
              onClick={handleConfirm}
              disabled={!reason.trim()}
              className="px-4 py-2 text-sm font-medium rounded-md transition-colors"
              style={{
                backgroundColor: reason.trim() ? '#AD3E4A' : 'var(--app-pastel-1)',
                color: reason.trim() ? 'white' : 'var(--app-gray-3)',
                cursor: reason.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              Void envelope
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
