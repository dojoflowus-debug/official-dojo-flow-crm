/**
 * Revenue Chart Component
 * Displays revenue trends over time using Recharts
 */

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface RevenueChartProps {
  data: Array<{
    date: string;
    revenue: number;
  }>;
  title?: string;
  height?: number;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({
  data,
  title = 'Revenue Trend',
  height = 300,
}) => {
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height: `${height}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#999',
        }}
      >
        No data available
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: `${height}px` }}>
      {title && (
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#333' }}>
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height - 40}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
          <XAxis dataKey="date" stroke="#999" />
          <YAxis stroke="#999" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e8e8e8',
              borderRadius: '4px',
            }}
            formatter={(value) => `$${(value as number).toLocaleString()}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#e74c3c"
            strokeWidth={2}
            dot={{ fill: '#e74c3c', r: 4 }}
            activeDot={{ r: 6 }}
            name="Revenue"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;
