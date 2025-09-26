import dayjs from 'dayjs';

/**
 * Standardized date/time formatting utilities for consistent 24-hour format across the app
 */

// Time only (HH:mm)
export const formatTime = (date) => {
  return dayjs(date).format('HH:mm');
};

// Date only (MMM DD, YYYY)
export const formatDate = (date) => {
  return dayjs(date).format('MMM DD, YYYY');
};

// Date with time (MMM DD, YYYY HH:mm)
export const formatDateTime = (date) => {
  return dayjs(date).format('MMM DD, YYYY HH:mm');
};

// Date with time and "at" separator (MMM DD, YYYY at HH:mm)
export const formatDateTimeWithAt = (date) => {
  return dayjs(date).format('MMM DD, YYYY at HH:mm');
};

// Duration formatting for timers (MM:SS or HH:MM:SS)
export const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

// Time range (HH:mm - HH:mm)
export const formatTimeRange = (startDate, endDate) => {
  return `${formatTime(startDate)} - ${formatTime(endDate)}`;
};

// Date with time range (MMM DD, YYYY at HH:mm - HH:mm)
export const formatDateTimeRange = (startDate, endDate) => {
  const startDay = dayjs(startDate);
  const endDay = dayjs(endDate);
  
  if (startDay.isSame(endDay, 'day')) {
    // Same day: MMM DD, YYYY at HH:mm - HH:mm
    return `${formatDate(startDate)} at ${formatTimeRange(startDate, endDate)}`;
  } else {
    // Different days: MMM DD, YYYY at HH:mm - MMM DD, YYYY at HH:mm
    return `${formatDateTimeWithAt(startDate)} - ${formatDateTimeWithAt(endDate)}`;
  }
};

// Relative time with 24-hour fallback (e.g., "2 hours ago" or "Dec 25, 2023 14:30")
export const formatRelativeTime = (date) => {
  const now = dayjs();
  const target = dayjs(date);
  const diffHours = now.diff(target, 'hour');
  
  if (diffHours < 24) {
    // Less than 24 hours - show relative
    if (diffHours < 1) {
      const diffMinutes = now.diff(target, 'minute');
      if (diffMinutes < 1) return 'Just now';
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    }
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }
  
  // More than 24 hours - show absolute time
  return formatDateTime(date);
};