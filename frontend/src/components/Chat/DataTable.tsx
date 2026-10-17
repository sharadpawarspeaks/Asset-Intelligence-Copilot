import React, { useState } from 'react';
import { TableData } from '../../types';
import { ArrowUpDown, Download } from 'lucide-react';

interface Props {
  data: TableData;
  onSelectWell?: (wellId: string) => void;
}

export const DataTable: React.FC<Props> = ({ data, onSelectWell }) => {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [filterText, setFilterText] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const filteredRows = (data.rows || []).filter(row => {
    if (!filterText) return true;
    return Object.values(row).some(v => 
      String(v).toLowerCase().includes(filterText.toLowerCase())
    );
  });

  const sortedRows = [...filteredRows].sort((a, b) => {
    if (!sortKey) return 0;
    const valA = a[sortKey];
    const valB = b[sortKey];
    if (valA === valB) return 0;
    if (valA === null || valA === undefined) return 1;
    if (valB === null || valB === undefined) return -1;
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortAsc ? valA - valB : valB - valA;
    }
    return sortAsc ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
  });

  const totalPages = Math.ceil(sortedRows.length / pageSize) || 1;
  const paginatedRows = sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const exportCSV = () => {
    if (!data.columns || !data.rows) return;
    const headers = data.columns.map(c => `"${c.label}"`).join(',');
    const rowsCSV = sortedRows.map(r => 
      data.columns.map(c => `"${r[c.key] ?? ''}"`).join(',')
    ).join('\n');
    const blob = new Blob([`${headers}\n${rowsCSV}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.title || 'data_export'}.csv`;
    a.click();
  };

  return (
    <div className="rounded-xl glass-card border border-slate-700/60 p-4 shadow-xl my-3 text-slate-100 max-w-4xl">
      {/* Table Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        {data.title && (
          <h4 className="text-sm font-bold text-sky-400 uppercase tracking-wider">
            {data.title} ({filteredRows.length} records)
          </h4>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <input
            type="text"
            placeholder="Filter records..."
            value={filterText}
            onChange={e => { setFilterText(e.target.value); setCurrentPage(1); }}
            className="px-2.5 py-1 text-xs rounded bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-sky-500 w-44"
          />
          <button
            onClick={exportCSV}
            title="Export CSV"
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Table grid */}
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300 border-collapse">
          <thead className="bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
            <tr>
              {data.columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-3.5 py-2.5 cursor-pointer hover:text-sky-300 transition-colors select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>{col.label}</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={data.columns.length} className="px-3.5 py-4 text-center text-slate-500">
                  No matching records found.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  {data.columns.map(col => {
                    const val = row[col.key];
                    const isWellId = String(val).startsWith('WELL-');
                    return (
                      <td key={col.key} className="px-3.5 py-2 whitespace-normal break-words">
                        {isWellId ? (
                          <span
                            onClick={() => onSelectWell && onSelectWell(String(val))}
                            className="text-sky-400 font-semibold cursor-pointer hover:underline"
                          >
                            {val}
                          </span>
                        ) : (
                          String(val ?? '-')
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 text-xs text-slate-400 px-1">
          <span>Page {currentPage} of {totalPages}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2 py-0.5 rounded bg-slate-800 disabled:opacity-40 border border-slate-700"
            >
              Prev
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2 py-0.5 rounded bg-slate-800 disabled:opacity-40 border border-slate-700"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
