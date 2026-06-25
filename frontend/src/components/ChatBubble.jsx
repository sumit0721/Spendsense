import React from 'react';
import { User, Bot } from 'lucide-react';

export default function ChatBubble({ message, isUser, children }) {
  const formattedTime = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex gap-sm max-w-[80%] ${isUser ? 'self-end flex-row-reverse' : 'self-start'} animate-slide-in`}>
      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center border ${
        isUser
          ? 'bg-surface-container-lowest border-outline-variant text-on-surface'
          : 'bg-primary border-primary text-on-primary'
      }`}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      
      <div className="flex flex-col gap-[4px] w-full">
        <div className={`p-md rounded-lg text-[14px] font-sans font-medium leading-relaxed border ${
          isUser
            ? 'bg-surface-container-lowest border-outline-variant text-on-surface rounded-tr-none shadow-sm'
            : 'bg-surface-container border-outline-variant/60 text-on-surface rounded-tl-none shadow-card'
        } flex flex-col gap-sm`}>
          <div>{message}</div>
          {children}
        </div>
        <span className={`text-[10px] text-secondary font-semibold uppercase tracking-wider ${
          isUser ? 'text-right' : 'text-left'
        }`}>
          {formattedTime}
        </span>
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex gap-sm max-w-[80%] self-start animate-pulse">
      <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-primary border-primary text-on-primary">
        <Bot className="w-4 h-4" />
      </div>
      <div className="bg-surface-container border border-outline-variant/60 px-md py-sm rounded-lg rounded-tl-none shadow-card flex items-center gap-1">
        <span className="w-2 h-2 bg-on-surface-variant rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-on-surface-variant rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-on-surface-variant rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
