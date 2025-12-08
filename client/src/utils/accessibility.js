import React, { useEffect } from 'react';

/**
 * Hook for keyboard navigation
 */
export const useKeyboardNavigation = (items, onSelect) => {
  const [activeIndex, setActiveIndex] = React.useState(0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          setActiveIndex((prev) => (prev + 1) % items.length);
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          onSelect(items[activeIndex]);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, activeIndex, onSelect]);

  return { activeIndex, setActiveIndex };
};

/**
 * Skip to main content link
 */
export const SkipLink = () => {
  return (
    <a href="#main" className="skip-link">
      Skip to main content
    </a>
  );
};

/**
 * Screen reader only text
 */
export const ScreenReaderOnly = ({ children, as: Component = 'span' }) => {
  return (
    <Component className="sr-only" aria-live="polite">
      {children}
    </Component>
  );
};

/**
 * Accessible button with loading state
 */
export const AccessibleButton = ({
  children,
  disabled = false,
  loading = false,
  ariaLabel,
  ariaDescribedBy,
  ...props
}) => {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-label={ariaLabel || children}
      aria-describedby={ariaDescribedBy}
      aria-busy={loading}
    >
      {loading ? <span aria-hidden="true">Loading...</span> : children}
    </button>
  );
};

/**
 * Announce to screen readers
 */
export const useAnnouncement = (message, priority = 'polite') => {
  React.useEffect(() => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);

    return () => {
      setTimeout(() => document.body.removeChild(announcement), 1000);
    };
  }, [message, priority]);
};

/**
 * Focus trap component
 */
export const FocusTrap = ({ children, isActive = true }) => {
  const containerRef = React.useRef(null);

  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;

      const focusableElements = containerRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    const container = containerRef.current;
    container?.addEventListener('keydown', handleKeyDown);
    return () => container?.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  return <div ref={containerRef}>{children}</div>;
};
