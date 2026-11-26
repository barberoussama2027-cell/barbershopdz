import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export interface ChartPoint {
  label: string;
  revenue: number;
  netProfit: number;
  count: number;
}

export const RevenueProfitChart: React.FC<{ data: ChartPoint[] }> = ({ data }) => {
  const { formatDZD, t } = useLanguage();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-sm text-slate-500">
        {t('app.noData')}
      </div>
    );
  }

  const maxVal = Math.max(1000, ...data.map((d) => Math.max(d.revenue, Math.abs(d.netProfit))));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            {t('dashboard.grossRevenue')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            {t('dashboard.netMargin')}
          </span>
        </div>
        {hoveredIdx !== null && data[hoveredIdx] && (
          <div className="text-slate-200 font-medium">
            {data[hoveredIdx].label} :{' '}
            <span className="text-amber-400">{formatDZD(data[hoveredIdx].revenue)}</span> |{' '}
            <span className="text-emerald-400">{formatDZD(data[hoveredIdx].netProfit)}</span>
          </div>
        )}
      </div>

      <div className="h-56 sm:h-64 lg:h-72 flex items-end gap-1.5 sm:gap-2.5 pt-4 border-b border-slate-800 pb-2">
        {data.map((point, idx) => {
          const revH = Math.max(4, Math.round((point.revenue / maxVal) * 100));
          const netH = Math.max(
            4,
            Math.round((Math.max(0, point.netProfit) / maxVal) * 100)
          );
          const isHovered = hoveredIdx === idx;
          return (
            <div
              key={point.label}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
            >
              <div className="w-full flex items-end justify-center gap-1 h-full">
                <div
                  style={{ height: `${revH}%` }}
                  className={`w-2.5 sm:w-4 rounded-t-md transition-all duration-300 ${
                    isHovered ? 'bg-amber-300' : 'bg-amber-500/85'
                  }`}
                  title={`${point.label} - ${formatDZD(point.revenue)}`}
                />
                <div
                  style={{ height: `${netH}%` }}
                  className={`w-2.5 sm:w-4 rounded-t-md transition-all duration-300 ${
                    point.netProfit < 0
                      ? 'bg-rose-500/80'
                      : isHovered
                      ? 'bg-emerald-300'
                      : 'bg-emerald-500/85'
                  }`}
                  title={`${point.label} - ${formatDZD(point.netProfit)}`}
                />
              </div>
              <span className="mt-2 text-[10px] sm:text-xs text-slate-400 truncate max-w-full">
                {point.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export interface TrafficPoint {
  label: string;
  count: number;
}

export const TrafficBarChart: React.FC<{ data: TrafficPoint[]; accent?: 'amber' | 'sky' }> = ({
  data,
  accent = 'sky',
}) => {
  const { t } = useLanguage();
  if (data.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-sm text-slate-500">
        {t('app.noData')}
      </div>
    );
  }

  const maxCount = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="h-44 sm:h-48 lg:h-56 flex items-end gap-1.5 sm:gap-2 pt-4 border-b border-slate-800 pb-2">
      {data.map((d) => {
        const heightPct = d.count === 0 ? 3 : Math.max(8, Math.round((d.count / maxCount) * 100));
        return (
          <div key={d.label} className="flex-1 flex flex-col items-center h-full justify-end group">
            <span className="text-[10px] text-slate-400 mb-1 opacity-0 group-hover:opacity-100 transition">
              {d.count}
            </span>
            <div
              style={{ height: `${heightPct}%` }}
              className={`w-full max-w-[26px] rounded-t-md transition-all ${
                d.count === 0
                  ? 'bg-slate-800'
                  : accent === 'amber'
                  ? 'bg-amber-500/80 group-hover:bg-amber-400'
                  : 'bg-sky-500/80 group-hover:bg-sky-400'
              }`}
              title={`${d.label}: ${d.count}`}
            />
            <span className="mt-2 text-[10px] text-slate-400 truncate max-w-full">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
};
