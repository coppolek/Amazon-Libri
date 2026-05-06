import React from 'react';
import { Star, StarHalf } from 'lucide-react';

interface RatingDisplayProps {
  rating: number;
  count?: number;
  size?: number;
}

export const RatingDisplay: React.FC<RatingDisplayProps> = ({ rating, count, size = 16 }) => {
  if (rating === undefined || rating === null || rating === 0) {
    return <div className="flex items-center text-slate-400 text-sm">Nessuna recensione</div>;
  }

  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-1.5 inline-flex">
      <div className="flex text-amber-500">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} size={size} fill="currentColor" stroke="currentColor" />
        ))}
        {hasHalfStar && <StarHalf size={size} fill="currentColor" stroke="currentColor" />}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} size={size} stroke="currentColor" className="text-slate-300" />
        ))}
      </div>
      {count !== undefined && (
        <span className="text-xs text-slate-500 font-medium">({count})</span>
      )}
    </div>
  );
};
