'use client';

import React from 'react';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ForecastDataPoint } from '@/lib/types';

interface ForecastChartProps {
  data: ForecastDataPoint[];
  title?: string;
}

export default function ForecastChart({ data, title = '28-Day Forecast' }: ForecastChartProps) {
  const hasConfidenceIntervals = data.some(item => 
    item.lower_bound !== undefined && item.upper_bound !== undefined
  );

  const chartData = data.map(item => ({
    day: `Day ${item.day}`,
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    forecast: item.forecast,
    lower_bound: item.lower_bound,
    upper_bound: item.upper_bound,
  }));

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={450}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" strokeOpacity={0.5} />
          <XAxis 
            dataKey="day" 
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
            formatter={(value: number, name: string) => {
              if (name === 'forecast') {
                return [value.toFixed(2), 'Forecast'];
              }
              if (name === 'lower_bound') {
                return [value.toFixed(2), 'Lower Bound'];
              }
              if (name === 'upper_bound') {
                return [value.toFixed(2), 'Upper Bound'];
              }
              return [value.toFixed(2), name];
            }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '14px' }} />
          {hasConfidenceIntervals && (
            <>
              {/* First: Fill area from dataMin to upper_bound with confidence color */}
              <Area
                type="monotone"
                dataKey="upper_bound"
                baseValue="dataMin"
                stroke="none"
                fill="#10b981"
                fillOpacity={0.18}
                name=""
                hide
              />
              {/* Second: Fill area from dataMin to lower_bound with white to create band effect */}
              <Area
                type="monotone"
                dataKey="lower_bound"
                baseValue="dataMin"
                stroke="none"
                fill="#ffffff"
                fillOpacity={1}
                name="Confidence Interval"
              />
            </>
          )}
          <Line 
            type="monotone" 
            dataKey="forecast" 
            stroke="#10b981" 
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 5, fill: '#10b981' }}
            name="Forecasted Demand"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

