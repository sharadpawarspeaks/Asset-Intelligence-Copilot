import React from 'react';
import { Settings as SettingsIcon, Server, Cpu, Database, ShieldCheck } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="p-6 h-full overflow-y-auto text-slate-100 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-sky-400" />
            System Architecture & Configuration
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Engine configurations, security parameters, AI providers, and database settings.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Core Architecture */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
            <Server className="w-4 h-4" /> Stack Specifications
          </h3>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
              <span className="text-slate-500 text-[10px] uppercase font-mono block">Backend Framework</span>
              <span className="text-slate-200 font-bold mt-0.5 block">FastAPI 0.143 (Python 3.14)</span>
            </div>
            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
              <span className="text-slate-500 text-[10px] uppercase font-mono block">Database Storage</span>
              <span className="text-slate-200 font-bold mt-0.5 block">SQLite / PostgreSQL + pgvector</span>
            </div>
            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
              <span className="text-slate-500 text-[10px] uppercase font-mono block">Frontend Runtime</span>
              <span className="text-slate-200 font-bold mt-0.5 block">React 19 + TypeScript + Vite + Tailwind</span>
            </div>
            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
              <span className="text-slate-500 text-[10px] uppercase font-mono block">AI Orchestrator</span>
              <span className="text-emerald-400 font-bold mt-0.5 block">Autonomous Tool Calling + Hybrid RAG</span>
            </div>
          </div>
        </div>

        {/* Operational Limits */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 shadow-xl space-y-3">
          <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Domain Rule Thresholds
          </h3>
          <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
            <li><strong>T200 Production Threshold:</strong> Wellhead temperature ≥ 15.0°C above ambient air temperature.</li>
            <li><strong>T350 Production Threshold:</strong> Wellhead temperature ≥ 20.0°C above ambient air temperature.</li>
            <li><strong>Downtime Rule:</strong> Each inspection below threshold = 7 days downtime. Missed inspections = 0 days.</li>
            <li><strong>Spill Reporting (SR-01):</strong> Spills ≥ 5.0 bbl must be filed in writing within 24 hours of discovery.</li>
            <li><strong>Containment Limit (SR-02):</strong> Release source stopped and contained within 4.0 hours of discovery.</li>
            <li><strong>RCA Escalation (Manual §10):</strong> 3 corrective repairs on same equipment kind within 12 months requires root-cause analysis before closure.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
