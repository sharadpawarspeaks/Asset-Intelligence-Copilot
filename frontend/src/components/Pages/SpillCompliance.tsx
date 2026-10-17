import React, { useEffect, useState } from 'react';
import { fetchSpillHeatmap, fetchSpills } from '../../api/client';
import { HeatmapVisual } from '../Chat/HeatmapVisual';
import { ShieldAlert, AlertTriangle, CheckCircle2, FileText } from 'lucide-react';

export const SpillCompliance: React.FC = () => {
  const [heatmapData, setHeatmapData] = useState<any | null>(null);
  const [spillsData, setSpillsData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchSpillHeatmap(2026),
      fetchSpills(undefined, '2026-07-18', '2026-10-16')
    ]).then(([hm, sp]) => {
      setHeatmapData(hm);
      setSpillsData(sp);
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-6 h-full overflow-y-auto text-slate-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            Spill & Regulatory Compliance
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tracking crude release detections, reporting deadlines (SR-01), 4-hour containment limits (SR-02), and agency verifications (SR-03).
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading compliance data...</div>
      ) : (
        <div className="space-y-6">
          {/* SOP Protocols Rule Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-panel p-3.5 rounded-xl border border-slate-800">
              <span className="text-xs font-mono font-bold text-sky-400 block">SR-01 • Written Notice</span>
              <p className="text-xs text-slate-300 mt-1">
                Spills ≥ 5 bbl require written notice to the State Oil & Gas Commission within <strong>24 hours</strong> of discovery.
              </p>
            </div>
            <div className="glass-panel p-3.5 rounded-xl border border-slate-800">
              <span className="text-xs font-mono font-bold text-amber-400 block">SR-02 • Containment Limit</span>
              <p className="text-xs text-slate-300 mt-1">
                Source must be stopped and release contained within <strong>4 hours</strong> of discovery time.
              </p>
            </div>
            <div className="glass-panel p-3.5 rounded-xl border border-slate-800">
              <span className="text-xs font-mono font-bold text-emerald-400 block">SR-03 • Remediation</span>
              <p className="text-xs text-slate-300 mt-1">
                Soil cleaned to ≤ 1.0% TPH; reportable spills require official agency verification within <strong>60 days</strong>.
              </p>
            </div>
            <div className="glass-panel p-3.5 rounded-xl border border-slate-800">
              <span className="text-xs font-mono font-bold text-purple-400 block">RC-04 • NOV Response</span>
              <p className="text-xs text-slate-300 mt-1">
                Agency Notices of Violation must be formally answered within <strong>30 days</strong> of issuance.
              </p>
            </div>
          </div>

          {/* Heatmap Section */}
          {heatmapData && (
            <div className="glass-panel p-5 rounded-xl border border-slate-800 shadow-xl">
              <HeatmapVisual data={heatmapData} />
            </div>
          )}

          {/* Recent Spills Log */}
          <div className="glass-panel p-5 rounded-xl border border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold text-sky-400 uppercase tracking-wider mb-2">
              Recent Confirmed Spills (Last 90 Days)
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Effective volume reflects accepted field re-measurements. False positive detections have been excluded.
            </p>

            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 font-semibold uppercase text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">Well ID</th>
                    <th className="p-3">Discovery Date</th>
                    <th className="p-3">Volume</th>
                    <th className="p-3">Classification</th>
                    <th className="p-3">External Report Duty</th>
                    <th className="p-3">Inspection ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                  {(spillsData?.spills || []).map((s: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="p-3 text-sky-400 font-bold">{s.asset_id}</td>
                      <td className="p-3">{s.date}</td>
                      <td className="p-3 text-rose-400 font-bold">{s.spill_est_volume_bbl} bbl</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          s.classification === 'Reportable' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {s.classification}
                        </span>
                      </td>
                      <td className="p-3">
                        {s.is_reportable ? (
                          <span className="text-rose-400 font-semibold">Yes (SR-01, 24h deadline)</span>
                        ) : (
                          <span className="text-slate-400">Internal cleanup only</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-500">{s.inspection_id}</td>
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
