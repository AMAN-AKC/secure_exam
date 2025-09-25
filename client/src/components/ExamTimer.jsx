import React, { useState, useEffect } from 'react';

const ExamTimer = ({ duration, onTimeUp, isActive = true }) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          onTimeUp?.();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, timeLeft, onTimeUp]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    const percentage = timeLeft / duration;
    if (percentage > 0.5) return 'var(--success)';
    if (percentage > 0.2) return 'var(--warning)';
    return 'var(--danger)';
  };

  const percentage = (timeLeft / duration) * 100;

  return (
    <div className="exam-timer">
      <div className="timer-display">
        <div className="timer-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="timer-text" style={{ color: getTimerColor() }}>
          {formatTime(timeLeft)}
        </span>
      </div>
      <div className="timer-progress">
        <div 
          className="timer-progress-bar"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: getTimerColor()
          }}
        />
      </div>
      {timeLeft <= 300 && timeLeft > 0 && (
        <div className="timer-warning">
          ⚠️ Less than 5 minutes remaining!
        </div>
      )}
    </div>
  );
};

export default ExamTimer;