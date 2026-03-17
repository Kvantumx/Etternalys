import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useStore } from '../store/useStore';
import { SKILLSET_COLORS } from '../types';

const BASE = 'http://localhost:3001/api';

function getCountryFlag(code: string): string {
  if (!code || code.length !== 2) return '';
  try {
    const codePoints = code.toUpperCase().split('').map(c => 0x1F1E6 + c.charCodeAt(0) - 65);
    return String.fromCodePoint(...codePoints);
  } catch {
    return '';
  }
}

interface RankEntry {
  rank: number;
  username: string;
  overall: string | number;
  country?: string;
  avatar_thumb?: string;
}

interface RankData {
  entries: RankEntry[];
  total: number;
}

export default function LeaderboardGoal() {
  const { userData } = useStore();
  const [targetRank, setTargetRank] = useState<string>('1000');
  const [rankData, setRankData] = useState<RankData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchRankData = async (rank: number) => {
    if (isNaN(rank) || rank < 1) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`${BASE}/leaderboard/at/${rank}`);
      setRankData({ entries: data.data || [], total: data.total || 0 });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce input to avoid hammering API on every keystroke
  useEffect(() => {
    const rank = parseInt(targetRank, 10);
    if (isNaN(rank) || rank < 1) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchRankData(rank), 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [targetRank]);

  const rank = parseInt(targetRank, 10);
  const currentRating = userData ? (userData.rating.overall || userData.player_rating) : 0;
  const currentRank = userData?.rank || null;

  // Find the entry at the exact target rank from fetched data
  const targetEntry = rankData?.entries.find(e => e.rank === rank)
    ?? rankData?.entries[Math.floor(rankData.entries.length / 2)];

  const targetRating = targetEntry ? parseFloat(String(targetEntry.overall)) : null;
  const pointsNeeded = targetRating !== null ? targetRating - currentRating : null;
  const progressPercent = targetRating && targetRating > 0
    ? Math.min(100, (currentRating / targetRating) * 100)
    : 0;
  const alreadyAchieved = pointsNeeded !== null && pointsNeeded <= 0;

  // Nearby entries sorted by rank
  const nearbyEntries = rankData?.entries
    .slice()
    .sort((a, b) => a.rank - b.rank) ?? [];

  return (
    <div className="card flex flex-col gap-4 animate-fade-in">
      <div>
        <h2 className="text-lg font-bold text-white">Leaderboard Goal</h2>
        <p className="text-gray-500 text-xs mt-0.5">
          {rankData?.total
            ? `${rankData.total.toLocaleString()} joueurs classés`
            : 'Entrez un rang cible'}
        </p>
      </div>

      {/* Target rank input */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Rang cible</label>
          <input
            type="number"
            min={1}
            max={99999}
            value={targetRank}
            onChange={e => setTargetRank(e.target.value)}
            className="input-dark w-full text-sm"
            placeholder="ex: 6000"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={() => fetchRankData(rank)}
            disabled={isLoading}
            className="btn-secondary text-sm h-9 px-3"
            title="Rafraîchir"
          >
            <svg
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-2">
          <div className="skeleton rounded-lg h-16" />
          <div className="skeleton rounded-lg h-3 w-full" />
          <div className="skeleton rounded-lg h-12" />
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="text-red-400 text-sm bg-red-950/20 border border-red-800/30 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* No user data */}
      {!userData && !isLoading && (
        <div className="text-center py-4 text-gray-600 text-sm">Chargement des données utilisateur...</div>
      )}

      {/* Results */}
      {!isLoading && !error && userData && targetRating !== null && (
        <>
          {/* Status cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800 rounded-xl p-3 border border-gray-700">
              <div className="text-gray-500 text-xs mb-1">Rang actuel</div>
              <div className="text-2xl font-black" style={{ color: SKILLSET_COLORS.overall }}>
                {currentRank ? `#${currentRank.toLocaleString()}` : 'N/A'}
              </div>
              <div className="text-gray-400 text-xs tabular-nums mt-0.5">
                {currentRating.toFixed(2)} pts
              </div>
            </div>
            <div className="bg-gray-800 rounded-xl p-3 border border-gray-700">
              <div className="text-gray-500 text-xs mb-1">Rang cible</div>
              <div className="text-2xl font-black text-white">
                #{rank.toLocaleString()}
              </div>
              <div className="text-gray-400 text-xs tabular-nums mt-0.5">
                {targetRating.toFixed(2)} pts requis
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-gray-500 text-xs">Progression vers l'objectif</span>
              <span className="text-gray-300 text-xs font-bold tabular-nums">
                {progressPercent.toFixed(1)}%
              </span>
            </div>
            <div className="progress-bar h-3">
              <div
                className="progress-fill"
                style={{
                  width: `${progressPercent}%`,
                  background: alreadyAchieved
                    ? 'linear-gradient(90deg, #10B981, #34D399)'
                    : 'linear-gradient(90deg, #7C3AED, #8B5CF6)',
                  boxShadow: alreadyAchieved
                    ? '0 0 8px rgba(16,185,129,0.5)'
                    : '0 0 8px rgba(124,58,237,0.6)',
                }}
              />
            </div>
          </div>

          {/* Points delta */}
          <div className={`rounded-xl p-3 border ${
            alreadyAchieved
              ? 'bg-emerald-950/30 border-emerald-800/40'
              : 'bg-purple-950/20 border-purple-800/30'
          }`}>
            {alreadyAchieved ? (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-emerald-300 font-semibold text-sm">Objectif atteint !</p>
                  <p className="text-emerald-400/70 text-xs">
                    {Math.abs(pointsNeeded!).toFixed(2)} pts au-dessus du rang cible
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <div>
                  <p className="text-purple-200 font-semibold text-sm">
                    +{pointsNeeded!.toFixed(2)} pts nécessaires
                  </p>
                  <p className="text-purple-400/70 text-xs">
                    {currentRating.toFixed(2)} → {targetRating.toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Nearby players */}
          {nearbyEntries.length > 0 && (
            <div>
              <p className="text-gray-500 text-xs mb-2">Joueurs autour du rang #{rank.toLocaleString()}</p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {nearbyEntries.map(player => {
                  const isTarget = player.rank === rank;
                  const isCurrentUser = player.username.toLowerCase() === userData.username.toLowerCase();
                  return (
                    <div
                      key={`${player.rank}-${player.username}`}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm transition-all ${
                        isCurrentUser
                          ? 'bg-purple-600/20 border border-purple-600/30'
                          : isTarget
                            ? 'bg-gray-800 border border-gray-700'
                            : 'hover:bg-gray-800/50'
                      }`}
                    >
                      <span className={`text-xs font-bold tabular-nums w-12 flex-shrink-0 ${
                        isTarget ? 'text-white' : 'text-gray-500'
                      }`}>
                        #{player.rank.toLocaleString()}
                      </span>
                      <span className="text-base">
                        {getCountryFlag(player.country || '')}
                      </span>
                      <span className={`flex-1 truncate font-medium ${
                        isCurrentUser ? 'text-purple-300' : 'text-gray-300'
                      }`}>
                        {player.username}
                        {isCurrentUser && <span className="ml-1 text-purple-500 text-xs">(toi)</span>}
                      </span>
                      <span className="text-gray-400 text-xs font-bold tabular-nums flex-shrink-0">
                        {parseFloat(String(player.overall)).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
