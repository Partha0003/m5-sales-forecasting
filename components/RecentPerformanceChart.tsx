'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SalesDataPoint } from '@/lib/types';

interface RecentPerformanceChartProps {
  data: SalesDataPoint[];
  title?: string;
}

export default function RecentPerformanceChart({ data, title = 'Recent Performance (Last 90 Days)' }: RecentPerformanceChartProps) {
  // Format data for chart - limit to reasonable number of points for performance
  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    sales: item.sales,
  }));

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={450}>
        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" strokeOpacity={0.5} />
          <XAxis 
            dataKey="date" 
            stroke="#9ca3af"
            tick={{ fontSize: 14, fill: '#6b7280' }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis stroke="#9ca3af" tick={{ fontSize: 14, fill: '#6b7280' }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '14px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              fontSize: '14px'
            }}
            labelStyle={{ color: '#374151', fontWeight: 'bold', marginBottom: '6px', fontSize: '15px' }}
            formatter={(value: number) => [value.toFixed(2), 'Sales']}
          />
          <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '14px' }} />
          <Line 
            type="monotone" 
            dataKey="sales" 
            stroke="#0284c7" 
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 5, fill: '#0284c7' }}
            name="Daily Sales"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

