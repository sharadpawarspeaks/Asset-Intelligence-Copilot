import React, { useEffect, useState } from 'react';
import { fetchDowntimeAnalytics, fetchMaintenanceAnalytics, fetchRcaRequirements } from '../../api/client';
import { Area } from '../../types';
import { BarChart3, Clock, DollarSign, Wrench, AlertTriangle } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell
} from 'recharts';

interface Props {
  areas: Area[];
  onSelectWell?: (wellId: string) => void;
}

export const OperationsAnalytics: React.FC<Props> = ({ areas, onSelectWell }) => {
  const [selectedArea, setSelectedArea] = useState('NE-07');
  const [downtimeData, setDowntimeData] = useState<any | null>(null);
  const [maintenanceData, setMaintenanceData] = useState<any | null>(null);
  const [rcaData, setRcaData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [selectedArea]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [dt, mx, rca] = await Promise.all([
        fetchDowntimeAnalytics(selectedArea),
        fetchMaintenanceAnalytics(2026),
        fetchRcaRequirements(selectedArea, 'pump_jack')
      ]);
      setDowntimeData(dt);
      setMaintenanceData(mx);
      setRcaData(rca);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const colors = ['#38bdf8', '#0284c7', '#0369a1', '#64748b'];

  return (
    <div className="p-6 h-full overflow-y-auto text-slate-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-400" />
            Operations Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Inspection-based downtime calculations, repair expenditures, and equipment failure escalation rules.
          </p>
        </div>

        {/* Area Picker */}
        <select
          value={selectedArea}
          onChange={e => setSelectedArea(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none cursor-pointer"
        >
          {areas.map(a => (
            <option key={a.area_id} value={a.area_id}>{a.name} ({a.area_id})</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading analytics engines...</div>
      ) : (
        <div className="space-y-6">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-sky-400" /> Top Downtime (4 Months)
              </span>
              <div className="mt-2 text-2xl font-bold text-white font-mono">
                {downtimeData?.top_wells?.[0]?.downtime_days || 0} <span className="text-xs text-slate-400 font-normal">days</span>
              </div>
              <span className="text-[11px] text-sky-400 font-mono mt-1 block">
                {downtimeData?.top_wells?.[0]?.asset_id} ({downtimeData?.top_wells?.[0]?.well_type})
              </span>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                <DollarSign className="w-4 h-4 text-emerald-400" /> Total 2026 Repair Spend
              </span>
              <div className="mt-2 text-2xl font-bold text-emerald-400 font-mono">
                ${(maintenanceData?.total_cost || 0).toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Across {maintenanceData?.total_jobs || 0} maintenance events
              </span>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> RCA Required Wells
              </span>
              <div className="mt-2 text-2xl font-bold text-amber-400 font-mono">
                {rcaData?.wells?.length || 0} <span className="text-xs text-slate-400 font-normal">wells</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                ≥ 3 corrective repairs on pump jack (12M)
              </span>
            </div>
          </div>

          {/* Downtime Ranking Chart */}
          <div className="glass-panel p-5 rounded-xl border border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold text-sky-400 uppercase tracking-wider mb-1">
              Top Downtime Wells ({selectedArea} • Last 4 Months)
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Downtime is calculated under the 7-day weekly inspection rule. Missed inspections add 0 days.
            </p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={downtimeData?.top_wells?.slice(0, 8) || []} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="asset_id" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit=" d" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(val: any) => [`${val} days (${Number(val)/7} inspections × 7d)`, 'Downtime']}
                  />
                  <Bar dataKey="downtime_days" radius={[4, 4, 0, 0]}>
                    {(downtimeData?.top_wells || []).map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={colors[index % colors.length]}
                        className="cursor-pointer hover:opacity-80"
                        onClick={() => onSelectWell && onSelectWell(entry.asset_id)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RCA Requirements Table */}
          <div className="glass-panel p-5 rounded-xl border border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-400" />
              Pump Jack Root-Cause Analysis (RCA) Escalation List
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Section 10 of well-type manuals requires an RCA before closing repairs when an equipment kind suffers repetitive failures.
            </p>

            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 font-semibold uppercase text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">Well ID</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">12M Corrective Repairs</th>
                    <th className="p-3">Applicable Threshold</th>
                    <th className="p-3">Governing Rule</th>
                    <th className="p-3">Action Required</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                  {(rcaData?.wells || []).map((w: any) => (
                    <tr key={w.asset_id} className="hover:bg-slate-800/40">
                      <td 
                        onClick={() => onSelectWell && onSelectWell(w.asset_id)}
                        className="p-3 text-sky-400 font-bold cursor-pointer hover:underline"
                      >
                        {w.asset_id}
                      </td>
                      <td className="p-3">{w.well_type}</td>
                      <td className="p-3 text-rose-400 font-bold">{w.repair_count} repairs</td>
                      <td className="p-3">≥ {w.threshold} repairs</td>
                      <td className="p-3 text-slate-400">{w.is_custom_rule ? 'User-provided rule' : 'Manual §10'}</td>
                      <td className="p-3 text-amber-300 font-semibold">Initiate Root-Cause Analysis</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
