'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MonthlySalesChartProps {
  data: { month: string; sales: number }[];
  year: number;
  title?: string;
}

export default function MonthlySalesChart({ data, year, title }: MonthlySalesChartProps) {
  const chartTitle = title || `Monthly Sales for ${year}`;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{chartTitle}</h3>
      <ResponsiveContainer width="100%" height={450}>
        <BarChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" strokeOpacity={0.5} />
          <XAxis 
            dataKey="month" 
            stroke="#9ca3af"
            tick={{ fontSize: 14, fill: '#6b7280' }}
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
            formatter={(value: number) => [value.toFixed(2), 'Total Sales']}
          />
          <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '14px' }} />
          <Bar 
            dataKey="sales" 
            fill="#0284c7" 
            name="Monthly Sales"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

