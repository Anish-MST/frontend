import React, { useEffect } from 'react';
import Dashboard from './components/Dashboard';
import axios from 'axios';

// Define the API URL (Same pattern as your other components)
const API_URL = import.meta.env.MODE === 'production'
    ? 'https://backend-4kvw.onrender.com/api'
    : 'http://localhost:4000/api';

function App() {
  useEffect(() => {
    /**
     * 1. SILENT PING (Background)
     * This keeps Render/Heroku awake by hitting the API every 10 minutes.
     */
    const pingBackend = async () => {
      try {
        await axios.get(`${API_URL}/candidates`);
        console.log("Backend pinged successfully to stay awake.");
      } catch (err) {
        console.log("Keep-alive ping failed, but that's okay.");
      }
    };

    // Ping immediately on load and then every 10 minutes
    pingBackend();
    const pingInterval = setInterval(pingBackend, 10 * 60 * 1000);

    /**
     * 2. INACTIVITY RELOAD
     * If no movement/keyboard input is detected for 15 mins, reload the page.
     */
    let inactivityTimer;

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      
      // Set timer for 15 minutes (15 * 60 * 1000 ms)
      inactivityTimer = setTimeout(() => {
        console.log("Inactivity detected for 15 mins. Refreshing page...");
        window.location.reload();
      }, 15 * 60 * 1000);
    };

    // List of events that reset the inactivity clock
    const activityEvents = [
      'mousedown', 'mousemove', 'keypress', 
      'scroll', 'touchstart', 'click'
    ];

    // Add event listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, resetInactivityTimer);
    });

    // Initialize the timer
    resetInactivityTimer();

    // CLEANUP
    return () => {
      clearInterval(pingInterval);
      clearTimeout(inactivityTimer);
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, []);

  return (
    <div className="App">
      <Dashboard />
    </div>
  );
}

export default App;