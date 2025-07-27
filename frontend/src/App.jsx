import React, { useState, useEffect } from 'react';

// --- Helper & Icon Components ---
const Spinner = ({ size = 'h-5 w-5' }) => <div className={`animate-spin rounded-full border-b-2 border-white ${size}`}></div>;
const ShieldCheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
const AlertTriangleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" /></svg>;
const XCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>;

// --- Main App Component ---
export default function App() {
  const [view, setView] = useState('login');
  const [token, setToken] = useState(null);
  const [websites, setWebsites] = useState([]);
  const [newUrl, setNewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scanningId, setScanningId] = useState(null);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');
  const [selectedSite, setSelectedSite] = useState(null); // For modal

  const API_URL = 'http://127.0.0.1:5000/api';

  useEffect(() => {
    if (token) {
      setView('dashboard');
      fetchWebsites();
    } else {
      setView('login');
    }
  }, [token]);

  const handleAuth = async (endpoint, credentials) => { /* ... (same as before) ... */ };
  const fetchWebsites = async () => { /* ... (same as before) ... */ };
  const addWebsite = async (e) => { /* ... (same as before) ... */ };
  const handleLogout = () => { /* ... (same as before) ... */ };

  const handleScan = async (websiteId) => {
    if (!token) return;
    setScanningId(websiteId);
    setError('');
    try {
      const response = await fetch(`${API_URL}/websites/${websiteId}/scan`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Scan failed.');
      
      // Update the specific website in the state
      setWebsites(prevSites => prevSites.map(site => site.id === websiteId ? data.website : site));
      setNotification(`Scan complete for ${data.website.url}`);
      setTimeout(() => setNotification(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setScanningId(null);
    }
  };

  const AuthForm = ({ isRegister = false }) => { /* ... (same as before) ... */ };

  const ScanResultModal = ({ site, onClose }) => {
    if (!site || !site.scan_results) return null;

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Present': return <ShieldCheckIcon />;
            case 'Missing': return <AlertTriangleIcon />;
            case 'Error': return <XCircleIcon />;
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold">Scan Results</h2>
                        <p className="text-sm text-gray-400 font-mono">{site.url}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
                </header>
                <div className="p-6 overflow-y-auto">
                    <ul className="space-y-3">
                        {site.scan_results.map((result, index) => (
                            <li key={index} className="bg-gray-700 p-3 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {getStatusIcon(result.status)}
                                        <span className="font-bold">{result.name}</span>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        result.status === 'Present' ? 'bg-green-500/20 text-green-300' :
                                        result.status === 'Missing' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'
                                    }`}>{result.status}</span>
                                </div>
                                <p className="mt-2 text-sm text-gray-400 pl-8">{result.value}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
  };

  const Dashboard = () => (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 p-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">Project Sentinel</h1>
        <button onClick={handleLogout} className="px-4 py-2 font-semibold text-white bg-red-600 rounded-md hover:bg-red-700">Logout</button>
      </header>
      <main className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
             {/* ... (Add Website Form - same as before) ... */}
          </div>

          <div className="mt-8">
            <h3 className="text-2xl font-bold mb-4">Monitored Websites</h3>
            <div className="bg-gray-800 rounded-xl shadow-lg">
              <ul className="divide-y divide-gray-700">
                {websites.length > 0 ? websites.map(site => (
                  <li key={site.id} className="p-4 flex justify-between items-center">
                    <div>
                        <span className="font-mono">{site.url}</span>
                        <p className="text-xs text-gray-400">
                            Status: <span className={site.status === 'Scanned' ? 'text-green-400' : 'text-gray-500'}>{site.status}</span>
                            {site.last_scanned && ` - Last Scanned: ${new Date(site.last_scanned).toLocaleString()}`}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {site.status === 'Scanned' && (
                            <button onClick={() => setSelectedSite(site)} className="px-3 py-1 text-sm font-semibold bg-gray-600 rounded-md hover:bg-gray-500">View Results</button>
                        )}
                        <button onClick={() => handleScan(site.id)} disabled={scanningId === site.id} className="px-4 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-500 w-24 flex items-center justify-center">
                          {scanningId === site.id ? <Spinner size="h-4 w-4" /> : 'Scan'}
                        </button>
                    </div>
                  </li>
                )) : (
                  <li className="p-4 text-center text-gray-400">No websites added yet.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </main>
      {notification && <div className="fixed bottom-5 right-5 bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl">{notification}</div>}
      {selectedSite && <ScanResultModal site={selectedSite} onClose={() => setSelectedSite(null)} />}
    </div>
  );

  if (view === 'dashboard') return <Dashboard />;
  if (view === 'register') return <AuthForm isRegister />;
  return <AuthForm />;
}

