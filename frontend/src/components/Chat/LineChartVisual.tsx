import React from 'react';
import { LineChartData } from '../../types';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine
} from 'recharts';

interface Props {
  data: LineChartData;
}

export const LineChartVisual: React.FC<Props> = ({ data }) => {
  const nonProdSet = new Set(data.non_producing_dates || []);

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (nonProdSet.has(payload.date)) {
      return (
        <circle
          cx={cx}
          cy={cy}
          r={5}
          fill="#ef4444"
          stroke="#ffffff"
          strokeWidth={1.5}
        />
      );
    }
    return <circle cx={cx} cy={cy} r={3} fill="#38bdf8" />;
  };

  return (
    <div className="rounded-xl glass-card border border-slate-700/60 p-5 shadow-xl my-3 text-slate-100 max-w-2xl">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
        <h4 className="text-sm font-bold text-sky-400 uppercase tracking-wider">
          {data.title}
        </h4>
        {data.non_producing_dates && data.non_producing_dates.length > 0 && (
          <span className="text-xs text-rose-400 font-semibold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            {data.non_producing_dates.length} non-producing inspection(s) marked
          </span>
        )}
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey={data.x_axis_key || 'date'}
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              tickFormatter={val => String(val).slice(5)}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              unit="°C"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              formatter={(value: any, name: any) => [`${value}°C`, name]}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
            
            {data.series.map(s => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={2}
                dot={s.key === 'wellhead_temp_c' ? <CustomDot /> : { r: 2 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded border border-slate-800">
        <span>🔴 Red dots: Inspection thermal difference below operational threshold (Not Producing).</span>
        <span>Operational threshold: {data.threshold ? `+${data.threshold}°C above air` : '15.0°C / 20.0°C'}</span>
      </div>
    </div>
  );
};
