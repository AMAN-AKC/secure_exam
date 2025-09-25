import React from 'react';

const Button = ({ 
  variant = 'primary', 
  size = 'medium', 
  loading = false, 
  disabled = false, 
  icon, 
  children, 
  className = '',
  ...props 
}) => {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary', 
    success: 'btn-success',
    danger: 'btn-danger',
    warning: 'btn-warning',
    outline: 'btn-outline'
  };

  const sizes = {
    small: 'btn-sm',
    medium: 'btn-md',
    large: 'btn-lg'
  };

  const classes = [
    'btn',
    variants[variant],
    sizes[size],
    loading && 'btn-loading',
    disabled && 'btn-disabled',
    className
  ].filter(Boolean).join(' ');

  return (
    <button 
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="btn-spinner">
          <div className="spinner-border"></div>
        </div>
      )}
      {icon && !loading && <span className="btn-icon">{icon}</span>}
      <span className={loading ? 'btn-text-hidden' : 'btn-text'}>
        {children}
      </span>
    </button>
  );
};

export default Button;