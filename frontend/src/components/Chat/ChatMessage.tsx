import React, { useState } from 'react';
import { ChatMessage as ChatMessageType, Citation } from '../../types';
import { GenerativeVisual } from './GenerativeVisual';
import { Bot, User as UserIcon, AlertTriangle, FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  message: ChatMessageType;
  onSelectWell?: (wellId: string) => void;
}

export const ChatMessage: React.FC<Props> = ({ message, onSelectWell }) => {
  const isUser = message.role === 'user';
  const [showCitations, setShowCitations] = useState(false);

  return (
    <div className={`flex gap-3 my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-sky-600/30 border border-sky-500/40 flex items-center justify-center shrink-0 mt-1 shadow-md">
          <Bot className="w-4 h-4 text-sky-400" />
        </div>
      )}

      <div className={`max-w-3xl ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Main message bubble */}
        <div
          className={`p-4 rounded-2xl text-sm leading-relaxed shadow-lg ${
            isUser
              ? 'bg-sky-600 text-white rounded-tr-none'
              : 'glass-panel border border-slate-700/60 text-slate-100 rounded-tl-none'
          }`}
        >
          {/* Conflict Banner if detected */}
          {message.conflict_detected && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300 block mb-0.5">Data Disagreement Detected:</strong>
                <span>{message.conflict_details || 'Operator statements conflict with physical sensor records. Both have been preserved.'}</span>
              </div>
            </div>
          )}

          {/* Text content with markdown formatting */}
          <div className="whitespace-pre-wrap font-sans text-[13.5px]">
            {message.content}
          </div>

          {/* Inline Generative UI Visual */}
          {message.visual && (
            <div className="mt-4">
              <GenerativeVisual visual={message.visual} onSelectWell={onSelectWell} />
            </div>
          )}

          {/* Expandable Evidence Citations Section */}
          {message.citations && message.citations.length > 0 && (
            <div className="mt-4 border-t border-slate-800/80 pt-2.5">
              <button
                onClick={() => setShowCitations(!showCitations)}
                className="flex items-center justify-between w-full text-xs text-sky-400 hover:text-sky-300 font-medium py-0.5 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <strong>Evidence Citations ({message.citations.length} records verified)</strong>
                </span>
                {showCitations ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showCitations && (
                <div className="mt-2.5 space-y-2">
                  {message.citations.map((c, idx) => (
                    <div
                      key={idx}
                      className="text-xs bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 text-slate-300 shadow-inner"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span className="font-mono text-sky-300 font-bold">
                          [{c.source_type.toUpperCase()}] {c.source_id}
                          {c.asset_id && ` • ${c.asset_id}`}
                        </span>
                        {c.source_file && (
                          <span className="font-mono text-slate-500 text-[10px] truncate max-w-xs">
                            {c.source_file}
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] italic text-slate-300 leading-normal">
                        "{c.excerpt}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <span className="text-[10px] text-slate-500 mt-1 block px-1">
          {message.timestamp}
        </span>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-1 shadow-md">
          <UserIcon className="w-4 h-4 text-slate-300" />
        </div>
      )}
    </div>
  );
};
