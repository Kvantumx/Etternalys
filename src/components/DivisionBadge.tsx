import { getDivision } from '../utils/divisions';

interface Props {
  rating: number;
  showRating?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function DivisionBadge({ rating, showRating = true, size = 'md' }: Props) {
  if (!rating || rating <= 0) return null;

  const { division, fullName } = getDivision(rating);

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-1 gap-1.5',
    lg: 'text-sm px-2.5 py-1 gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-md font-bold ${sizeClasses}`}
      style={{
        backgroundColor: `${division.color}33`,
        border: `1px solid ${division.color}88`,
        color: division.textColor,
        boxShadow: `0 0 6px ${division.color}44`,
      }}
    >
      <span>{fullName}</span>
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
