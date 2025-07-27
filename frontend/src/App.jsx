import React, { useState, useEffect, useRef } from 'react';

// ... (Icon and Spinner components are the same) ...

export default function App() {
  // ... (State variables are mostly the same) ...
  const [pollingTasks, setPollingTasks] = useState({}); // NEW: To track polling intervals
  const pollingIntervals = useRef({});

  const API_URL = 'http://127.0.0.1:5000/api';

  useEffect(() => {
    // Cleanup polling intervals on component unmount
    return () => {
      Object.values(pollingIntervals.current).forEach(clearInterval);
    };
  }, []);

  const handleScan = async (websiteId) => {
    // ... (This function now initiates polling) ...
    try {
      // ... (API call to start scan) ...
      const data = await response.json();
      // ... (Update local state) ...
      startPolling(data.task_id, websiteId);
    } catch (err) {
      // ... (Error handling) ...
    }
  };

  const startPolling = (taskId, websiteId) => {
    // Clear any existing interval for this website
    if (pollingIntervals.current[websiteId]) {
      clearInterval(pollingIntervals.current[websiteId]);
    }

    pollingIntervals.current[websiteId] = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/tasks/${taskId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const taskData = await res.json();

        if (taskData.state === 'SUCCESS' || taskData.state === 'FAILURE') {
          clearInterval(pollingIntervals.current[websiteId]);
          delete pollingIntervals.current[websiteId];
          fetchWebsites(); // Refetch all websites to get the final results
          setNotification(`Scan finished for website ID ${websiteId}.`);
          setTimeout(() => setNotification(''), 3000);
        } else if (taskData.state === 'PROGRESS') {
           // Optionally update UI with progress message
           console.log(`Scan for ${websiteId} is in progress: ${taskData.message}`);
        }
      } catch (pollErr) {
        console.error("Polling error:", pollErr);
        clearInterval(pollingIntervals.current[websiteId]);
        delete pollingIntervals.current[websiteId];
      }
    }, 5000); // Poll every 5 seconds
  };
  
  // ... (The rest of the component, including AuthForm and Dashboard) ...
  // The Dashboard component will need to be updated to re-introduce the
  // "View Results" button and the ScanResultModal from Phase 2.
  // It will now get its data from `site.scan_results` which is populated by the polling.
}

