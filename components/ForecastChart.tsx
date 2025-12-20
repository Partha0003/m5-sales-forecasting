'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ForecastDataPoint } from '@/lib/types';

interface ForecastChartProps {
  data: ForecastDataPoint[];
  title?: string;
}

export default function ForecastChart({ data, title = '28-Day Forecast' }: ForecastChartProps) {
  const chartData = data.map(item => ({
    day: `Day ${item.day}`,
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    forecast: item.forecast,
  }));

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="day" 
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
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
            formatter={(value: number) => [value.toFixed(2), 'Forecast']}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="forecast" 
            stroke="#10b981" 
            strokeWidth={2}
            dot={false}
            name="Forecasted Demand"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

