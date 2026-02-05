import React from 'react';

function RatingStars({ rating, showNumber = false, size = 'md' }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  return (
    <div className="flex items-center gap-1">
      {[...Array(fullStars)].map((_, i) => (
        <span key={i} className={`${sizeClasses[size]} text-yellow-400`}>
          ★
        </span>
      ))}
      {hasHalfStar && (
        <span className={`${sizeClasses[size]} text-yellow-400`}>
          ★
        </span>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <span key={i} className={`${sizeClasses[size]} text-gray-300`}>
          ★
        </span>
      ))}
      {showNumber && (
        <span className="text-sm text-gray-600 ml-1">
          ({rating.toFixed(1)})
        </span>
      )}
    </div>
  );
}

export default RatingStars;
