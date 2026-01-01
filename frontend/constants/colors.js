export const Colors = {
  primary: '#0000ee',
  success: '#10b981',
  warning: '#f59e0b',
  urgent: '#fb923c',
  critical: '#ef4444',
  white: '#ffffff',
  lightGray: '#f3f4f6',
  gray: '#e5e7eb',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  background: '#ffffff',
};

export const getStatusColor = (daysLeft) => {
  if (daysLeft >= 14) return Colors.success;
  if (daysLeft >= 7) return Colors.warning;
  if (daysLeft >= 3) return Colors.urgent;
  return Colors.critical;
};

export const getStatusText = (daysLeft) => {
  if (daysLeft >= 14) return 'On Track';
  if (daysLeft >= 7) return 'Plan Exit Soon';
  if (daysLeft >= 3) return 'Urgent: Exit Soon';
  if (daysLeft >= 1) return 'CRITICAL: Exit Now';
  return 'EXPIRED TODAY';
};
