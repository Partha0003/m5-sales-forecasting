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
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '8px'
            }}
            labelStyle={{ color: '#374151', fontWeight: 'bold' }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="sales" 
            stroke="#0ea5e9" 
            strokeWidth={2}
            dot={false}
            name="Daily Sales"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

