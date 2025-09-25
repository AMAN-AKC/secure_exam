import React from 'react';

const Card = ({ 
  title, 
  subtitle, 
  children, 
  className = '', 
  headerAction,
  padding = 'normal',
  variant = 'default'
}) => {
  const paddingClasses = {
    none: 'p-0',
    small: 'p-3',
    normal: 'p-6',
    large: 'p-8'
  };

  const variantClasses = {
    default: 'card-default',
    elevated: 'card-elevated',
    bordered: 'card-bordered',
    gradient: 'card-gradient'
  };

  return (
    <div className={`card ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}>
      {(title || headerAction) && (
        <div className="card-header">
          <div className="card-title-section">
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {headerAction && (
            <div className="card-header-action">
              {headerAction}
            </div>
          )}
        </div>
      )}
      <div className="card-content">
        {children}
      </div>
    </div>
  );
};

export default Card;