import React, { useEffect, useState } from 'react';
import { WellItem, Area } from '../../types';
import { fetchWells, fetchWellDetails } from '../../api/client';
import { Search, Filter, Compass, Thermometer, Clock, X, AlertTriangle } from 'lucide-react';
import { StatusCard } from '../Chat/StatusCard';

interface Props {
  areas: Area[];
  onAskAboutWell?: (wellId: string) => void;
  selectedWellId?: string | null;
  onClearSelectedWell?: () => void;
}

export const WellExplorer: React.FC<Props> = ({ areas, onAskAboutWell, selectedWellId, onClearSelectedWell }) => {
  const [wells, setWells] = useState<WellItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [search, setSearch] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeWellDetail, setActiveWellDetail] = useState<any | null>(null);

  const loadWells = async () => {
    setLoading(true);
    try {
      const res = await fetchWells({
        area_id: selectedArea || undefined,
        well_type: selectedType || undefined,
        search: search || undefined,
        limit: 100
      });
      setWells(res.items);
      setTotalCount(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWells();
  }, [selectedArea, selectedType]);

  useEffect(() => {
    if (selectedWellId) {
      fetchWellDetails(selectedWellId).then(res => setActiveWellDetail(res));
    }
  }, [selectedWellId]);

  const viewWellDetail = async (wellId: string) => {
    const res = await fetchWellDetails(wellId);
    setActiveWellDetail(res);
  };

  const filteredWells = wells.filter(w => {
    if (!selectedStatus) return true;
    if (selectedStatus === 'producing') return w.is_producing;
    if (selectedStatus === 'not_producing') return !w.is_producing;
    return true;
  });

  return (
    <div className="p-6 h-full overflow-y-auto text-slate-100">
      {/* Page Title */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-sky-400" />
            Well Explorer
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time thermal production status, physical readings, and metadata across {totalCount} oil wells.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel p-4 rounded-xl mb-6 flex flex-wrap items-center gap-3 border border-slate-800">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Well ID (e.g. WELL-0001)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadWells()}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>

        <select
          value={selectedArea}
          onChange={e => setSelectedArea(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none cursor-pointer"
        >
          <option value="">All Geographic Areas</option>
          {areas.map(a => (
            <option key={a.area_id} value={a.area_id}>{a.name} ({a.area_id})</option>
          ))}
        </select>

        <select
          value={selectedType}
          onChange={e => setSelectedType(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none cursor-pointer"
        >
          <option value="">All Well Types</option>
          <option value="T200">T200 Rod-Lift (≥15°C)</option>
          <option value="T350">T350 Deep Rod-Lift (≥20°C)</option>
        </select>

        <select
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none cursor-pointer"
        >
          <option value="">All Operational Statuses</option>
          <option value="producing">Producing Oil</option>
          <option value="not_producing">Not Producing</option>
        </select>

        <button
          onClick={loadWells}
          className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold"
        >
          Search
        </button>
      </div>

      {/* Grid of Wells */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading wells operational data...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredWells.map(w => (
            <div
              key={w.asset_id}
              onClick={() => viewWellDetail(w.asset_id)}
              className="glass-card p-4 rounded-xl border border-slate-800 hover:border-sky-500/50 transition-all cursor-pointer shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-sky-400 text-sm">{w.asset_id}</h4>
                  <span className="text-[11px] text-slate-400">{w.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono font-semibold text-slate-300">
                    {w.well_type}
                  </span>
                  <span className={`w-2.5 h-2.5 rounded-full ${w.is_producing ? 'bg-emerald-400 status-dot-green' : 'bg-red-400 status-dot-red'}`} />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs bg-slate-900/60 p-2 rounded border border-slate-800/80">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Status</span>
                  <span className={`font-semibold ${w.is_producing ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {w.is_producing ? 'Producing' : 'Not Producing'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Thermal Diff</span>
                  <span className="font-mono font-bold text-slate-200">
                    {w.temp_difference !== undefined ? `+${w.temp_difference}°C` : '-'}
                  </span>
                </div>
              </div>

              {w.recorded_status_out_of_date && (
                <div className="mt-2 text-[10px] text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  <AlertTriangle className="w-3 h-3" /> Recorded status out of date
                </div>
              )}

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>Area: {w.area_id}</span>
                <span className="text-sky-400 hover:underline">View Details →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Well Detail Modal */}
      {activeWellDetail && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Well Details: <span className="text-sky-400">{activeWellDetail.metadata.asset_id}</span>
              </h3>
              <button
                onClick={() => {
                  setActiveWellDetail(null);
                  if (onClearSelectedWell) onClearSelectedWell();
                }}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status card view */}
            {activeWellDetail.status_card && (
              <StatusCard data={activeWellDetail.status_card} />
            )}

            {/* Equipment installed */}
            <div className="mt-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Installed Equipment</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {activeWellDetail.equipment.map((e: any) => (
                  <div key={e.id} className="p-2 rounded bg-slate-800/50 border border-slate-700/60 text-slate-300">
                    <span className="font-semibold text-sky-400 uppercase text-[10px] block">{e.kind}</span>
                    <span className="font-mono text-slate-200">{e.model || 'Standard'}</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{e.id}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ask Copilot Button */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => {
                  if (onAskAboutWell) {
                    onAskAboutWell(`Is ${activeWellDetail.metadata.asset_id} producing oil right now? Show me its status card.`);
                  }
                  setActiveWellDetail(null);
                }}
                className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold"
              >
                Ask Copilot in Chat →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
