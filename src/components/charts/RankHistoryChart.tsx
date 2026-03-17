import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useStore } from '../../store/useStore';
import { SKILLSET_COLORS, SKILLSET_LABELS, ALL_SKILLSETS, type SkillsetKey, type TimeRange } from '../../types';

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

const TIME_RANGE_MS: Record<TimeRange, number> = {
  '1d':  86400_000,
  '7d':  7 * 86400_000,
  '30d': 30 * 86400_000,
  '90d': 90 * 86400_000,
  'all': Infinity,
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: number;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 shadow-2xl min-w-[180px]">
      <p className="text-gray-400 text-xs mb-2 font-medium">
        {label ? `${formatDate(label)} ${formatTime(label)}` : ''}
      </p>
      <div className="space-y-1">
        {payload
          .sort((a, b) => a.value - b.value)
          .map(entry => (
            <div key={entry.name} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-gray-300 text-xs">{entry.name}</span>
              </div>
              <span className="text-white text-xs font-bold tabular-nums">
                #{entry.value.toLocaleString()}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

// Custom Y axis tick formatter — show rank with #
function formatRank(value: number): string {
  if (value >= 1000) return `#${(value / 1000).toFixed(0)}k`;
  return `#${value}`;
}

export default function RankHistoryChart() {
  const { snapshots, userRanks } = useStore();
  const [activeSkillsets, setActiveSkillsets] = useState<Set<SkillsetKey>>(new Set(['overall']));
  const [timeRange, setTimeRange] = useState<TimeRange>('all');

  const chartData = useMemo(() => {
    const cutoff = timeRange === 'all' ? 0 : Date.now() - TIME_RANGE_MS[timeRange];
    const filtered = snapshots.filter(s => s.timestamp >= cutoff && s.userRanks);

    const maxPoints = 100;
    const step = filtered.length > maxPoints ? Math.ceil(filtered.length / maxPoints) : 1;

    return filtered
      .filter((_, i) => i % step === 0 || i === filtered.length - 1)
      .map(s => ({
        timestamp: s.timestamp,
        ...ALL_SKILLSETS.reduce((acc, key) => ({
          ...acc,
          [key]: s.userRanks[key] || null,
        }), {} as Record<SkillsetKey, number | null>),
      }));
  }, [snapshots, timeRange]);

  const toggleSkillset = (key: SkillsetKey) => {
    setActiveSkillsets(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  if (!userRanks && snapshots.length === 0) {
    return (
      <div className="card h-80 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm">No rank data yet</p>
        <p className="text-gray-600 text-xs">Rank history will appear after first refresh</p>
      </div>
    );
  }

  // Determine Y domain — rank 1 at top (lower is better)
  const allRankValues = chartData
    .flatMap(d => ALL_SKILLSETS.filter(k => activeSkillsets.has(k)).map(k => d[k]))
    .filter((v): v is number => v !== null && v > 0);

  const minRank = allRankValues.length ? Math.max(1, Math.min(...allRankValues) - 10) : 1;
  const maxRank = allRankValues.length ? Math.min(...allRankValues) + 500 : 1000;

  return (
    <div className="card flex flex-col gap-4 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Rank History</h2>
          <p className="text-gray-500 text-xs mt-0.5">World rank over time (lower = better)</p>
        </div>

        {/* Time range selector */}
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
          {(['1d', '7d', '30d', '90d', 'all'] as TimeRange[]).map(r => (
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

      {/* Skillset toggles */}
      <div className="flex flex-wrap gap-1.5">
        {ALL_SKILLSETS.map(key => (
          <button
            key={key}
            onClick={() => toggleSkillset(key)}
            className="badge transition-all duration-200 cursor-pointer select-none border"
            style={{
              backgroundColor: activeSkillsets.has(key)
                ? `${SKILLSET_COLORS[key]}22`
                : 'transparent',
              borderColor: activeSkillsets.has(key)
                ? SKILLSET_COLORS[key]
                : '#3a3a4f',
              color: activeSkillsets.has(key) ? SKILLSET_COLORS[key] : '#5a5a7a',
            }}
          >
            {SKILLSET_LABELS[key]}
          </button>
        ))}
      </div>

      {/* Chart */}
      {chartData.length < 2 ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2">
          <p className="text-gray-500 text-sm">
            {chartData.length === 0 ? 'No data in this time range' : 'Need at least 2 snapshots to show chart'}
          </p>
          {userRanks && (
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {ALL_SKILLSETS.filter(k => activeSkillsets.has(k)).map(key => (
                <div key={key} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SKILLSET_COLORS[key] }} />
                  <span className="text-gray-400">{SKILLSET_LABELS[key]}</span>
                  <span className="text-white font-bold">
                    #{(userRanks[key] || 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" strokeOpacity={0.5} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatDate}
                stroke="#3a3a4f"
                tick={{ fill: '#5a5a7a', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              {/* Inverted Y axis — rank 1 should be at the top */}
              <YAxis
                stroke="#3a3a4f"
                tick={{ fill: '#5a5a7a', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                domain={[minRank, maxRank]}
                reversed={true}
                tickFormatter={formatRank}
                width={42}
              />
              <Tooltip content={<CustomTooltip />} />
              {ALL_SKILLSETS.filter(key => activeSkillsets.has(key)).map(key => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={SKILLSET_LABELS[key]}
                  stroke={SKILLSET_COLORS[key]}
                  strokeWidth={key === 'overall' ? 2.5 : 1.5}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  connectNulls={false}
                  style={{ filter: `drop-shadow(0 0 4px ${SKILLSET_COLORS[key]}66)` }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Current rank summary */}
      {userRanks && (
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-2 border-t border-gray-800">
          {ALL_SKILLSETS.map(key => (
            <div
              key={key}
              className={`text-center transition-opacity duration-200 ${activeSkillsets.has(key) ? 'opacity-100' : 'opacity-30'}`}
            >
              <div className="text-xs text-gray-500 truncate">{SKILLSET_LABELS[key]}</div>
              <div className="text-sm font-bold tabular-nums" style={{ color: SKILLSET_COLORS[key] }}>
                {userRanks[key] ? `#${userRanks[key].toLocaleString()}` : 'N/A'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
