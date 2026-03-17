import { getDivision } from '../utils/divisions';

interface Props {
  rating: number;
  showRating?: boolean;
  noSubRank?: boolean;
  onImage?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function DivisionBadge({ rating, showRating = true, noSubRank = false, onImage = false, size = 'md' }: Props) {
  if (!rating || rating <= 0) return null;

  const { division, fullName } = getDivision(rating);
  const label = noSubRank ? division.name : fullName;

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-1 gap-1.5',
    lg: 'text-sm px-2.5 py-1 gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-md font-bold ${sizeClasses}`}
      style={{
        backgroundColor: onImage ? `rgba(0,0,0,0.65)` : `${division.color}33`,
        border: `1px solid ${division.color}${onImage ? 'cc' : '88'}`,
        color: division.textColor,
        boxShadow: onImage
          ? `0 0 10px ${division.color}99, inset 0 0 0 1px ${division.color}44`
          : `0 0 6px ${division.color}44`,
        backdropFilter: onImage ? 'blur(4px)' : undefined,
        textShadow: onImage ? '0 1px 3px rgba(0,0,0,0.9)' : undefined,
      }}
    >
      <span>{label}</span>
      {showRating && (
        <span
          className="opacity-70 font-normal tabular-nums"
          style={{ color: division.textColor }}
        >
          {rating.toFixed(2)}
        </span>
      )}
    </span>
  );
}
