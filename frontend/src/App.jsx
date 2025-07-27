import React, { useState, useEffect } from 'react';

// --- Helper & Icon Components ---
const Spinner = ({ size = 'h-5 w-5' }) => <div className={`animate-spin rounded-full border-b-2 border-white ${size}`}></div>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" /></svg>;
// Other icons from before can be kept or removed as needed

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

  const API_URL = 'http://127.0.0.1:5000/api';

  useEffect(() => { /* ... (same as before) ... */ }, [token]);
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
      if (!response.ok) throw new Error(data.message || 'Failed to start scan.');
      
      // Update the site's status to 'Pending'
      setWebsites(prevSites => prevSites.map(site => site.id === websiteId ? data.website : site));
      setNotification(`Scan started for ${data.website.url}`);
      setTimeout(() => setNotification(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      // Note: We don't stop the spinner here because the job is running in the background.
      // In a more advanced version, we'd use polling or websockets to get the final result.
      setScanningId(null); 
    }
  };

  const AuthForm = ({ isRegister = false }) => { /* ... (same as before) ... */ };

  const getStatusPill = (status) => {
    switch (status) {
        case 'Scanned':
            return <span className="text-sm px-3 py-1 bg-green-600/50 text-green-300 rounded-full">Scanned</span>;
        case 'Pending':
            return <span className="text-sm px-3 py-1 bg-blue-600/50 text-blue-300 rounded-full flex items-center gap-2"><ClockIcon /> Pending</span>;
        default:
            return <span className="text-sm px-3 py-1 bg-gray-600/50 text-gray-300 rounded-full">Not Scanned</span>;
    }
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
                    <div className="flex items-center gap-4">
                        {getStatusPill(site.status)}
                        <span className="font-mono">{site.url}</span>
                    </div>
                    <button onClick={() => handleScan(site.id)} disabled={scanningId === site.id || site.status === 'Pending'} className="px-4 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed w-28 flex items-center justify-center">
                      {scanningId === site.id ? <Spinner size="h-4 w-4" /> : 'Start Scan'}
                    </button>
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
    </div>
  );

  if (view === 'dashboard') return <Dashboard />;
  if (view === 'register') return <AuthForm isRegister />;
  return <AuthForm />;
}

