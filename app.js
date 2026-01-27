const App = () => {
  const [view, setView] = React.useState('landing');
  const [currentAccount, setCurrentAccount] = React.useState(null);
  const [selectedForms, setSelectedForms] = React.useState([]);
  const [draftData, setDraftData] = React.useState(null);

  const handleSearch = (accountNumber) => {
    setCurrentAccount(MOCK_ACCOUNT);
    setView('results');
  };

  const handleContinueToPackage = (forms) => {
    setSelectedForms(forms);
    setDraftData(null);
    setView('package');
  };

  const handleLoadDraft = (draftItem) => {
    setCurrentAccount(MOCK_ACCOUNT);
    setSelectedForms(draftItem.forms);
    setDraftData(draftItem.draftData ? { 'AC-TF': draftItem.draftData } : null);
    setView('package');
  };

  const handleBack = () => {
    if (view === 'package') {
      setView('results');
    } else if (view === 'results') {
      setView('landing');
      setCurrentAccount(null);
    } else if (view === 'work') {
      setView('landing');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigateToWork={() => setView('work')} />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {view === 'landing' && (
          <SearchView onSearch={handleSearch} />
        )}
        
        {view === 'results' && currentAccount && (
          <ResultsView 
            account={currentAccount}
            onBack={handleBack}
            onContinue={handleContinueToPackage}
          />
        )}
        
        {view === 'work' && (
          <MyWorkView 
            onBack={handleBack}
            onLoadDraft={handleLoadDraft}
          />
        )}
        
        {view === 'package' && currentAccount && (
          <PackageView
            account={currentAccount}
            selectedForms={selectedForms}
            onBack={handleBack}
            initialData={draftData}
          />
        )}
      </div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));