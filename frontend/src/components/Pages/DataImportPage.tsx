import React, { useEffect, useState } from 'react';
import { fetchIngestionRuns, triggerIngestion } from '../../api/client';
import { Database, RefreshCw, CheckCircle, Clock, AlertTriangle, FolderGit2 } from 'lucide-react';

export const DataImportPage: React.FC = () => {
  const [runs, setRuns] = useState<any[]>([]);
  const [customPath, setCustomPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [lastReport, setLastReport] = useState<any | null>(null);

  const loadRuns = async () => {
    setLoading(true);
    try {
      const res = await fetchIngestionRuns();
      setRuns(res || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRuns();
  }, []);

  const handleIngest = async () => {
    setIngesting(true);
    try {
      const res = await triggerIngestion(customPath || undefined);
      setLastReport(res);
      loadRuns();
    } catch (e) {
      console.error(e);
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div className="p-6 h-full overflow-y-auto text-slate-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-sky-400" />
            Data Ingestion & Dataset Readiness
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic ingestion pipeline ready to load new well directories, updated JSONL files, and the final test dataset without application code changes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ingest Control Panel */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 shadow-xl lg:col-span-1 space-y-4">
          <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider">
            Run Ingestion Pipeline
          </h3>
          <p className="text-xs text-slate-300">
            Discovers well assets, parses weekly inspections, indexes repair reports into RAG chunks, and calculates baseline operational state.
          </p>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Custom Dataset Directory Path (Optional)</label>
            <input
              type="text"
              placeholder="./sample-data/sample-data or ./test-dataset"
              value={customPath}
              onChange={e => setCustomPath(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:border-sky-500"
            />
          </div>

          <button
            onClick={handleIngest}
            disabled={ingesting}
            className="w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${ingesting ? 'animate-spin' : ''}`} />
            {ingesting ? 'Processing Ingestion Pipeline...' : 'Execute Data Ingestion'}
          </button>

          {/* Last Report Status */}
          {lastReport && (
            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-xs space-y-1.5">
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Ingestion Finished
              </span>
              <div className="text-[11px] text-slate-300 font-mono">
                <div>• Imported: {lastReport.records_imported} records</div>
                <div>• Wells Discovered: {lastReport.wells_count}</div>
                <div>• Duplicates Skipped: {lastReport.duplicates_skipped}</div>
                <div>• Reports Indexed: {lastReport.reports_count}</div>
                <div>• RAG Chunks Created: {lastReport.document_chunks_count}</div>
              </div>
            </div>
          )}
        </div>

        {/* Ingestion Runs History */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 shadow-xl lg:col-span-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Ingestion Runs Audit History
          </h3>

          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 font-semibold uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-3">Run ID</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Imported</th>
                  <th className="p-3">Duplicates</th>
                  <th className="p-3">Errors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                {runs.map(r => (
                  <tr key={r.run_id} className="hover:bg-slate-800/40">
                    <td className="p-3 text-sky-400 font-bold">{r.run_id}</td>
                    <td className="p-3 text-slate-400">{r.started_at?.slice(0, 19).replace('T', ' ')}</td>
                    <td className="p-3">
                      <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-500/30">
                        {r.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-slate-200">{r.records_imported}</td>
                    <td className="p-3 text-slate-400">{r.duplicates_skipped}</td>
                    <td className="p-3 text-slate-400">{r.errors_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
