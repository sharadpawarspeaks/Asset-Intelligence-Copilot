import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Layout/Sidebar';
import { TopBar } from './components/Layout/TopBar';
import { ChatMessage } from './components/Chat/ChatMessage';
import { WellExplorer } from './components/Pages/WellExplorer';
import { OperationsAnalytics } from './components/Pages/OperationsAnalytics';
import { SpillCompliance } from './components/Pages/SpillCompliance';
import { RepairAnalysis } from './components/Pages/RepairAnalysis';
import { KnowledgeBase } from './components/Pages/KnowledgeBase';
import { SharedKnowledgePage } from './components/Pages/SharedKnowledgePage';
import { CorrectionsAuditPage } from './components/Pages/CorrectionsAuditPage';
import { DataImportPage } from './components/Pages/DataImportPage';
import { SettingsPage } from './components/Pages/SettingsPage';
import { fetchUsers, fetchAreas, sendChatMessage, fetchHealth } from './api/client';
import { User, Area, ChatMessage as ChatMessageType } from './types';
import { Send, Sparkles, Radio, Loader2, ArrowUpRight, Database, ShieldCheck, Activity } from 'lucide-react';
import './App.css';

export function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [datasetStats, setDatasetStats] = useState({ wells: 200, inspections: 39567, refDate: '16 Oct 2026' });
  const [healthStatus, setHealthStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  
  // Chat State
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [isSending, setIsSending] = useState(false);
  const [selectedWellId, setSelectedWellId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial fetch of users, areas, and health stats
    Promise.all([fetchUsers(), fetchAreas(), fetchHealth()])
      .then(([uList, aList, hData]) => {
        setUsers(uList);
        if (uList.length > 0) {
          // Default to Michael Turner (U-201)
          const defaultUser = uList.find(u => u.user_id === 'U-201') || uList[0];
          setCurrentUser(defaultUser);
        }
        setAreas(aList);
        if (hData) {
          setHealthStatus(hData.status === 'healthy' && hData.database === 'connected' ? 'online' : 'offline');
          setDatasetStats({
            wells: hData.wells_count || 200,
            inspections: hData.inspections_count || 39567,
            refDate: hData.reference_date || '16 Oct 2026'
          });
        }
      })
      .catch(() => setHealthStatus('offline'));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isSending) return;

    setInputMessage('');
    const userMsg: ChatMessageType = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setIsSending(true);

    try {
      const resp = await sendChatMessage(
        text,
        conversationId,
        currentUser?.user_id || 'U-201'
      );
      setConversationId(resp.conversation_id);

      const asstMsg: ChatMessageType = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: resp.message,
        visual: resp.visual,
        citations: resp.citations,
        conflict_detected: resp.conflict_detected,
        conflict_details: resp.conflict_details,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, asstMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessageType = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Error: Unable to process operational query. ${err?.message || ''}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(undefined);
    setActiveTab('chat');
  };

  const handleSelectWell = (wellId: string) => {
    setSelectedWellId(wellId);
    setActiveTab('wells');
  };

  const suggestedQuestions = [
    "Is WELL-0001 producing oil right now? Show me its status card.",
    "Which wells in Northeast Block 8 are not producing oil right now, and why?",
    "Show a line chart of WELL-0001 wellhead temperature against air temperature for the last 13 weeks.",
    "How many oil spills has WELL-0001 had in the last 4 years, and how much oil in total?",
    "Which 3 wells in Northeast Block 7 had the most downtime in the last 4 months? Show a bar chart.",
    "Show on a map every well in Northeast Block 8 with a real spill in the last 90 days.",
    "Show a heatmap of 2026 spills by geographic area and month.",
    "Which rules has WELL-0001 broken in the last 12 months, and what is still open?",
    "In Southwest Block 24, which spills in the last 90 days were not contained within the SOP time limit?"
  ];

  return (
    <div className="dashboard-shell flex h-screen w-screen overflow-hidden text-slate-100 font-sans">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewChat={handleNewChat}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* TopBar */}
        <TopBar
          users={users}
          currentUser={currentUser}
          onSelectUser={(u) => {
            setCurrentUser(u);
            // Switch user resets current chat session to guarantee memory privacy!
            setMessages([]);
            setConversationId(undefined);
          }}
          datasetStats={datasetStats}
          healthStatus={healthStatus}
        />

        {/* Dynamic Workspace */}
        <main className="flex-1 overflow-hidden relative">
          {activeTab === 'chat' && (
            <div className="h-full flex flex-col justify-between">
              {/* Messages viewport */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {messages.length === 0 ? (
                  /* Welcome Screen */
                  <div className="relative h-full overflow-hidden">
                    <div className="dashboard-grid absolute inset-0 pointer-events-none" />
                    <div className="relative max-w-6xl mx-auto px-6 py-12 lg:px-10 lg:py-16">
                      <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/8 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300">
                          <Radio className="h-3.5 w-3.5" />
                          Intelligence workspace
                        </div>
                        <h2 className="mt-6 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                          Operational clarity, <span className="text-sky-300">on demand.</span>
                        </h2>
                        <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                          Ask about production, maintenance, compliance, or asset health. Every answer is grounded in your connected operational data and supporting evidence.
                        </p>
                      </div>

                      <div className="mt-10 grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-3">
                        {[
                          { label: 'Connected assets', value: datasetStats.wells, icon: Database, tone: 'text-sky-300' },
                          { label: 'Inspections indexed', value: datasetStats.inspections.toLocaleString(), icon: Activity, tone: 'text-indigo-300' },
                          { label: 'Evidence verified', value: '100%', icon: ShieldCheck, tone: 'text-emerald-300' },
                        ].map(stat => {
                          const Icon = stat.icon;
                          return (
                            <div key={stat.label} className="surface-panel rounded-xl px-4 py-4">
                              <div className="flex items-center justify-between">
                                <Icon className={`h-4 w-4 ${stat.tone}`} />
                                <span className="text-[10px] uppercase tracking-[0.15em] text-slate-600">Live</span>
                              </div>
                              <div className="mt-4 text-2xl font-semibold tracking-tight text-slate-100">{stat.value}</div>
                              <div className="mt-1 text-xs text-slate-500">{stat.label}</div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-12 max-w-4xl text-left">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            <Sparkles className="h-3.5 w-3.5 text-sky-300" /> Start with a question
                          </span>
                          <span className="hidden text-[11px] text-slate-600 sm:block">Choose a workflow to begin</span>
                        </div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          {suggestedQuestions.map((q, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSendMessage(q)}
                              className="group flex items-start justify-between gap-4 rounded-xl border border-slate-800/80 bg-slate-900/45 p-4 text-left text-xs text-slate-300 transition-colors hover:border-sky-400/30 hover:bg-slate-900/80 cursor-pointer"
                            >
                              <span className="leading-5">{q}</span>
                              <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-600 transition-colors group-hover:text-sky-300" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-4xl mx-auto space-y-4">
                    {messages.map(m => (
                      <ChatMessage
                        key={m.id}
                        message={m}
                        onSelectWell={handleSelectWell}
                      />
                    ))}
                    {isSending && (
                      <div className="flex items-center gap-2 text-xs text-sky-400 p-4">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Querying operational engines and verifying document citations...</span>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <div className="p-5 border-t border-slate-800/70 bg-[#0b111a]/90 backdrop-blur-xl">
                <div className="max-w-4xl mx-auto flex items-center gap-3">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={e => setInputMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    placeholder={`Ask about any well, downtime, repair, or regulation as ${currentUser?.name || 'Operator'}...`}
                    disabled={isSending}
                    className="command-input flex-1 px-4 py-3.5 rounded-xl border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={isSending || !inputMessage.trim()}
                    className="p-3.5 rounded-xl bg-sky-400 hover:bg-sky-300 disabled:opacity-40 text-slate-950 shadow-lg shadow-sky-950/30 transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'wells' && (
            <WellExplorer
              areas={areas}
              onAskAboutWell={(q) => {
                setActiveTab('chat');
                handleSendMessage(q);
              }}
              selectedWellId={selectedWellId}
              onClearSelectedWell={() => setSelectedWellId(null)}
            />
          )}

          {activeTab === 'analytics' && (
            <OperationsAnalytics
              areas={areas}
              onSelectWell={handleSelectWell}
            />
          )}

          {activeTab === 'compliance' && <SpillCompliance />}

          {activeTab === 'repairs' && <RepairAnalysis />}

          {activeTab === 'knowledge_base' && <KnowledgeBase />}

          {activeTab === 'shared_knowledge' && (
            <SharedKnowledgePage currentUserId={currentUser?.user_id || 'U-201'} />
          )}

          {activeTab === 'corrections' && (
            <CorrectionsAuditPage currentUserId={currentUser?.user_id || 'U-201'} />
          )}

          {activeTab === 'data_import' && <DataImportPage />}

          {activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}

export default App;
