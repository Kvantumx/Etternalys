import type { ReactNode } from 'react';
import { useStore } from '../store/useStore';
import Navbar from './Navbar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { error, isLoading } = useStore();

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0a0a0f' }}>
      <Navbar />

      {/* Global loading bar */}
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 z-50 h-0.5 overflow-hidden">
          <div
            className="h-full bg-purple-500"
            style={{
              animation: 'loadingBar 1.5s ease-in-out infinite',
              background: 'linear-gradient(90deg, transparent, #7C3AED, #8B5CF6, #7C3AED, transparent)',
              backgroundSize: '200% 100%',
            }}
          />
        </div>
      )}

      {/* Global error banner */}
      {error && (
        <div className="animate-fade-in mx-4 mt-4 rounded-xl p-4 border border-red-800/50 bg-red-950/30 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-red-300 font-medium text-sm">Failed to fetch data</p>
            <p className="text-red-400/70 text-xs mt-0.5 truncate">{error}</p>
            <p className="text-gray-500 text-xs mt-1">Check your network connection or try refreshing.</p>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 max-w-screen-2xl mx-auto w-full px-4 sm:px-6 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-900 py-4 px-6 text-center text-xs text-gray-600">
        Etternalys — Etterna Online Progress Tracker
      </footer>

      <style>{`
        @keyframes loadingBar {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
    </div>
  );
}
