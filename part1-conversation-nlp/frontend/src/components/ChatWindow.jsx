import React, { useState, useRef, useEffect } from 'react';
import MessageItem from './MessageItem.jsx';
import DetectionCard from './DetectionCard.jsx';
import { Send, Sparkles } from 'lucide-react';

export default function ChatWindow({
  activeUser,
  messages,
  transactions,
  onSendMessage,
  onConsentAction,
}) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, transactions]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(activeUser, inputText);
    setInputText('');
  };

  const handleQuickChip = (text) => {
    onSendMessage(activeUser, text);
  };

  const isArjun = activeUser === 'Arjun';

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      <div
        className={`px-4 py-3 border-b flex items-center justify-between ${
          isArjun
            ? 'bg-indigo-950/60 border-indigo-900/60 text-indigo-100'
            : 'bg-emerald-950/60 border-emerald-900/60 text-emerald-100'
        }`}
      >
        <div className="flex items-center space-x-2.5">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow ${
              isArjun ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'
            }`}
          >
            {activeUser[0]}
          </div>
          <div>
            <h2 className="font-semibold text-sm leading-none">{activeUser}'s Chat Perspective</h2>
            <span className="text-[11px] text-slate-400">
              Conversing with {isArjun ? 'Riya' : 'Arjun'}
            </span>
          </div>
        </div>

        <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300">
          Simulating as <strong className={isArjun ? 'text-indigo-400' : 'text-emerald-400'}>{activeUser}</strong>
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/40">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 py-12">
            <Sparkles className="w-8 h-8 text-slate-600" />
            <p className="text-sm">No messages yet in conversation.</p>
            <p className="text-xs text-slate-600">Type a message or click a quick demo prompt below.</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isLastMessage = index === messages.length - 1;

            return (
              <React.Fragment key={msg.id}>
                <MessageItem message={msg} activeUser={activeUser} />

                {isLastMessage && transactions.length > 0 && (
                  <DetectionCard
                    transaction={transactions[transactions.length - 1]}
                    activeUser={activeUser}
                    onConsentAction={onConsentAction}
                  />
                )}
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 py-2 bg-slate-900 border-t border-slate-800/80 flex items-center space-x-2 overflow-x-auto text-xs text-slate-400">
        <span className="shrink-0 text-[10px] uppercase font-bold text-slate-500">Quick Test:</span>
        {isArjun ? (
          <>
            <button
              onClick={() => handleQuickChip("Yes, I'll pay you back ₹250 for the tea")}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 shrink-0 transition-all cursor-pointer"
            >
              "Yes, I'll pay you back ₹250 for the tea"
            </button>
            <button
              onClick={() => handleQuickChip("I'll send you 400rs tomorrow")}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 shrink-0 transition-all cursor-pointer"
            >
              "I'll send you 400rs tomorrow"
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => handleQuickChip("You still owe me ₹250 for the tea yesterday")}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 shrink-0 transition-all cursor-pointer"
            >
              "You still owe me ₹250 for the tea yesterday"
            </button>
            <button
              onClick={() => handleQuickChip("You owe me 400rs")}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 shrink-0 transition-all cursor-pointer"
            >
              "You owe me 400rs"
            </button>
          </>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center space-x-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Type message as ${activeUser}...`}
          className="flex-1 bg-slate-800/80 text-slate-100 placeholder-slate-500 text-sm px-4 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 transition-all"
        />
        <button
          type="submit"
          className={`p-2.5 rounded-xl text-white font-medium transition-all shadow cursor-pointer active:scale-95 ${
            isArjun
              ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/40'
              : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40'
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
