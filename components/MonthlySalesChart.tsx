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
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="month" 
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
            formatter={(value: number) => [value.toFixed(2), 'Total Sales']}
          />
          <Legend />
          <Bar 
            dataKey="sales" 
            fill="#8b5cf6" 
            name="Monthly Sales"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

