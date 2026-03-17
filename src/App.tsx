import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useStore } from './store/useStore';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import PackTracker from './pages/PackTracker';
import Auth from './pages/Auth';

const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000;

function AppContent() {
  const { refresh, refreshLeaderboard, lastRefresh, user, username, authLoading, initAuth } = useStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize auth once on mount
  useEffect(() => {
    initAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial fetch when user + username become available
  useEffect(() => {
    if (!user || !username) return;
    const timeSinceLast = Date.now() - lastRefresh;
    if (timeSinceLast > 60_000) {
      refresh();
      refreshLeaderboard();
    }
  }, [user, username]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!user) return;
    intervalRef.current = setInterval(() => {
      refresh();
    }, AUTO_REFRESH_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, refresh]);

  // Loading spinner while checking auth session
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0f' }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center font-black text-white text-2xl animate-pulse"
            style={{ boxShadow: '0 0 24px rgba(124,58,237,0.6)' }}
          >
            E
          </div>
          <p className="text-gray-500 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  // Show auth page if not logged in
  if (!user) {
    return <Auth />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/packs" element={<PackTracker />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
