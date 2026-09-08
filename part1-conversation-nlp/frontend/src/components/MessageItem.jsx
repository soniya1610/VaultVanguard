import React from 'react';

export default function MessageItem({ message, activeUser }) {
  const isSelf = message.sender === activeUser;
  const timeStr = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isArjun = message.sender === 'Arjun';

  return (
    <div className={`flex flex-col my-1.5 ${isSelf ? 'items-end' : 'items-start'}`}>
      <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-0.5 px-1">
        <span className="font-semibold text-slate-300">{message.sender}</span>
        <span>•</span>
        <span>{timeStr}</span>
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm text-sm border leading-relaxed ${
          isArjun
            ? 'bg-indigo-600/90 text-white border-indigo-500/30 rounded-tr-xs'
            : 'bg-emerald-600/90 text-white border-emerald-500/30 rounded-tl-xs'
        }`}
      >
        {message.text}
      </div>
    </div>
  );
}
