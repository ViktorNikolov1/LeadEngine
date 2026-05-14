import React, { useMemo } from 'react';
import { ArrowDown } from 'lucide-react';

export interface FunnelStep {
  id: string;
  label: string;
  value: number;
  colorClass?: string;
}

interface FunnelChartProps {
  data: FunnelStep[];
  title?: string;
  description?: string;
}

export function FunnelChart({ data, title, description }: FunnelChartProps) {
  const maxValue = useMemo(() => {
    if (!data || data.length === 0) return 0;
    return Math.max(...data.map(d => d.value));
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="card p-8 flex items-center justify-center text-secondary-500">
        No hay datos para el funnel.
      </div>
    );
  }

  // Pre-calculated default colors if none provided (Pink/Rose aesthetic with gradient feel)
  const defaultColors = [
    'bg-rose-500 text-white shadow-rose-500/30',
    'bg-rose-400 text-white shadow-rose-400/30',
    'bg-pink-400 text-white shadow-pink-400/30',
    'bg-fuchsia-400 text-white shadow-fuchsia-400/30',
    'bg-purple-400 text-white shadow-purple-400/30',
    'bg-violet-500 text-white shadow-violet-500/30'
  ];

  return (
    <div className="card p-6 md:p-8 w-full">
      {title && (
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-sm text-secondary-500 dark:text-slate-400 mb-8">
          {description}
        </p>
      )}

      <div className="flex flex-col items-center w-full max-w-3xl mx-auto py-4">
        {data.map((step, index) => {
          // Calculate width relative to the max value, with a minimum width to ensure text fits
          const widthPercent = Math.max((step.value / maxValue) * 100, 25);
          const isLast = index === data.length - 1;
          
          // Conversion rate from PREVIOUS step to THIS step
          const conversionRate = index > 0 && data[index - 1].value > 0 
            ? Math.round((step.value / data[index - 1].value) * 100) 
            : null;

          const colorClass = step.colorClass || defaultColors[index % defaultColors.length];

          return (
            <div key={step.id} className="w-full flex flex-col items-center relative group">
              {/* The Funnel Bar */}
              <div 
                className={`relative flex items-center justify-between px-6 py-4 rounded-2xl shadow-lg transition-all duration-500 hover:-translate-y-1 hover:shadow-xl cursor-default ${colorClass}`}
                style={{ width: `${widthPercent}%` }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 overflow-hidden">
                  <span className="font-semibold text-sm sm:text-base truncate">{step.label}</span>
                </div>
                <div className="flex flex-col items-end whitespace-nowrap pl-4">
                  <span className="font-bold text-lg sm:text-2xl leading-none">{step.value.toLocaleString()}</span>
                </div>
                
                {/* Overlay highlight on hover */}
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity pointer-events-none"></div>
              </div>
              
              {/* Connector and Conversion Rate */}
              {!isLast && (
                <div className="flex flex-col items-center justify-center h-16 relative w-full">
                  <div className="w-px h-full bg-gradient-to-b from-secondary-200 to-secondary-300 dark:from-slate-700 dark:to-slate-600"></div>
                  
                  {/* Arrow Icon */}
                  <div className="absolute bottom-2 bg-white dark:bg-slate-800 rounded-full p-0.5 border border-secondary-200 dark:border-slate-700 z-10">
                    <ArrowDown className="w-3 h-3 text-secondary-400 dark:text-slate-500" />
                  </div>

                  {/* Conversion rate badge */}
                  {index < data.length - 1 && data[index].value > 0 && (
                    <div className="absolute right-1/2 translate-x-24 sm:translate-x-32 z-10">
                      <div className="glass-badge flex items-center gap-1 animate-in fade-in slide-in-from-bottom-4">
                        <span className="text-secondary-500 dark:text-slate-400 font-medium">Conv.</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {Math.round((data[index + 1].value / step.value) * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
