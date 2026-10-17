import React from 'react';
import { User as UserType } from '../../types';
import { UserCheck, Database, Cpu, Calendar, Activity } from 'lucide-react';

interface Props {
  users: UserType[];
  currentUser: UserType | null;
  onSelectUser: (user: UserType) => void;
  datasetStats: { wells: number; inspections: number; refDate: string };
  healthStatus: 'checking' | 'online' | 'offline';
}

export const TopBar: React.FC<Props> = ({
  users,
  currentUser,
  onSelectUser,
  datasetStats,
  healthStatus
}) => {
  const healthStyles = {
    checking: {
      container: 'bg-amber-500/8 border-amber-500/20 text-amber-300',
      dot: 'bg-amber-400',
      label: 'CHECKING'
    },
    online: {
      container: 'bg-emerald-500/8 border-emerald-500/20 text-emerald-300',
      dot: 'bg-emerald-400',
      label: 'LIVE'
    },
    offline: {
      container: 'bg-rose-500/8 border-rose-500/20 text-rose-300',
      dot: 'bg-rose-400',
      label: 'OFFLINE'
    }
  }[healthStatus];

  return (
    <header className="h-[68px] border-b border-slate-800/70 bg-[#0b111a]/85 backdrop-blur-xl px-7 flex items-center justify-between text-xs text-slate-300 shrink-0">
      {/* Left: System Status Pills */}
      <div className="flex items-center gap-5 min-w-0">
        <div className="hidden lg:block">
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-600">Operational workspace</div>
          <div className="text-sm font-medium text-slate-200 mt-0.5">Field intelligence console</div>
        </div>
        {/* Dataset Status */}
        <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/45 border border-slate-800/70 text-slate-400">
          <Database className="w-3.5 h-3.5 text-sky-400" />
          <span><strong className="text-slate-200">{datasetStats.wells}</strong> assets <span className="text-slate-600">/</span> <strong className="text-slate-200">{datasetStats.inspections.toLocaleString()}</strong> inspections</span>
        </div>

        {/* Date Reference */}
        <div className="hidden xl:flex items-center gap-2 text-slate-500">
          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
          <span>Data through <strong className="text-slate-300">{datasetStats.refDate}</strong></span>
        </div>

        {/* AI Provider */}
        <div className="hidden 2xl:flex items-center gap-2 text-slate-500">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span>Evidence engine <strong className="text-emerald-400">active</strong></span>
        </div>
      </div>

      {/* Right: User Switcher & Theme */}
      <div className="flex items-center gap-4">
        {/* User Selector */}
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-sky-400" />
          <select
            value={currentUser?.user_id || 'U-201'}
            onChange={(e) => {
              const u = users.find(usr => usr.user_id === e.target.value);
              if (u) onSelectUser(u);
            }}
            className="max-w-[180px] px-2.5 py-2 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-200 text-xs font-medium focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            {users.map(u => (
              <option key={u.user_id} value={u.user_id}>
                {u.name} ({u.role.replace('_', ' ')} • {u.team_id})
              </option>
            ))}
          </select>
        </div>

        {/* DB Connection Badge */}
        <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border font-mono text-[10px] tracking-wide ${healthStyles.container}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${healthStyles.dot} ${healthStatus === 'online' ? 'status-dot-green' : ''}`} />
          <Activity className="w-3 h-3" />
          <span>{healthStyles.label}</span>
        </div>
      </div>
    </header>
  );
};
