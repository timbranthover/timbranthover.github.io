const Header = ({ onNavigateToWork, currentView }) => {
  const isInMyWork = currentView === 'work';

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Forms Library</h1>
        <button
          onClick={isInMyWork ? undefined : onNavigateToWork}
          disabled={isInMyWork}
          className={`flex items-center gap-2 px-5 py-2 rounded transition-colors ${
            isInMyWork
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-60'
              : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          My Work
        </button>
      </div>
    </div>
  );
};