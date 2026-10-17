import React, { useEffect, useState } from 'react';
import { fetchMaintenanceAnalytics } from '../../api/client';
import { Wrench, DollarSign, Layers, PieChart } from 'lucide-react';

export const RepairAnalysis: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMaintenanceAnalytics(2026).then(res => {
      setData(res);
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-6 h-full overflow-y-auto text-slate-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-sky-400" />
            Repair & Maintenance Analysis
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Analyzing corrective vs scheduled expenditures, equipment failure distributions, and workover trends.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading repair expenditures...</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Total 2026 Repair Cost</span>
              <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
                ${(data?.total_cost || 0).toLocaleString()}
              </div>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Corrective Repairs</span>
              <div className="text-2xl font-bold text-rose-400 font-mono mt-1">
                ${(data?.by_type?.corrective || 0).toLocaleString()}
              </div>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Scheduled Maintenance</span>
              <div className="text-2xl font-bold text-sky-400 font-mono mt-1">
                ${(data?.by_type?.scheduled || 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Breakdown by Equipment Kind */}
          <div className="glass-panel p-5 rounded-xl border border-slate-800 shadow-xl">
            <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-3">
              Expenditure by Equipment Category (2026)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(data?.by_equipment || {}).map(([eq, cost]: [string, any]) => (
                <div key={eq} className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                  <span className="text-xs text-slate-400 uppercase font-semibold block">{eq.replace('_', ' ')}</span>
                  <span className="text-base font-bold text-white font-mono mt-1 block">${cost.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
