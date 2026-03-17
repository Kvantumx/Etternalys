import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { SKILLSET_COLORS, SKILLSET_LABELS, ALL_SKILLSETS, type SkillsetKey, type TimeRange } from '../types';
import type { DataSnapshot } from '../types';

const TIME_RANGE_MS: Record<Exclude<TimeRange, 'all'>, number> = {
  '1d':  86400_000,
  '7d':  7 * 86400_000,
  '30d': 30 * 86400_000,
  '90d': 90 * 86400_000,
};

const TIME_LABELS: Record<Exclude<TimeRange, 'all'>, string> = {
  '1d':  '1 Day',
  '7d':  '7 Days',
  '30d': '30 Days',
  '90d': '90 Days',
};

function findClosestSnapshot(snapshots: DataSnapshot[], targetTime: number): DataSnapshot | null {
  if (!snapshots.length) return null;
  let closest: DataSnapshot | null = null;
  let minDiff = Infinity;
  for (const s of snapshots) {
    const diff = Math.abs(s.timestamp - targetTime);
    if (diff < minDiff) {
      minDiff = diff;
      closest = s;
    }
  }
  return closest;
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return <span className="text-gray-600 text-xs">N/A</span>;
  if (Math.abs(delta) < 0.001) {
    return <span className="text-gray-500 text-xs font-semibold">±0.00</span>;
  }
  const positive = delta > 0;
  return (
    <span className={`text-xs font-bold tabular-nums ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
      {positive ? '+' : ''}{delta.toFixed(2)}
    </span>
  );
}

export default function ImprovementTracker() {
  const { snapshots, userData } = useStore();
  const [timeRange, setTimeRange] = useState<Exclude<TimeRange, 'all'>>('7d');

  const improvements = useMemo(() => {
    if (!userData || !snapshots.length) return null;

    const now = Date.now();
    const targetTime = now - TIME_RANGE_MS[timeRange];
    const pastSnapshot = findClosestSnapshot(
      snapshots.filter(s => s.timestamp <= targetTime + TIME_RANGE_MS[timeRange] * 0.1),
      targetTime
    );

    if (!pastSnapshot) return null;

    return ALL_SKILLSETS.reduce((acc, key) => {
      const current = userData.rating[key] || 0;
      const past = pastSnapshot.userData.rating[key] || 0;
      acc[key] = current - past;
      return acc;
    }, {} as Record<SkillsetKey, number>);
  }, [snapshots, userData, timeRange]);

  const currentData = useMemo(() => {
    if (!userData) return null;
    return ALL_SKILLSETS.reduce((acc, key) => {
      acc[key] = userData.rating[key] || 0;
      return acc;
    }, {} as Record<SkillsetKey, number>);
  }, [userData]);

  const totalDelta = improvements
    ? Object.values(improvements).reduce((a, b) => a + b, 0)
    : null;

  return (
    <div className="card flex flex-col gap-4 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Improvement Tracker</h2>
          <p className="text-gray-500 text-xs mt-0.5">
            Rating changes over time
            {totalDelta !== null && (
              <span className={`ml-2 font-semibold ${totalDelta > 0 ? 'text-emerald-400' : totalDelta < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                ({totalDelta > 0 ? '+' : ''}{totalDelta.toFixed(2)} total)
              </span>
            )}
          </p>
        </div>

        {/* Time range selector */}
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
          {(['1d', '7d', '30d', '90d'] as Exclude<TimeRange, 'all'>[]).map(r => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all duration-150 ${
                timeRange === r
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {!userData ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton rounded-lg h-20" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ALL_SKILLSETS.map(key => {
              const delta = improvements ? improvements[key] : null;
              const current = currentData?.[key] ?? 0;
              const hasData = delta !== null;
              const isPositive = delta !== null && delta > 0;
              const isNegative = delta !== null && delta < 0;
              const isNeutral = delta !== null && Math.abs(delta) < 0.001;

              return (
                <div
                  key={key}
                  className="relative rounded-xl p-3 border transition-all duration-300 overflow-hidden"
                  style={{
                    backgroundColor: isPositive
                      ? 'rgba(16, 185, 129, 0.06)'
                      : isNegative
                        ? 'rgba(239, 68, 68, 0.06)'
                        : 'rgba(28, 28, 39, 0.8)',
                    borderColor: isPositive
                      ? 'rgba(16, 185, 129, 0.25)'
                      : isNegative
                        ? 'rgba(239, 68, 68, 0.25)'
                        : '#2a2a3a',
                  }}
                >
                  {/* Glow accent bar */}
                  <div
                    className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl"
                    style={{ backgroundColor: SKILLSET_COLORS[key], opacity: 0.7 }}
                  />

                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: SKILLSET_COLORS[key] }}
                      />
                      <span className="text-gray-400 text-xs font-medium truncate">
                        {SKILLSET_LABELS[key]}
                      </span>
                    </div>
                    {hasData && !isNeutral && (
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isPositive ? 'bg-emerald-500/20' : 'bg-red-500/20'
                        }`}
                      >
                        {isPositive ? (
                          <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-xl font-black tabular-nums" style={{ color: SKILLSET_COLORS[key] }}>
                      {current.toFixed(2)}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600 text-xs">{TIME_LABELS[timeRange]}:</span>
                      <DeltaBadge delta={delta} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {!improvements && (
            <div className="text-center py-2">
              <p className="text-gray-600 text-xs">
                No snapshot found from {TIME_LABELS[timeRange]} ago — keep the app running to build history
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
