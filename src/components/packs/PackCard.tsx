import { useState } from 'react';
import { useStore } from '../../store/useStore';
import type { TrackedPack, PackSong } from '../../types';
import DivisionBadge from '../DivisionBadge';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getMsdColor(msd: number): string {
  if (msd < 10) return '#10B981';
  if (msd < 15) return '#3B82F6';
  if (msd < 20) return '#8B5CF6';
  if (msd < 25) return '#EC4899';
  if (msd < 30) return '#F59E0B';
  return '#EF4444';
}

function WifeBar({ score }: { score: number | undefined }) {
  if (score === undefined) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-gray-800">
          <div className="h-full w-0 rounded-full" />
        </div>
        <span className="text-gray-600 text-xs w-12 text-right tabular-nums">Unplayed</span>
      </div>
    );
  }

  const pct = Math.min(100, Math.max(0, score));
  const color = pct >= 99 ? '#7C3AED' : pct >= 96 ? '#10B981' : pct >= 93 ? '#3B82F6' : pct >= 85 ? '#F59E0B' : '#EF4444';

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-gray-800">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs w-14 text-right tabular-nums font-medium" style={{ color }}>
        {pct.toFixed(2)}%
      </span>
    </div>
  );
}

function SongRow({ song, index }: { song: PackSong; index: number }) {
  return (
    <div className={`px-3 py-2 rounded-lg ${index % 2 === 0 ? 'bg-gray-800/50' : ''}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-gray-500 text-xs w-6 text-right tabular-nums flex-shrink-0">
          {index + 1}.
        </span>
        <span className="text-gray-200 text-sm flex-1 truncate" title={song.name}>
          {song.name}
          {song.artist && (
            <span className="text-gray-500 ml-1 font-normal">{song.artist}</span>
          )}
        </span>
        {song.msd > 0 && (
          <span
            className="badge text-xs flex-shrink-0"
            style={{
              backgroundColor: `${getMsdColor(song.msd)}22`,
              color: getMsdColor(song.msd),
              border: `1px solid ${getMsdColor(song.msd)}44`,
            }}
          >
            {song.msd.toFixed(2)}
          </span>
        )}
      </div>
      <div className="pl-8">
        <WifeBar score={song.wifeScore} />
      </div>
    </div>
  );
}

interface PackCardProps {
  pack: TrackedPack;
}

export default function PackCard({ pack }: PackCardProps) {
  const { removePack, refreshPack } = useStore();
  const [expanded, setExpanded] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshPack(pack.id);
    } finally {
      setIsRefreshing(false);
    }
  };

  const totalSongs = pack.songs.length;
  const playedSongs = pack.songs.filter(s => s.wifeScore !== undefined).length;
  const avgWifeScore = totalSongs > 0
    ? pack.songs.reduce((sum, s) => sum + (s.wifeScore ?? 0), 0) / totalSongs
    : 0;
  const avgMsd = pack.songs.filter(s => s.msd > 0).length > 0
    ? pack.songs.filter(s => s.msd > 0).reduce((sum, s) => sum + s.msd, 0) / pack.songs.filter(s => s.msd > 0).length
    : 0;
  const progressPercent = avgWifeScore;

  const progressColor = progressPercent >= 99
    ? 'linear-gradient(90deg, #7C3AED, #8B5CF6)'
    : progressPercent >= 95
      ? 'linear-gradient(90deg, #10B981, #34D399)'
      : progressPercent >= 85
        ? 'linear-gradient(90deg, #3B82F6, #60A5FA)'
        : progressPercent >= 50
          ? 'linear-gradient(90deg, #F59E0B, #FBBF24)'
          : 'linear-gradient(90deg, #EF4444, #F87171)';

  return (
    <div className="card flex flex-col gap-0 overflow-hidden animate-slide-up p-0 relative">
      {/* Cover image background */}
      {pack.image && (
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${pack.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(18px) brightness(0.18)',
            transform: 'scale(1.1)',
          }}
        />
      )}
      <div className="relative z-10 flex flex-col gap-0">
      {/* Header */}
      <div className="p-4 border-b border-gray-800/60">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-base truncate" title={pack.name}>
              {pack.name}
            </h3>
            <p className="text-gray-500 text-xs mt-0.5">
              Pack #{pack.id} · Mis à jour {formatDate(pack.lastFetched)}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-1.5 rounded-md text-gray-600 hover:text-purple-400 hover:bg-purple-950/30 transition-all duration-200 disabled:opacity-40"
              title="Mettre à jour les scores"
            >
              <svg
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            {showRemoveConfirm ? (
              <div className="flex gap-1 animate-fade-in">
                <button
                  onClick={() => removePack(pack.id)}
                  className="text-xs px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded-md transition-colors"
                >
                  Remove
                </button>
                <button
                  onClick={() => setShowRemoveConfirm(false)}
                  className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowRemoveConfirm(true)}
                className="p-1.5 rounded-md text-gray-600 hover:text-red-400 hover:bg-red-950/30 transition-all duration-200"
                title="Remove pack"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-gray-500 text-xs">Overall Progress</span>
            <span className="text-white text-xs font-bold tabular-nums">
              {progressPercent.toFixed(2)}%
            </span>
          </div>
          <div className="progress-bar h-2.5">
            <div
              className="progress-fill"
              style={{
                width: `${progressPercent}%`,
                background: progressColor,
                boxShadow: progressPercent > 0 ? '0 0 6px rgba(124, 58, 237, 0.5)' : 'none',
              }}
            />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center">
            <div className="text-xs text-gray-600 mb-0.5">Songs</div>
            <div className="text-sm font-bold text-white">{totalSongs}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600 mb-0.5">Played</div>
            <div className="text-sm font-bold text-purple-400">
              {playedSongs}
              {totalSongs > 0 && (
                <span className="text-gray-600 font-normal text-xs"> /{totalSongs}</span>
              )}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600 mb-0.5">Avg Wife</div>
            <div className="text-sm font-bold" style={{
              color: progressPercent >= 96 ? '#10B981' : progressPercent >= 85 ? '#3B82F6' : '#F59E0B'
            }}>
              {avgWifeScore > 0 ? `${avgWifeScore.toFixed(2)}%` : '—'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600 mb-0.5">Avg MSD</div>
            <div className="text-sm font-bold" style={{ color: avgMsd > 0 ? getMsdColor(avgMsd) : '#5a5a7a' }}>
              {avgMsd > 0 ? avgMsd.toFixed(2) : '—'}
            </div>
          </div>
        </div>

        {/* Pack overall MSD + division */}
        {pack.packOverall > 0 && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-gray-600">Overall du pack :</span>
            <DivisionBadge rating={pack.packOverall} showRating size="sm" />
          </div>
        )}
      </div>

      {/* Expandable song list */}
      {totalSongs > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-between w-full px-4 py-2.5 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 transition-all duration-200"
          >
            <span className="font-medium">
              {expanded ? 'Hide' : 'Show'} {totalSongs} songs
            </span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expanded && (
            <div className="px-2 pb-3 max-h-96 overflow-y-auto animate-fade-in">
              {pack.songs.map((song, i) => (
                <SongRow key={song.id || i} song={song} index={i} />
              ))}
            </div>
          )}
        </>
      )}

      {totalSongs === 0 && (
        <div className="px-4 py-3 text-center text-gray-600 text-xs">
          No song data available for this pack
        </div>
      )}
      </div>
    </div>
  );
}
