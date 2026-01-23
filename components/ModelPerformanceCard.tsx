'use client';

import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import KPICard from './KPICard';

type ModelEvaluationRow = {
  Model: string;
  MAE_28: number | string;
  RMSE_28: number | string;
};

type ModelPerformanceMap = Record<string, number>;

const MODEL_NAMES = {
  naive: 'Naive Baseline',
  movingAverage: 'Moving Average (28 days)',
  lightgbm: 'LightGBM (Tweedie)',
} as const;

export default function ModelPerformanceCard() {
  const [performance, setPerformance] = useState<ModelPerformanceMap | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadModelPerformance() {
      try {
        const res = await fetch('/model_evaluation_28day.csv', { cache: 'no-store' });
        if (!res.ok) {
          throw new Error(`Failed to fetch CSV: ${res.statusText}`);
        }

        const text = await res.text();

        const parsed = Papa.parse<ModelEvaluationRow>(text, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
        });

        const map: ModelPerformanceMap = {};

        parsed.data.forEach((row) => {
          if (!row || !row.Model) return;

          const rmseValue =
            typeof row.RMSE_28 === 'number'
              ? row.RMSE_28
              : Number(row.RMSE_28);

          if (!Number.isNaN(rmseValue)) {
            map[row.Model] = rmseValue;
          }
        });

        setPerformance(map);
      } catch (err) {
        console.error(err);
        setError('Failed to load model performance.');
      }
    }

    loadModelPerformance();
  }, []);

  const formatRMSE = (value?: number) => {
    if (value === undefined) return 'N/A';
    return value.toFixed(2);
  };

  const naiveRMSE = performance?.[MODEL_NAMES.naive];
  const movingAvgRMSE = performance?.[MODEL_NAMES.movingAverage];
  const lightgbmRMSE = performance?.[MODEL_NAMES.lightgbm];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Model Performance (28-Day RMSE)
      </h3>

      {error && (
        <p className="text-sm text-red-600 mb-4">
          {error}
        </p>
      )}

      {!performance && !error && (
        <p className="text-sm text-gray-500">
          Loading model performance...
        </p>
      )}

      {performance && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard
            title={MODEL_NAMES.naive}
            value={formatRMSE(naiveRMSE)}
            trend="neutral"
          />
          <KPICard
            title={MODEL_NAMES.movingAverage}
            value={formatRMSE(movingAvgRMSE)}
            trend="neutral"
          />
          <KPICard
            title={MODEL_NAMES.lightgbm}
            value={formatRMSE(lightgbmRMSE)}
            trend="up"
            subtitle="Best performing model (lowest RMSE)"
          />
        </div>
      )}
    </div>
  );
}

