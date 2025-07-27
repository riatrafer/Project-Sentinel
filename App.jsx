import React, from 'react';

// --- Helper Components ---

const Spinner = () => (
  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
);

// --- Main App Component ---

export default function App() {
  // Using a simple string to manage the current view.
  // In a larger app, we would use a routing library.
  const [view, setView] = React.useState('login'); // 'login', 'register', 'dashboard'
  const [token, setToken] = React.useState(null);
  const [websites, setWebsites] = React.useState([]);
  const [newUrl, setNewUrl] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [notification, setNotification] = React.useState('');
  
  const API_URL = 'http://127.0.0.1:5000/api'; // Backend URL

  // Effect to handle token changes and fetch initial data
  React.useEffect(() => {
    if (token) {
      setView('dashboard');
      fetchWebsites();
    } else {
      setView('login');
    }
  }, [token]);

  // --- API Functions ---

  const handleAuth = async (endpoint, credentials) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'An error occurred.');
      }
      setToken(data.token);
      setNotification(`Successfully ${endpoint === 'register' ? 'registered' : 'logged in'}!`);
      setTimeout(() => setNotification(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWebsites = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/websites`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch websites.');
      setWebsites(data.websites || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const addWebsite = async (e) => {
    e.preventDefault();
    if (!newUrl || !token) return;
    setIsLoading(true);
    setError('');
    try {
        const response = await fetch(`${API_URL}/websites`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ url: newUrl })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to add website.');
        setWebsites([...websites, data.website]);
        setNewUrl('');
        setNotification('Website added successfully!');
        setTimeout(() => setNotification(''), 3000);
    } catch (err) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setWebsites([]);
    setNotification('You have been logged out.');
    setTimeout(() => setNotification(''), 3000);
  };

  // --- Render Logic ---

  const AuthForm = ({ isRegister = false }) => {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');

    const handleSubmit = (e) => {
      e.preventDefault();
      const endpoint = isRegister ? 'register' : 'login';
      handleAuth(endpoint, { email, password });
    };

    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-xl shadow-lg">
          <h1 className="text-3xl font-bold text-center">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            <button type="submit" disabled={isLoading} className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-500 flex items-center justify-center">
              {isLoading ? <Spinner /> : (isRegister ? 'Register' : 'Login')}
            </button>
          </form>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <p className="text-center">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}
            <button onClick={() => setView(isRegister ? 'login' : 'register')} className="ml-2 font-semibold text-blue-400 hover:underline">
              {isRegister ? 'Login' : 'Register'}
            </button>
          </p>
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
            <h2 className="text-2xl font-bold mb-4">Monitor a New Website</h2>
            <form onSubmit={addWebsite} className="flex gap-4">
              <input type="url" value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://example.com" className="flex-grow px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              <button type="submit" disabled={isLoading} className="px-6 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-500 flex items-center justify-center">
                {isLoading ? <Spinner /> : 'Add'}
              </button>
            </form>
            {error && <p className="text-red-400 mt-2">{error}</p>}
          </div>

          <div className="mt-8">
            <h3 className="text-2xl font-bold mb-4">Monitored Websites</h3>
            <div className="bg-gray-800 rounded-xl shadow-lg">
              <ul className="divide-y divide-gray-700">
                {websites.length > 0 ? websites.map(site => (
                  <li key={site.id} className="p-4 flex justify-between items-center">
                    <span className="font-mono">{site.url}</span>
                    <span className="text-sm px-3 py-1 bg-gray-600 rounded-full">Not Scanned</span>
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

