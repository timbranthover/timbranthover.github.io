/**
 * Global toast notification manager.
 *
 * Mount <Toast /> once (in app.js). Call showToast() from anywhere.
 *
 * showToast({ message, subtitle?, type?, duration? })
 *   type: 'success' | 'error' | 'info' (default) | 'party'
 *   duration: auto-dismiss ms (default 5000)
 */

const _toastSubscribers = [];

const showToast = (options) => {
  const normalized = typeof options === 'string' ? { message: options } : options;
  _toastSubscribers.forEach(fn => fn(normalized));
};

const Toast = () => {
  const [toast, setToast] = React.useState(null);

  React.useEffect(() => {
    const handler = (options) => setToast(options);
    _toastSubscribers.push(handler);
    return () => {
      const idx = _toastSubscribers.indexOf(handler);
      if (idx >= 0) _toastSubscribers.splice(idx, 1);
    };
  }, []);

  React.useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.duration || 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <div
      className={`mobile-toast fixed bottom-6 right-6 z-50 transition-all duration-300 ease-out ${
        toast ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
      }`}
    >
      {toast && (
        <div className={`mobile-toast-card rounded-lg shadow-lg border p-4 flex gap-3 min-w-[340px] ${
          toast.subtitle ? 'items-start' : 'items-center'
        } ${
          toast.type === 'success'
            ? 'bg-[#EBF5EF] border-[#469A6C]/30'
            : toast.type === 'error'
            ? 'bg-[#FDF2F3] border-[#AD3E4A]/30'
            : toast.type === 'party'
            ? 'bg-gradient-to-r from-[#F0EFF8] to-[#FDF2F3] border-[#8489BD]/30'
            : 'bg-white border-[#CCCABC]'
        }`}>
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            toast.type === 'success' ? 'bg-[#469A6C]/15'
            : toast.type === 'error' ? 'bg-[#AD3E4A]/15'
            : toast.type === 'party' ? 'bg-[#8489BD]/15'
            : 'bg-[#ECEBE4]'
          }`}>
            {toast.type === 'success' ? (
              <svg className="w-5 h-5 text-[#469A6C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : toast.type === 'error' ? (
              <svg className="w-5 h-5 text-[#AD3E4A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : toast.type === 'party' ? (
              <span className="text-lg">✨</span>
            ) : (
              <svg className="w-5 h-5 text-[#5A5D5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${
              toast.type === 'success' ? 'text-[#295B40]'
              : toast.type === 'error' ? 'text-[#620004]'
              : toast.type === 'party' ? 'text-[#545A9C]'
              : 'text-[#404040]'
            }`}>
              {toast.message}
            </p>
            {toast.subtitle && (
              <p className={`text-sm mt-0.5 ${
                toast.type === 'success' ? 'text-[#469A6C]'
                : toast.type === 'error' ? 'text-[#AD3E4A]'
                : toast.type === 'party' ? 'text-[#8489BD]'
                : 'text-[#8E8D83]'
              }`}>
                {toast.subtitle}
              </p>
            )}
          </div>
          <button
            onClick={() => setToast(null)}
            className="flex-shrink-0 p-1 hover:bg-black/5 rounded transition-colors"
          >
            <svg className="w-4 h-4 text-[#B8B3A2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};
