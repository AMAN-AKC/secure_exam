import React from 'react';

const LoadingSpinner = ({ size = 'medium', color = 'var(--brand)' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8', 
    large: 'w-12 h-12'
  };

  return (
    <div className="loading-spinner-container">
      <div 
        className={`loading-spinner ${sizeClasses[size]}`}
        style={{ borderTopColor: color }}
      >
      </div>
    </div>
  );
};

export default LoadingSpinner;