import logger from '../utils/logger.js';

export function parseScheduleDate(dateStr) {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: "${dateStr}". Use ISO 8601 format (e.g., 2026-03-15T09:00:00)`);
  }
  if (date <= new Date()) {
    throw new Error('Schedule date must be in the future');
  }
  return date.toISOString();
}

export function formatScheduleInfo(isoDate) {
  const date = new Date(isoDate);
  return {
    iso: isoDate,
    local: date.toLocaleString(),
    relative: getRelativeTime(date),
  };
}

function getRelativeTime(date) {
  const now = new Date();
  const diffMs = date - now;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
  if (diffHours > 0) return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  return `in ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
}
