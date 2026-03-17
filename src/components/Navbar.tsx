import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';

function formatLastRefresh(ts: number): string {
  if (!ts) return 'Never';
  const diffMs = Date.now() - ts;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr}h ago`;
}

export default function Navbar() {
  const { userData, isLoading, lastRefresh, refresh, username, setUsername, signOut } = useStore();
  const location = useLocation();
  const [editingUsername, setEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState(username);

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tempUsername.trim()) {
      await setUsername(tempUsername.trim());
      refresh();
    }
    setEditingUsername(false);
  };

  const navLinks = [
    { path: '/', label: 'Dashboard', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )},
    { path: '/packs', label: 'Pack Tracker', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    )},
  ];

  return (
    <header className="sticky top-0 z-50 bg-gray-950 border-b border-gray-800" style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(10,10,15,0.95)' }}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center font-black text-white text-lg group-hover:shadow-lg transition-all duration-200" style={{ boxShadow: '0 0 12px rgba(124,58,237,0.5)' }}>
                E
              </div>
              <span className="font-bold text-lg text-white hidden sm:block" style={{ letterSpacing: '-0.02em' }}>
                Etternalys
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    location.pathname === link.path
                      ? 'bg-purple-600/20 text-purple-400 border border-purple-600/30'
                      : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Last refresh + manual refresh */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
              <span>Updated {formatLastRefresh(lastRefresh)}</span>
              <button
                onClick={() => refresh()}
                disabled={isLoading}
                title="Refresh data"
                className="p-1.5 rounded-md hover:bg-gray-800 text-gray-500 hover:text-purple-400 transition-all duration-200 disabled:opacity-50"
              >
                <svg
                  className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            {/* Logout */}
            <button
              onClick={() => signOut()}
              className="p-1.5 rounded-md text-gray-600 hover:text-red-400 hover:bg-red-950/30 transition-all duration-200"
              title="Sign out"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>

            {/* User Avatar + Name */}
            <div className="flex items-center gap-2">
              {editingUsername ? (
                <form onSubmit={handleUsernameSubmit} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempUsername}
                    onChange={e => setTempUsername(e.target.value)}
                    className="input-dark text-sm w-36 h-8 py-1"
                    placeholder="Username..."
                    autoFocus
                    onBlur={() => {
                      setEditingUsername(false);
                      setTempUsername(username);
                    }}
                  />
                  <button type="submit" className="btn-primary text-xs px-2 py-1 h-8">OK</button>
                </form>
              ) : (
                <button
                  onClick={() => { setTempUsername(username); setEditingUsername(true); }}
                  className="flex items-center gap-2 hover:bg-gray-800 rounded-lg px-2 py-1.5 transition-all duration-200 group"
                  title="Click to change username"
                >
                  {userData?.avatar_url ? (
                    <img
                      src={userData.avatar_url}
                      alt={userData.username}
                      className="w-7 h-7 rounded-full border border-purple-600/50 object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-purple-600/30 border border-purple-600/50 flex items-center justify-center text-xs font-bold text-purple-400">
                      {username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-200 group-hover:text-white hidden sm:block">
                    {userData?.username || username}
                  </span>
                  <svg className="w-3 h-3 text-gray-500 group-hover:text-gray-300 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden flex gap-1 pb-2">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                location.pathname === link.path
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-600/30'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}

          <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
            <span>{formatLastRefresh(lastRefresh)}</span>
            <button
              onClick={() => refresh()}
              disabled={isLoading}
              className="p-1.5 rounded-md hover:bg-gray-800 text-gray-500 hover:text-purple-400 transition-all duration-200"
            >
              <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
