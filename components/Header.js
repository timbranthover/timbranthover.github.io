const Header = ({ onNavigateToWork, onNavigateToAdmin = () => {}, currentView, isAdmin = false }) => {
  const isInMyWork = currentView === 'work';
  const isInAdmin = currentView === 'admin';

  return (
    <div className="mobile-app-header" style={{ backgroundColor: 'var(--ubs-gray-6)' }}>
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="mobile-header-brand flex items-center gap-3">
          <h1 className="text-lg font-semibold text-white tracking-wide">Forms library</h1>
          {isAdmin && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-white/20 bg-white/10 text-white/90 text-xs font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-[#469A6C]" />
              Admin
            </span>
          )}
        </div>
        <div className="mobile-header-actions flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={isInAdmin ? undefined : onNavigateToAdmin}
              disabled={isInAdmin}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isInAdmin
                  ? 'bg-white/10 text-white/40 cursor-not-allowed'
                  : 'bg-white/10 text-white hover:bg-white/20 cursor-pointer'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l.7 2.154a1 1 0 00.95.69h2.264c.969 0 1.371 1.24.588 1.81l-1.831 1.33a1 1 0 00-.364 1.118l.7 2.154c.3.921-.755 1.688-1.54 1.118l-1.831-1.33a1 1 0 00-1.176 0l-1.831 1.33c-.784.57-1.838-.197-1.539-1.118l.699-2.154a1 1 0 00-.364-1.118L6.547 7.58c-.783-.57-.38-1.81.588-1.81h2.264a1 1 0 00.95-.69l.7-2.154z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 20h14M8 20v-4a4 4 0 018 0v4" />
              </svg>
              Admin
            </button>
          )}
          <button
            onClick={isInMyWork ? undefined : onNavigateToWork}
            disabled={isInMyWork}
            className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-medium transition-colors ${
              isInMyWork
                ? 'bg-white/10 text-white/40 cursor-not-allowed'
                : 'bg-white text-[var(--ubs-gray-6)] hover:bg-white/90 cursor-pointer'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            My work
          </button>
        </div>
      </div>
      <div style={{ height: '2px', background: 'var(--ubs-bordeaux-1)' }}></div>
    </div>
  );
};
