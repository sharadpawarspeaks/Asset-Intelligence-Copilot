import React from 'react';
import {
  MessageSquare, Plus, Compass, BarChart3, ShieldAlert,
  Wrench, BookOpen, Share2, ClipboardList, Database, Settings,
  Radio, HardHat, ChevronRight
} from 'lucide-react';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNewChat: () => void;
}

export const Sidebar: React.FC<Props> = ({ activeTab, setActiveTab, onNewChat }) => {
  const navItems = [
    { id: 'chat', label: 'Copilot Chat', icon: MessageSquare },
    { id: 'wells', label: 'Well Explorer', icon: Compass },
    { id: 'analytics', label: 'Operations Analytics', icon: BarChart3 },
    { id: 'compliance', label: 'Spill Compliance', icon: ShieldAlert },
    { id: 'repairs', label: 'Repair Analysis', icon: Wrench },
    { id: 'knowledge_base', label: 'Knowledge Base', icon: BookOpen },
    { id: 'shared_knowledge', label: 'Shared Well Knowledge', icon: Share2 },
    { id: 'corrections', label: 'Corrections & Audit Log', icon: ClipboardList },
    { id: 'data_import', label: 'Data Import & Sync', icon: Database },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-[248px] bg-[#0a111b] border-r border-slate-800/70 flex flex-col h-screen shrink-0 select-none">
      {/* Brand Header */}
      <div className="px-5 py-5 border-b border-slate-800/70 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-400/25 flex items-center justify-center text-sky-300">
          <Radio className="w-[18px] h-[18px]" />
        </div>
        <div>
          <h1 className="text-[13px] font-semibold text-slate-100 tracking-tight leading-tight">
            Asset Intelligence
          </h1>
          <span className="text-[10px] text-slate-500 tracking-[0.16em] uppercase block mt-1">
            Operations copilot
          </span>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="px-4 pt-5 pb-4">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-between gap-2 py-2.5 px-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold shadow-lg shadow-sky-950/30 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2"><Plus className="w-4 h-4" />New conversation</span>
          <span className="text-[10px] font-mono opacity-60">⌘ K</span>
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-1 space-y-1">
        <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-[0.16em] px-3 py-2">
          Workspace
        </div>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                isActive
                  ? 'bg-sky-400/10 text-sky-200 border border-sky-400/20'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-slate-900/70'
              }`}
            >
              <Icon className={`w-[17px] h-[17px] ${isActive ? 'text-sky-300' : 'text-slate-500 group-hover:text-slate-300'}`} />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-sky-400/70" />}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/70">
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <HardHat className="w-4 h-4 text-slate-600 shrink-0" />
          <span className="truncate">Permian Basin operations</span>
        </div>
        <div className="mt-2 ml-6 text-[10px] text-slate-600">Secure workspace · v1.0</div>
      </div>
    </aside>
  );
};
