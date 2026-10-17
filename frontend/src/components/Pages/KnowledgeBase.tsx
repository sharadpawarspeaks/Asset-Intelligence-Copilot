import React, { useState } from 'react';
import { fetchDocuments } from '../../api/client';
import { BookOpen, Search, FileText, CheckCircle2 } from 'lucide-react';

export const KnowledgeBase: React.FC = () => {
  const [query, setQuery] = useState('');
  const [docType, setDocType] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetchDocuments(query, docType || undefined);
      setResults(res.results || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 h-full overflow-y-auto text-slate-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-sky-400" />
            Knowledge Base & RAG Index
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Search operational manuals (T200, T350), company SOPs (Spill Response, Compliance, Field Work), and 1,500+ free-text repair reports.
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="glass-panel p-4 rounded-xl mb-6 flex gap-3 border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search manuals, SOPs, containment times, root causes (e.g. 'spill reporting 24 hours', 'coupling corrosion')..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>

        <select
          value={docType}
          onChange={e => setDocType(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none cursor-pointer"
        >
          <option value="">All Document Types</option>
          <option value="manual">Operating Manuals (T200, T350)</option>
          <option value="sop">SOPs (SR, RC, WS)</option>
          <option value="repair_report">Corrective Repair Reports</option>
        </select>

        <button
          onClick={handleSearch}
          className="px-5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold"
        >
          Search Index
        </button>
      </div>

      {/* Preset Common Search Chips */}
      <div className="flex flex-wrap items-center gap-2 mb-6 text-xs text-slate-400">
        <span>Suggested queries:</span>
        {['SR-01 spill report deadline', 'T200 production temperature rule', 'flowline pressure test 4 hours', 'pump jack root-cause analysis'].map((q, idx) => (
          <button
            key={idx}
            onClick={() => { setQuery(q); setTimeout(handleSearch, 50); }}
            className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-sky-300 text-[11px]"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Results List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Searching 14,500+ document passages...</div>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          {results.map((r, i) => (
            <div key={i} className="glass-card p-5 rounded-xl border border-slate-800 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-sky-400 font-mono">
                  [{r.doc_type.toUpperCase()}] {r.title || r.doc_id}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {r.source_path} • Relevance Score: {r.score}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-white mb-2">{r.section}</h4>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans bg-slate-900/60 p-3 rounded border border-slate-800">
                {r.content}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500 text-xs">
          Enter a search query to retrieve passages with exact citations from the indexed documents.
        </div>
      )}
    </div>
  );
};
