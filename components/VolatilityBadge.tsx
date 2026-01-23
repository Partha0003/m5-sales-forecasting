import React from 'react';

interface VolatilityBadgeProps {
  volatility: 'stable' | 'moderate' | 'high' | number;
}

export default function VolatilityBadge({ volatility }: VolatilityBadgeProps) {
  // If volatility is a number, determine label based on thresholds
  const getVolatilityLabel = (): 'stable' | 'moderate' | 'high' => {
    if (typeof volatility === 'number') {
      if (volatility < 0.3) return 'stable';
      if (volatility < 0.7) return 'moderate';
      return 'high';
    }
    return volatility;
  };

  const label = getVolatilityLabel();

  const getBadgeStyles = () => {
    switch (label) {
      case 'stable':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLabelText = () => {
    switch (label) {
      case 'stable':
        return 'Stable';
      case 'moderate':
        return 'Moderate';
      case 'high':
        return 'High';
      default:
        return 'Unknown';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getBadgeStyles()}`}
    >
      {getLabelText()}
    </span>
  );
}
