import React, { useState } from 'react';
import { StatusCardData, Citation } from '../../types';
import { Activity, AlertTriangle, CheckCircle, Clock, Thermometer, User, ShieldAlert, ChevronDown, ChevronUp, FileText } from 'lucide-react';

interface Props {
  data: StatusCardData;
  onSelectWell?: (wellId: string) => void;
}

export const StatusCard: React.FC<Props> = ({ data, onSelectWell }) => {
  const [showEvidence, setShowEvidence] = useState(false);

  const isProd = data.is_producing;
  const statusColor = isProd ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-red-400 bg-red-500/10 border-red-500/30';
  const badgeDot = isProd ? 'bg-emerald-400 status-dot-green' : 'bg-red-400 status-dot-red';

  return (
    <div className="rounded-xl glass-card border border-slate-700/60 p-5 shadow-2xl my-3 text-slate-100 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-700/60 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 
              onClick={() => onSelectWell && onSelectWell(data.asset_id)}
              className="text-xl font-bold text-sky-400 cursor-pointer hover:underline flex items-center gap-1.5"
            >
              {data.asset_id}
              {data.name && <span className="text-sm font-normal text-slate-400">({data.name})</span>}
            </h3>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-800 text-slate-300 border border-slate-700">
              {data.well_type}
            </span>
            {data.area_name && (
              <span className="text-xs text-slate-400 font-medium">
                • {data.area_name}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Inspected: {data.latest_inspected_at?.slice(0, 10)}</span>
            <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {data.inspector_name} ({data.method})</span>
          </p>
        </div>

        {/* Status Pill */}
        <div className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 ${statusColor}`}>
          <span className={`w-2 h-2 rounded-full ${badgeDot}`} />
          {isProd ? 'PRODUCING OIL' : 'NOT PRODUCING'}
        </div>
      </div>

      {/* Out of date warning */}
      {data.recorded_status_out_of_date && (
        <div className="mt-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            <strong>Status Conflict:</strong> Recorded system status still indicates <code>{data.recorded_status}</code>, which is <strong>out of date</strong> compared to physical inspection readings.
          </span>
        </div>
      )}

      {/* Thermal Readings Grid */}
      <div className="grid grid-cols-4 gap-2 mt-4 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
        <div>
          <span className="text-[11px] text-slate-400 block uppercase tracking-wider">Wellhead Temp</span>
          <span className="text-lg font-bold text-slate-100 flex items-center gap-1 mt-0.5">
            <Thermometer className="w-4 h-4 text-rose-400" /> {data.wellhead_temp_c.toFixed(1)}°C
          </span>
        </div>
        <div>
          <span className="text-[11px] text-slate-400 block uppercase tracking-wider">Ambient Air</span>
          <span className="text-lg font-bold text-slate-200 mt-0.5 block">
            {data.ambient_temp_c.toFixed(1)}°C
          </span>
        </div>
        <div>
          <span className="text-[11px] text-slate-400 block uppercase tracking-wider">Difference</span>
          <span className={`text-lg font-bold mt-0.5 block ${data.temp_difference >= data.applicable_threshold_c ? 'text-emerald-400' : 'text-rose-400'}`}>
            +{data.temp_difference.toFixed(1)}°C
          </span>
        </div>
        <div>
          <span className="text-[11px] text-slate-400 block uppercase tracking-wider">Threshold</span>
          <span className="text-lg font-bold text-sky-400 mt-0.5 block">
            ≥ {data.applicable_threshold_c.toFixed(1)}°C
          </span>
        </div>
      </div>

      {/* Operational Context & Reason */}
      {data.reason && (
        <div className="mt-4 p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
          <span className="text-xs font-semibold text-slate-300 block mb-1">
            Operational Reason & Context:
          </span>
          <p className="text-sm text-slate-300 leading-relaxed">
            {data.reason}
          </p>
        </div>
      )}

      {/* Citations Accordion */}
      {data.citations && data.citations.length > 0 && (
        <div className="mt-3 border-t border-slate-800 pt-2">
          <button
            onClick={() => setShowEvidence(!showEvidence)}
            className="flex items-center justify-between w-full text-xs text-sky-400 hover:text-sky-300 font-medium py-1"
          >
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> {data.citations.length} Supporting Evidence Records
            </span>
            {showEvidence ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showEvidence && (
            <div className="mt-2 space-y-2">
              {data.citations.map((c, i) => (
                <div key={i} className="text-xs bg-slate-900/80 p-2.5 rounded border border-slate-800 text-slate-300">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span className="font-mono text-sky-300 font-semibold">{c.source_type.toUpperCase()}: {c.source_id}</span>
                    {c.source_file && <span className="font-mono text-slate-500">{c.source_file}</span>}
                  </div>
                  <p className="italic text-slate-300">{c.excerpt}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
