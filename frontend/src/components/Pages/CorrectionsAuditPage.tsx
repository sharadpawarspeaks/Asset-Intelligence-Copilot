import React, { useEffect, useState } from 'react';
import { fetchCorrections, proposeCorrection, proposeTypeRule } from '../../api/client';
import { ClipboardList, Plus, AlertTriangle, CheckCircle, ShieldAlert, Sliders } from 'lucide-react';

interface Props {
  currentUserId: string;
}

export const CorrectionsAuditPage: React.FC<Props> = ({ currentUserId }) => {
  const [data, setData] = useState<any>({ corrections: [], type_rules: [] });
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Correction form
  const [targetId, setTargetId] = useState('INS-0164-0205');
  const [targetField, setTargetField] = useState('wellhead_temp_c');
  const [correctedValue, setCorrectedValue] = useState('41.0');
  const [reason, setReason] = useState('Faulty handheld thermal gun; field crew measured 41.0°C.');

  // Type Rule form
  const [ruleType, setRuleType] = useState('T350');
  const [paramValue, setParamValue] = useState('2');
  const [ruleReason, setRuleReason] = useState('Team policy: pump jack RCA after 2 repairs.');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchCorrections();
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

  const handleProposeCorrection = async () => {
    try {
      await proposeCorrection({
        target_table: 'inspections',
        target_id: targetId,
        target_field: targetField,
        corrected_value: correctedValue,
        reason,
        author_user_id: currentUserId
      });
      setShowCorrectionModal(false);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleProposeRule = async () => {
    try {
      await proposeTypeRule({
        well_type: ruleType,
        rule_name: 'pump_jack_rca_repairs_threshold',
        parameter_name: 'pump_jack_rca_repairs_threshold',
        parameter_value: paramValue,
        reason: ruleReason,
        author_user_id: currentUserId
      });
      setShowRuleModal(false);
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
            <ClipboardList className="w-5 h-5 text-sky-400" />
            Corrections & Audit Log
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Complete provenance trail of raw sensor overrides, AI analysis corrections, and operational type rules. Original readings are preserved immutably.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRuleModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold"
          >
            <Sliders className="w-4 h-4 text-sky-400" /> New Type Rule
          </button>
          <button
            onClick={() => setShowCorrectionModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md"
          >
            <Plus className="w-4 h-4" /> Propose Data Correction
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading audit log...</div>
      ) : (
        <div className="space-y-6">
          {/* User Operational Type Rules */}
          <div className="glass-panel p-5 rounded-xl border border-slate-800 shadow-xl">
            <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Sliders className="w-4 h-4" />
              Active Type-Specific Operational Rules
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              User-provided rules apply strictly to the designated well type and never modify other types or the underlying manual itself.
            </p>

            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 font-semibold uppercase text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">Target Well Type</th>
                    <th className="p-3">Rule Name</th>
                    <th className="p-3">Parameter Value</th>
                    <th className="p-3">Author</th>
                    <th className="p-3">Reason</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                  {data.type_rules.length === 0 ? (
                    <tr><td colSpan={6} className="p-4 text-center text-slate-500">No custom type rules active. Default manual thresholds govern all calculations.</td></tr>
                  ) : (
                    data.type_rules.map((r: any) => (
                      <tr key={r.rule_id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-sky-400">{r.well_type}</td>
                        <td className="p-3">{r.rule_name}</td>
                        <td className="p-3 font-bold text-emerald-400">{r.parameter_value}</td>
                        <td className="p-3 text-slate-400">{r.author_user_id}</td>
                        <td className="p-3 text-slate-300">{r.reason}</td>
                        <td className="p-3"><span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] font-bold">ACTIVE</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Record-Level Corrections Audit Table */}
          <div className="glass-panel p-5 rounded-xl border border-slate-800 shadow-xl">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-amber-400" />
              Inspection & Sensor Corrections Audit Trail
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Accepted corrections propagate across every query, recalculating production states, downtime, and regulatory report duties.
            </p>

            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 font-semibold uppercase text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">Target ID</th>
                    <th className="p-3">Field</th>
                    <th className="p-3">Original Value</th>
                    <th className="p-3">Corrected Value</th>
                    <th className="p-3">Author</th>
                    <th className="p-3">Reason</th>
                    <th className="p-3">Conflict Detected</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                  {data.corrections.length === 0 ? (
                    <tr><td colSpan={8} className="p-4 text-center text-slate-500">No runtime corrections recorded yet.</td></tr>
                  ) : (
                    data.corrections.map((c: any) => (
                      <tr key={c.correction_id} className="hover:bg-slate-800/40">
                        <td className="p-3 text-sky-400 font-bold">{c.target_id}</td>
                        <td className="p-3">{c.target_field}</td>
                        <td className="p-3 line-through text-slate-500">{c.original_value || 'None'}</td>
                        <td className="p-3 text-emerald-400 font-bold">{c.corrected_value}</td>
                        <td className="p-3 text-slate-400">{c.author_user_id}</td>
                        <td className="p-3 text-slate-300 max-w-xs truncate">{c.reason}</td>
                        <td className="p-3">
                          {c.conflict_detected ? (
                            <span className="text-amber-400 flex items-center gap-1 font-semibold text-[10px]">
                              <AlertTriangle className="w-3.5 h-3.5" /> Disagreement
                            </span>
                          ) : (
                            <span className="text-slate-500">None</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-500/30 uppercase">
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Propose Correction Modal */}
      {showCorrectionModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Propose Data Correction</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Target Inspection ID</label>
                <input
                  type="text"
                  value={targetId}
                  onChange={e => setTargetId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Target Field</label>
                <select
                  value={targetField}
                  onChange={e => setTargetField(e.target.value)}
                  className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                >
                  <option value="wellhead_temp_c">wellhead_temp_c (Thermal Reading)</option>
                  <option value="spill_est_volume_bbl">spill_est_volume_bbl (Spill Barrels)</option>
                  <option value="spill_detected">spill_detected (False Positive Override)</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Corrected Value</label>
                <input
                  type="text"
                  value={correctedValue}
                  onChange={e => setCorrectedValue(e.target.value)}
                  className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Reason / Provenance</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowCorrectionModal(false)}
                className="px-4 py-1.5 rounded bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleProposeCorrection}
                className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold"
              >
                Apply Correction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Propose Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Add Operational Type Rule</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Target Well Type Scope</label>
                <select
                  value={ruleType}
                  onChange={e => setRuleType(e.target.value)}
                  className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                >
                  <option value="T350">T350 Wells Only</option>
                  <option value="T200">T200 Wells Only</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Pump Jack RCA Repairs Threshold</label>
                <input
                  type="text"
                  value={paramValue}
                  onChange={e => setParamValue(e.target.value)}
                  className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Reason / Operational Directive</label>
                <textarea
                  rows={3}
                  value={ruleReason}
                  onChange={e => setRuleReason(e.target.value)}
                  className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowRuleModal(false)}
                className="px-4 py-1.5 rounded bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleProposeRule}
                className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold"
              >
                Save Operational Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
