import { useStore } from '../store/useStore';
import SkillBreakdownChart from '../components/charts/SkillBreakdownChart';
import RankHistoryChart from '../components/charts/RankHistoryChart';
import ImprovementTracker from '../components/ImprovementTracker';
import LeaderboardGoal from '../components/LeaderboardGoal';
import DivisionBadge from '../components/DivisionBadge';
import { SKILLSET_COLORS, SKILLSET_LABELS, ALL_SKILLSETS } from '../types';
import { getDivision } from '../utils/divisions';

function getCountryFlag(code: string): string {
  if (!code || code.length !== 2) return '';
  try {
    const codePoints = code.toUpperCase().split('').map(c => 0x1F1E6 + c.charCodeAt(0) - 65);
    return String.fromCodePoint(...codePoints);
  } catch {
    return '';
  }
}

function SkeletonCard() {
  return (
    <div className="card">
      <div className="flex items-center gap-4">
        <div className="skeleton w-16 h-16 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-5 w-32 rounded" />
          <div className="skeleton h-3 w-24 rounded" />
          <div className="skeleton h-3 w-20 rounded" />
        </div>
        <div className="text-right space-y-2">
          <div className="skeleton h-8 w-20 rounded" />
          <div className="skeleton h-5 w-24 rounded" />
        </div>
      </div>
    </div>
  );
}

function UserProfileCard() {
  const { userData, userRanks, isLoading } = useStore();

  if (isLoading && !userData) return <SkeletonCard />;

  if (!userData) {
    return (
      <div className="card flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
          <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <p className="text-gray-400 text-sm">No user data loaded</p>
          <p className="text-gray-600 text-xs mt-1">Make sure the server is running and click refresh</p>
        </div>
      </div>
    );
  }

  const overallRating = userData.rating.overall || userData.player_rating || 0;
  const overallDiv = getDivision(overallRating);

  return (
    <div className="card animate-fade-in">
      <div className="flex flex-wrap items-center gap-4">

        {/* Avatar */}
        <div className="flex-shrink-0">
          {userData.avatar_url ? (
            <img
              src={userData.avatar_url}
              alt={userData.username}
              className="w-16 h-16 rounded-full border-2 object-cover"
              style={{
                borderColor: overallDiv.division.color,
                boxShadow: `0 0 16px ${overallDiv.division.color}66`,
              }}
            />
          ) : (
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black border-2"
              style={{
                backgroundColor: `${overallDiv.division.color}22`,
                borderColor: overallDiv.division.color,
                color: overallDiv.division.textColor,
                boxShadow: `0 0 16px ${overallDiv.division.color}44`,
              }}
            >
              {userData.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Username + rank */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-black text-white truncate">{userData.username}</h1>
            {userData.country_code && (
              <span className="text-xl" title={userData.country_code}>
                {getCountryFlag(userData.country_code)}
              </span>
            )}
          </div>
          {userRanks && (
            <p className="text-gray-500 text-sm mt-0.5">
              World Rank:{' '}
              <span className="font-bold text-purple-400">
                #{(userRanks.overall || 0).toLocaleString()}
              </span>
            </p>
          )}
        </div>

        {/* Overall rating + division */}
        <div className="flex-shrink-0 text-right flex flex-col items-end gap-1.5">
          <div
            className="text-4xl font-black tabular-nums"
            style={{ color: overallDiv.division.textColor, textShadow: `0 0 20px ${overallDiv.division.color}88` }}
          >
            {overallRating.toFixed(2)}
          </div>
          <DivisionBadge rating={overallRating} showRating={false} size="lg" />
        </div>

        {/* Skillset mini-ratings with divisions */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-3 border-t border-gray-800">
          {ALL_SKILLSETS.filter(k => k !== 'overall').map(key => {
            const skillRating = userData.rating[key] || 0;
            const skillDiv = getDivision(skillRating);
            return (
              <div
                key={key}
                className="rounded-lg p-2 border transition-colors duration-200"
                style={{
                  backgroundColor: `${skillDiv.division.color}11`,
                  borderColor: `${skillDiv.division.color}44`,
                }}
              >
                {/* Skill name */}
                <div className="text-xs font-semibold mb-1 truncate" style={{ color: SKILLSET_COLORS[key] }}>
                  {SKILLSET_LABELS[key]}
                </div>
                {/* Rating */}
                <div className="text-sm font-black tabular-nums" style={{ color: skillDiv.division.textColor }}>
                  {skillRating.toFixed(2)}
                </div>
                {/* Division name */}
                <div
                  className="text-xs font-bold mt-0.5 truncate"
                  style={{ color: skillDiv.division.textColor, opacity: 0.85 }}
                >
                  {skillDiv.fullName}
                </div>
                {/* World rank */}
                {userRanks && (
                  <div className="text-xs text-gray-600 mt-0.5">
                    #{(userRanks[key] || 0).toLocaleString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <UserProfileCard />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SkillBreakdownChart />
        <RankHistoryChart />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ImprovementTracker />
        <LeaderboardGoal />
      </div>
    </div>
  );
}
