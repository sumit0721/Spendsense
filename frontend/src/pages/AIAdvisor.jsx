import { useState } from 'react';
import { Send, Mic, Bot, History } from 'lucide-react';
import TopBar from '../components/TopBar';
import ChatBubble, { TypingIndicator } from '../components/ChatBubble';
import LoadingState from '../components/LoadingState';
import { askAdvisor } from '../services/api';

export default function AIAdvisor() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      isUser: false,
      text: "Hello! I am your SpendSense AI Advisor. Ask me anything about your transaction history, category breakdowns, or budget status, and I will help you analyze it.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { id: crypto.randomUUID(), isUser: true, text: input };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    try {
      const res = await askAdvisor(currentInput);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          isUser: false,
          text: res.answer || "I'm sorry, I couldn't generate a response. Please try again.",
        },
      ]);
    } catch (err) {
      console.error('Failed to get response from advisor:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          isUser: false,
          text: err.response?.data?.message || 'The AI Advisor endpoint encountered an error. Please verify your connection or Gemini API key settings.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <TopBar title="AI Advisor">
        <button className="p-2 rounded-full hover:bg-surface-container-low transition-colors text-on-surface-variant">
          <History size={20} />
        </button>
      </TopBar>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col items-center">
        <div className="max-w-3xl w-full flex flex-col gap-6">
          {/* Date separator */}
          <div className="flex justify-center">
            <span className="px-4 py-1 bg-surface-container-high text-on-surface-variant text-[12px] font-medium rounded-full">
              Today
            </span>
          </div>

          {messages.length === 0 ? (
            <LoadingState type="chat" />
          ) : (
            messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg.text} isUser={msg.isUser}>
                {/* Example insight cards for AI responses */}
                {!msg.isUser && msg.id === 2 && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[14px] font-medium text-on-surface-variant">Status</span>
                          <Bot size={16} className="text-primary" />
                        </div>
                        <span className="text-[24px] font-semibold text-primary">Pending</span>
                        <span className="text-[14px] text-success font-medium">Setup Required</span>
                      </div>
                      <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[14px] font-medium text-on-surface-variant">Model</span>
                          <Bot size={16} className="text-primary" />
                        </div>
                        <span className="text-[24px] font-semibold text-primary">Gemini</span>
                        <p className="text-[12px] text-on-surface-variant">Configured in geminiClient.js</p>
                      </div>
                    </div>
                  </>
                )}
              </ChatBubble>
            ))
          )}

          {isTyping && <TypingIndicator />}
        </div>
      </div>

      {/* Input Bar */}
      <footer className="w-full bg-surface p-6 border-t border-outline-variant flex justify-center">
        <div className="max-w-3xl w-full flex gap-3 items-center">
          <div className="flex-1 relative">
            <input
              className="w-full bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-0 rounded-xl px-6 py-3 pr-12 text-[16px] transition-all shadow-sm text-on-surface outline-none"
              placeholder="Ask about your spending..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-primary hover:text-on-surface-variant transition-colors"
              onClick={handleSend}
            >
              <Send size={18} />
            </button>
          </div>
          <button className="p-3 bg-surface-container-lowest border border-outline-variant rounded-xl text-primary hover:bg-surface-container-low transition-colors">
            <Mic size={20} />
          </button>
        </div>
      </footer>
    </>
  );
}
