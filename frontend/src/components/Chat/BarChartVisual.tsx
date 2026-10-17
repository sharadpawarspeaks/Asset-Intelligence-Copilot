import React from 'react';
import { BarChartData } from '../../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid
} from 'recharts';

interface Props {
  data: BarChartData;
  onSelectWell?: (wellId: string) => void;
}

export const BarChartVisual: React.FC<Props> = ({ data, onSelectWell }) => {
  const colors = ['#38bdf8', '#0284c7', '#0369a1', '#64748b'];

  return (
    <div className="rounded-xl glass-card border border-slate-700/60 p-5 shadow-xl my-3 text-slate-100 max-w-2xl">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <h4 className="text-sm font-bold text-sky-400 uppercase tracking-wider">
          {data.title}
        </h4>
        <span className="text-xs text-slate-400 font-mono">
          Unit: {data.unit || 'days'}
        </span>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.data} margin={{ top: 15, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey={data.x_axis_key || 'asset_id'}
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              unit={` ${data.unit || 'd'}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              formatter={(val: any) => [`${val} ${data.unit || 'days'}`, 'Downtime']}
            />
            <Bar dataKey={data.y_axis_key || 'value'} radius={[4, 4, 0, 0]}>
              {data.data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => onSelectWell && onSelectWell(entry.asset_id)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {data.data.map((item, idx) => (
          <div
            key={idx}
            onClick={() => onSelectWell && onSelectWell(item.asset_id)}
            className="p-2 bg-slate-900/60 border border-slate-800 rounded text-center cursor-pointer hover:border-sky-500/50"
          >
            <span className="text-xs text-slate-400 font-mono block">Rank #{idx + 1}</span>
            <span className="text-sm font-bold text-sky-400">{item.asset_id}</span>
            <span className="text-xs font-semibold text-slate-200 block mt-0.5">{item.value} {data.unit || 'days'}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
