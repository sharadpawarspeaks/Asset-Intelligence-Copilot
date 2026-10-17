import React from 'react';
import { HeatmapData } from '../../types';

interface Props {
  data: HeatmapData;
}

export const HeatmapVisual: React.FC<Props> = ({ data }) => {
  // Find max value in matrix for scaling color opacity
  const maxVal = Math.max(...data.matrix.flat(), 1);

  const getCellColor = (val: number) => {
    if (val === 0) return 'bg-slate-900/60 text-slate-500';
    const ratio = val / maxVal;
    if (ratio < 0.25) return 'bg-amber-950/40 text-amber-200 border-amber-900/40';
    if (ratio < 0.5) return 'bg-amber-800/50 text-amber-100 border-amber-700/50';
    if (ratio < 0.75) return 'bg-rose-900/60 text-rose-100 border-rose-800/60';
    return 'bg-rose-700/80 text-white font-bold border-rose-600';
  };

  return (
    <div className="rounded-xl glass-card border border-slate-700/60 p-5 shadow-xl my-3 text-slate-100 max-w-3xl overflow-x-auto">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
        <h4 className="text-sm font-bold text-sky-400 uppercase tracking-wider">
          {data.title || '2026 Spills Heatmap by Area & Month'}
        </h4>
        <span className="text-xs text-slate-300 font-mono bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
          Field Total: <strong className="text-sky-400">{data.total} spills</strong>
        </span>
      </div>

      <div className="min-w-[550px]">
        <table className="w-full text-center border-collapse text-xs">
          <thead>
            <tr>
              <th className="text-left py-2 px-3 text-slate-400 font-semibold w-44">Geographic Area</th>
              {data.x_labels.map(m => (
                <th key={m} className="py-2 px-2 text-slate-300 font-mono font-medium text-[11px]">{m}</th>
              ))}
              <th className="py-2 px-3 text-slate-300 font-bold bg-slate-900/80">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {data.y_labels.map((areaName, rIdx) => {
              const row = data.matrix[rIdx] || [];
              const rowTot = data.row_totals ? data.row_totals[rIdx] : row.reduce((a, b) => a + b, 0);
              const isHighlight = rowTot === 43; // Southwest Block 24 highest
              return (
                <tr key={areaName} className="hover:bg-slate-800/30">
                  <td className="text-left py-2.5 px-3 font-medium text-slate-200 text-xs">
                    {areaName}
                  </td>
                  {row.map((val, cIdx) => (
                    <td key={cIdx} className="p-1">
                      <div className={`w-8 h-8 mx-auto flex items-center justify-center rounded border text-xs font-mono transition-transform hover:scale-110 ${getCellColor(val)}`}>
                        {val}
                      </div>
                    </td>
                  ))}
                  <td className="py-2.5 px-3 font-mono font-bold bg-slate-900/80">
                    <span className={isHighlight ? 'text-amber-400 font-extrabold' : 'text-slate-200'}>
                      {rowTot}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-3">
        <div className="flex items-center gap-2">
          <span>Incident Intensity:</span>
          <span className="w-4 h-4 rounded bg-slate-900 border border-slate-700 inline-block text-center text-[10px]">0</span>
          <span className="w-4 h-4 rounded bg-amber-950/60 border border-amber-900 inline-block text-center text-[10px]">1-2</span>
          <span className="w-4 h-4 rounded bg-amber-800/60 border border-amber-700 inline-block text-center text-[10px]">3-4</span>
          <span className="w-4 h-4 rounded bg-rose-700/80 border border-rose-600 inline-block text-center text-[10px]">5+</span>
        </div>
        <span className="italic">Note: False-positive detections corrected per SOP-SR §7 excluded.</span>
      </div>
    </div>
  );
};
