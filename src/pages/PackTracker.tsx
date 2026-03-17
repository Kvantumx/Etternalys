import { useState } from 'react';
import { useStore } from '../store/useStore';
import PackCard from '../components/packs/PackCard';

function extractPackId(input: string): number | null {
  // Handle full URL: https://etternaonline.com/packs/3284
  const urlMatch = input.match(/\/packs\/(\d+)/);
  if (urlMatch) return parseInt(urlMatch[1], 10);

  // Handle bare number: 3284
  const numMatch = input.trim().match(/^\d+$/);
  if (numMatch) return parseInt(numMatch[0], 10);

  return null;
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 animate-fade-in">
      <div className="w-20 h-20 rounded-2xl bg-gray-800 flex items-center justify-center border border-gray-700">
        <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <div className="text-center">
        <h3 className="text-white font-bold text-lg">No packs tracked yet</h3>
        <p className="text-gray-500 text-sm mt-1 max-w-xs">
          Add a pack by entering its URL or ID above to start tracking your progress
        </p>
      </div>
      <div className="bg-gray-800 rounded-xl p-4 max-w-sm w-full border border-gray-700">
        <p className="text-gray-500 text-xs mb-2 font-medium">Example inputs:</p>
        <div className="space-y-1">
          <code className="block text-purple-400 text-xs bg-gray-900 rounded px-2 py-1">
            https://etternaonline.com/packs/3284
          </code>
          <code className="block text-purple-400 text-xs bg-gray-900 rounded px-2 py-1">
            3284
          </code>
        </div>
      </div>
    </div>
  );
}

export default function PackTracker() {
  const { packs, addPack } = useStore();
  const [input, setInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  const handleAdd = async () => {
    setAddError(null);
    setAddSuccess(null);
    const trimmed = input.trim();
    if (!trimmed) return;

    const packId = extractPackId(trimmed);
    if (!packId) {
      setAddError('Invalid pack URL or ID. Use a URL like https://etternaonline.com/packs/3284 or just the number 3284');
      return;
    }

    if (packs.some(p => p.id === packId)) {
      setAddError(`Pack #${packId} is already tracked`);
      return;
    }

    setIsAdding(true);
    try {
      await addPack(packId);
      setAddSuccess(`Pack #${packId} added successfully`);
      setInput('');
      setTimeout(() => setAddSuccess(null), 3000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setAddError(msg);
    } finally {
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">Pack Tracker</h1>
        <p className="text-gray-500 text-sm mt-1">
          Track your progress on Etterna packs — {packs.length} pack{packs.length !== 1 ? 's' : ''} tracked
        </p>
      </div>

      {/* Add pack input */}
      <div className="card">
        <label className="block text-sm font-semibold text-gray-300 mb-3">
          Add Pack
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={input}
              onChange={e => { setInput(e.target.value); setAddError(null); }}
              onKeyDown={handleKeyDown}
              placeholder="https://etternaonline.com/packs/3284 or just the ID: 3284"
              className="input-dark w-full text-sm"
              disabled={isAdding}
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={isAdding || !input.trim()}
            className="btn-primary flex items-center gap-2 justify-center whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAdding ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Adding...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Pack
              </>
            )}
          </button>
        </div>

        {/* Status messages */}
        {addError && (
          <div className="mt-3 flex items-start gap-2 text-red-400 text-sm animate-fade-in bg-red-950/20 border border-red-800/30 rounded-lg px-3 py-2">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{addError}</span>
          </div>
        )}

        {addSuccess && (
          <div className="mt-3 flex items-center gap-2 text-emerald-400 text-sm animate-fade-in bg-emerald-950/20 border border-emerald-800/30 rounded-lg px-3 py-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{addSuccess}</span>
          </div>
        )}

        {/* Info note */}
        <p className="text-gray-600 text-xs mt-3">
          Note: Pack song data availability depends on the Etterna Online API. Pack song lists may be empty if the API doesn&apos;t expose them.
        </p>
      </div>

      {/* Pack grid or empty state */}
      {packs.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...packs].reverse().map(pack => (
            <PackCard key={pack.id} pack={pack} />
          ))}
        </div>
      )}
    </div>
  );
}
