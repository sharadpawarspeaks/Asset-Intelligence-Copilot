import React, { useEffect, useState } from 'react';
import { fetchSharedKnowledge, addSharedKnowledge } from '../../api/client';
import { Share2, Plus, Clock, User, AlertCircle, CheckCircle } from 'lucide-react';

interface Props {
  currentUserId: string;
}

export const SharedKnowledgePage: React.FC<Props> = ({ currentUserId }) => {
  const [data, setData] = useState<any>({ shared_knowledge: [], context_notes: [] });
  const [showAddModal, setShowAddModal] = useState(false);
  const [wellId, setWellId] = useState('');
  const [statement, setStatement] = useState('');
  const [validFrom, setValidFrom] = useState('2026-10-17');
  const [validTo, setValidTo] = useState('2026-10-27');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchSharedKnowledge();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async () => {
    if (!statement.trim()) return;
    try {
      await addSharedKnowledge({
        asset_id: wellId ? wellId.toUpperCase() : undefined,
        statement,
        author_user_id: currentUserId,
        valid_from: validFrom,
        valid_to: validTo
      });
      setShowAddModal(false);
      setStatement('');
      setWellId('');
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 h-full overflow-y-auto text-slate-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Share2 className="w-5 h-5 text-sky-400" />
            Shared Well Knowledge
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Global operational context, planned shutdowns, and workover schedules shared across all team members and conversations.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md"
        >
          <Plus className="w-4 h-4" /> Share Operational Fact
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading shared operational records...</div>
      ) : (
        <div className="space-y-6">
          {/* Active Shared Knowledge Section */}
          <div>
            <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-3">
              Active Shared Knowledge ({data.shared_knowledge.length} active notes)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.shared_knowledge.map((sk: any) => (
                <div key={sk.id} className="glass-card p-4 rounded-xl border border-slate-800 shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sky-400 text-sm font-mono">
                      {sk.asset_id || 'Fleet-wide Scope'}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed mb-3">
                    "{sk.statement}"
                  </p>
                  <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {sk.author_name}</span>
                    <span className="flex items-center gap-1 font-mono text-slate-500">
                      <Clock className="w-3.5 h-3.5" /> {sk.valid_from} → {sk.valid_to || 'Ongoing'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Context Notes from Dataset */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Historical Field Notes & Feedback (assets/context.jsonl)
            </h3>
            <div className="space-y-2">
              {data.context_notes.slice(0, 15).map((cn: any) => (
                <div key={cn.note_id} className="glass-card p-3 rounded-lg border border-slate-800/80 flex items-start justify-between text-xs text-slate-300">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sky-400 font-mono">{cn.asset_id}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">{cn.note_type}</span>
                      <span className="text-[11px] text-slate-500">by {cn.author_name} ({cn.created_at.slice(0, 10)})</span>
                    </div>
                    <p className="text-slate-200">{cn.text}</p>
                  </div>
                  {cn.is_unconfirmed && (
                    <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 shrink-0">
                      Unconfirmed Claim
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Share New Operational Knowledge</h3>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Target Well ID (optional, leave blank for fleet)</label>
                <input
                  type="text"
                  placeholder="e.g. WELL-0007"
                  value={wellId}
                  onChange={e => setWellId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Operational Statement</label>
                <textarea
                  rows={3}
                  placeholder="e.g. WELL-0007 will be shut in from 17 Oct for a 10-day planned workover."
                  value={statement}
                  onChange={e => setStatement(e.target.value)}
                  className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Valid From</label>
                  <input
                    type="date"
                    value={validFrom}
                    onChange={e => setValidFrom(e.target.value)}
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Valid To</label>
                  <input
                    type="date"
                    value={validTo}
                    onChange={e => setValidTo(e.target.value)}
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold"
              >
                Publish to Shared Knowledge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
