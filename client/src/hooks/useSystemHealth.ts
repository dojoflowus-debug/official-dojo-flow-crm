import { useState, useEffect, useRef } from 'react';

export type HealthStatus = 'healthy' | 'degraded' | 'critical';

export interface SystemHealth {
  status: HealthStatus;
  averageResponseTime: number;
  lastChecked: Date;
}

// Health thresholds in milliseconds
const THRESHOLDS = {
  healthy: 200,    // < 200ms = green
  degraded: 500,   // 200-500ms = yellow
  // > 500ms = red
};

// Check interval in milliseconds
const CHECK_INTERVAL = 10000; // Check every 10 seconds

/**
 * Hook to monitor system health based on API response times
 * Performs periodic health checks and returns current health status
 */
export function useSystemHealth(): SystemHealth {
  const [health, setHealth] = useState<SystemHealth>({
    status: 'healthy',
    averageResponseTime: 0,
    lastChecked: new Date(),
  });

  const responseTimes = useRef<number[]>([]);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Intercept fetch to measure response times
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const startTime = performance.now();
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        // Only track API calls (not static assets)
        const url = typeof args[0] === 'string' ? args[0] : args[0].url;
        if (url.includes('/api/') || url.includes('/trpc/')) {
          responseTimes.current.push(responseTime);
          
          // Keep only last 20 measurements
          if (responseTimes.current.length > 20) {
            responseTimes.current.shift();
          }
        }

        return response;
      } catch (error) {
        // On error, record a high response time
        responseTimes.current.push(5000);
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Periodic health check
  useEffect(() => {
    const checkHealth = () => {
      if (responseTimes.current.length === 0) {
        // No data yet, assume healthy
        setHealth({
          status: 'healthy',
          averageResponseTime: 0,
          lastChecked: new Date(),
        });
        return;
      }

      // Calculate average response time
      const sum = responseTimes.current.reduce((a, b) => a + b, 0);
      const avg = sum / responseTimes.current.length;

      // Determine health status
      let status: HealthStatus;
      if (avg < THRESHOLDS.healthy) {
        status = 'healthy';
      } else if (avg < THRESHOLDS.degraded) {
        status = 'degraded';
      } else {
        status = 'critical';
      }

      setHealth({
        status,
        averageResponseTime: Math.round(avg),
        lastChecked: new Date(),
      });
    };

    // Initial check
    checkHealth();

    // Set up periodic checks
    checkIntervalRef.current = setInterval(checkHealth, CHECK_INTERVAL);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  return health;
}
