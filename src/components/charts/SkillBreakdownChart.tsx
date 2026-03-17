import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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
          .sort((a, b) => b.value - a.value)
          .map(entry => (
            <div key={entry.name} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-gray-300 text-xs">{entry.name}</span>
              </div>
              <span className="text-white text-xs font-bold tabular-nums">
                {entry.value.toFixed(2)}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

export default function SkillBreakdownChart() {
  const { snapshots, userData } = useStore();
  const [activeSkillsets, setActiveSkillsets] = useState<Set<SkillsetKey>>(new Set(ALL_SKILLSETS));
  const [timeRange, setTimeRange] = useState<TimeRange>('all');

  const chartData = useMemo(() => {
    const cutoff = timeRange === 'all' ? 0 : Date.now() - TIME_RANGE_MS[timeRange];
    const filtered = snapshots.filter(s => s.timestamp >= cutoff);

    // Downsample if too many points
    const maxPoints = 100;
    const step = filtered.length > maxPoints ? Math.ceil(filtered.length / maxPoints) : 1;

    return filtered
      .filter((_, i) => i % step === 0 || i === filtered.length - 1)
      .map(s => ({
        timestamp: s.timestamp,
        ...ALL_SKILLSETS.reduce((acc, key) => ({
          ...acc,
          [key]: parseFloat((s.userData.rating[key] || 0).toFixed(2)),
        }), {} as Record<SkillsetKey, number>),
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

  const toggleAll = () => {
    if (activeSkillsets.size === ALL_SKILLSETS.length) {
      setActiveSkillsets(new Set(['overall']));
    } else {
      setActiveSkillsets(new Set(ALL_SKILLSETS));
    }
  };

  if (!userData && snapshots.length === 0) {
    return (
      <div className="card h-80 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm">No skill data yet</p>
        <p className="text-gray-600 text-xs">Data will appear after first refresh</p>
      </div>
    );
  }

  return (
    <div className="card flex flex-col gap-4 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Skill Breakdown</h2>
          <p className="text-gray-500 text-xs mt-0.5">Rating over time per skillset</p>
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
        <button
          onClick={toggleAll}
          className={`badge transition-all duration-150 cursor-pointer select-none border ${
            activeSkillsets.size === ALL_SKILLSETS.length
              ? 'bg-gray-700 text-gray-300 border-gray-600'
              : 'bg-gray-800 text-gray-500 border-gray-700 hover:border-gray-600'
          }`}
        >
          All
        </button>
        {ALL_SKILLSETS.map(key => (
          <button
            key={key}
            onClick={() => toggleSkillset(key)}
            className={`badge transition-all duration-200 cursor-pointer select-none border`}
            style={{
              backgroundColor: activeSkillsets.has(key)
                ? `${SKILLSET_COLORS[key]}22`
                : 'transparent',
              borderColor: activeSkillsets.has(key)
                ? SKILLSET_COLORS[key]
                : '#3a3a4f',
              color: activeSkillsets.has(key) ? SKILLSET_COLORS[key] : '#5a5a7a',
              boxShadow: activeSkillsets.has(key)
                ? `0 0 8px ${SKILLSET_COLORS[key]}44`
                : 'none',
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
            {chartData.length === 0
              ? 'No snapshots in this time range'
              : 'Need at least 2 snapshots to show chart'}
          </p>
          {userData && chartData.length <= 1 && (
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {ALL_SKILLSETS.filter(k => activeSkillsets.has(k)).map(key => (
                <div key={key} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SKILLSET_COLORS[key] }} />
                  <span className="text-gray-400">{SKILLSET_LABELS[key]}</span>
                  <span className="text-white font-bold tabular-nums">
                    {(userData.rating[key] || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" strokeOpacity={0.5} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatDate}
                stroke="#3a3a4f"
                tick={{ fill: '#5a5a7a', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#3a3a4f"
                tick={{ fill: '#5a5a7a', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                domain={['auto', 'auto']}
                width={35}
                tickFormatter={v => v.toFixed(0)}
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
                  style={{ filter: `drop-shadow(0 0 4px ${SKILLSET_COLORS[key]}66)` }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Current values summary */}
      {userData && (
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-2 border-t border-gray-800">
          {ALL_SKILLSETS.map(key => (
            <div
              key={key}
              className={`text-center transition-opacity duration-200 ${activeSkillsets.has(key) ? 'opacity-100' : 'opacity-30'}`}
            >
              <div className="text-xs text-gray-500 truncate">{SKILLSET_LABELS[key]}</div>
              <div className="text-sm font-bold tabular-nums" style={{ color: SKILLSET_COLORS[key] }}>
                {(userData.rating[key] || 0).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
