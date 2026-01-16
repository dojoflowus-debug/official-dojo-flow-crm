/**
 * Attendance Chart Component
 * Displays attendance statistics using Recharts
 */

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface AttendanceChartProps {
  attended: number;
  missed: number;
  excused: number;
  upcoming: number;
  title?: string;
  height?: number;
}

export const AttendanceChart: React.FC<AttendanceChartProps> = ({
  attended,
  missed,
  excused,
  upcoming,
  title = 'Attendance Overview',
  height = 300,
}) => {
  const data = [
    { name: 'Attended', value: attended, color: '#27ae60' },
    { name: 'Missed', value: missed, color: '#e74c3c' },
    { name: 'Excused', value: excused, color: '#f39c12' },
    { name: 'Upcoming', value: upcoming, color: '#3498db' },
  ].filter((item) => item.value > 0);

  if (data.length === 0) {
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
        No attendance data available
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
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value} students`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AttendanceChart;
