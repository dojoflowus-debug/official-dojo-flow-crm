/**
 * Dashboard Utility Functions
 * Helper functions for formatting and data manipulation
 */

/**
 * Format currency value
 */
export function formatCurrency(value: number, currency: string = 'USD'): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return formatter.format(value / 100); // Assuming value is in cents
}

/**
 * Format date with optional time
 */
export function formatDate(
  dateString: string,
  format: 'date' | 'time' | 'datetime' | 'HH:mm' = 'date'
): string {
  const date = new Date(dateString);

  if (format === 'HH:mm') {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  if (format === 'date') {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  if (format === 'time') {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  // datetime
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Format large numbers with K, M, B suffix
 */
export function formatNumber(value: number): string {
  if (value >= 1000000000) {
    return (value / 1000000000).toFixed(1) + 'B';
  }
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  }
  return value.toString();
}

/**
 * Get date range for common periods
 */
export function getDateRange(period: 'today' | 'week' | 'month' | 'quarter' | 'year') {
  const today = new Date();
  const startDate = new Date();

  switch (period) {
    case 'today':
      startDate.setDate(today.getDate());
      break;
    case 'week':
      startDate.setDate(today.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(today.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(today.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(today.getFullYear() - 1);
      break;
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
  };
}

/**
 * Get status color for different metrics
 */
export function getStatusColor(
  status: string
): 'success' | 'warning' | 'danger' | 'info' {
  const statusLower = status.toLowerCase();

  if (statusLower.includes('attended') || statusLower.includes('paid')) {
    return 'success';
  }
  if (statusLower.includes('pending') || statusLower.includes('upcoming')) {
    return 'info';
  }
  if (statusLower.includes('overdue') || statusLower.includes('missed')) {
    return 'danger';
  }
  if (statusLower.includes('excused') || statusLower.includes('hold')) {
    return 'warning';
  }

  return 'info';
}

/**
 * Compare two metrics and return trend
 */
export function calculateTrend(
  current: number,
  previous: number
): { direction: 'up' | 'down' | 'neutral'; percentage: number } {
  if (previous === 0) {
    return { direction: current > 0 ? 'up' : 'neutral', percentage: 0 };
  }

  const percentage = Math.round(((current - previous) / previous) * 100);

  if (percentage > 0) {
    return { direction: 'up', percentage };
  }
  if (percentage < 0) {
    return { direction: 'down', percentage: Math.abs(percentage) };
  }

  return { direction: 'neutral', percentage: 0 };
}
