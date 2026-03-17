import { useState } from 'react';
import { useStore } from '../store/useStore';

export default function Auth() {
  const { signIn, signUp } = useStore();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ettUsername, setEttUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        if (!ettUsername.trim()) {
          setError('Please enter your Etterna Online username.');
          setLoading(false);
          return;
        }
        await signUp(email, password, ettUsername.trim());
        setInfo('Account created! Check your email to confirm your address, then log in.');
        setMode('login');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#0a0a0f' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div
            className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center font-black text-white text-xl"
            style={{ boxShadow: '0 0 20px rgba(124,58,237,0.6)' }}
          >
            E
          </div>
          <span className="font-bold text-2xl text-white" style={{ letterSpacing: '-0.02em' }}>
            Etternalys
          </span>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-bold text-white mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create an account'}
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            {mode === 'login'
              ? 'Sign in to access your Etterna tracker.'
              : 'Track your Etterna Online progress.'}
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 text-sm">
              {error}
            </div>
          )}
          {info && (
            <div className="mb-4 p-3 rounded-lg bg-purple-950/40 border border-purple-800/50 text-purple-300 text-sm">
              {info}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-dark w-full"
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-dark w-full"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Etterna Online username</label>
                <input
                  type="text"
                  value={ettUsername}
                  onChange={e => setEttUsername(e.target.value)}
                  className="input-dark w-full"
                  placeholder="KinguPenguin"
                  required
                />
                <p className="text-xs text-gray-600 mt-1">Your username on etternaonline.com</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {mode === 'login' ? 'Signing in…' : 'Creating account…'}
                </span>
              ) : (
                mode === 'login' ? 'Sign in' : 'Create account'
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-gray-800 text-center">
            <span className="text-gray-500 text-sm">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            </span>
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setInfo(''); }}
              className="ml-2 text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
