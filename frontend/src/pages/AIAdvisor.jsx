import { useState, useEffect, useRef } from 'react';
import { Send, Mic, Bot, History, Trash2, AlertTriangle } from 'lucide-react';
import TopBar from '../components/TopBar';
import ChatBubble, { TypingIndicator } from '../components/ChatBubble';
import LoadingState from '../components/LoadingState';
import { askAdvisor, getChatHistory, syncChatHistory, clearChatHistory } from '../services/api';

const defaultMessage = {
  id: 'default-1',
  isUser: false,
  text: "Hello! I am your SpendSense AI Advisor. Ask me anything about your transaction history, category breakdowns, or budget status, and I will help you analyze it.",
};

export default function AIAdvisor() {
  const [messages, setMessages] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isLoadingHistory]);


  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await getChatHistory();
        if (res.messages && res.messages.length > 0) {
          setMessages(res.messages);
        } else {
          setMessages([defaultMessage]);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
        setMessages([defaultMessage]);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    fetchHistory();
  }, []);

  const syncMessages = async (newMessages) => {
    try {
      await syncChatHistory(newMessages);
    } catch (err) {
      console.error('Failed to sync chat history', err);
    }
  };

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Speech Recognition.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + (prev ? " " : "") + transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const [showHistoryMenu, setShowHistoryMenu] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);

  const confirmClearHistory = async () => {
    try {
      await clearChatHistory();
      setMessages([defaultMessage]);
    } catch (err) {
      console.error('Failed to clear chat history', err);
    }
    setShowClearConfirmModal(false);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { id: crypto.randomUUID(), isUser: true, text: input };
    setMessages((prev) => {
      const updated = [...prev, userMessage];
      syncMessages(updated);
      return updated;
    });
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    try {
      const res = await askAdvisor(currentInput);
      setMessages((prev) => {
        const updated = [
          ...prev,
          {
            id: crypto.randomUUID(),
            isUser: false,
            text: res.answer || "I'm sorry, I couldn't generate a response. Please try again.",
          },
        ];
        syncMessages(updated);
        return updated;
      });
    } catch (err) {
      console.error('Failed to get response from advisor:', err);
      setMessages((prev) => {
        const updated = [
          ...prev,
          {
            id: crypto.randomUUID(),
            isUser: false,
            text: err.response?.data?.message || 'The AI Advisor endpoint encountered an error. Please verify your connection or Gemini API key settings.',
          },
        ];
        syncMessages(updated);
        return updated;
      });
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
        <div className="relative">
          <button 
            onClick={() => setShowHistoryMenu(!showHistoryMenu)}
            title="Conversation History Options"
            className="p-2 rounded-full hover:bg-surface-container-low transition-colors text-on-surface-variant">
            <History size={20} />
          </button>
          
          {showHistoryMenu && (
            <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-56 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg overflow-hidden z-50 animate-fade-in">
              <div className="p-3 border-b border-outline-variant bg-surface-container-low">
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Conversation History</p>
              </div>
              <div className="p-2">
                <button
                  onClick={() => {
                    setShowHistoryMenu(false);
                    setShowClearConfirmModal(true);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-[14px] font-medium text-error hover:bg-error-container/50 transition-colors flex items-center gap-2.5"
                >
                  <Trash2 size={16} />
                  Clear Chat History
                </button>
              </div>
            </div>
          )}
        </div>
      </TopBar>

      {/* Confirmation Modal */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-md card-shadow border border-outline-variant overflow-hidden animate-modal-in">
            <div className="p-6">
              <div className="flex gap-4 items-start">
                <div className="p-3 bg-error-container text-on-error-container rounded-full shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-[18px] font-bold text-on-surface mb-2">Clear Chat History</h3>
                  <p className="text-[14px] text-on-surface-variant leading-relaxed">
                    Are you sure you want to clear your entire conversation history? This action cannot be undone and your AI advisor will start with a fresh context.
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant flex justify-end gap-3">
              <button
                onClick={() => setShowClearConfirmModal(false)}
                className="px-4 py-2 rounded-lg text-[14px] font-medium text-on-surface-variant hover:bg-surface-container transition-colors focus:outline-none"
              >
                Cancel
              </button>
              <button
                onClick={confirmClearHistory}
                className="px-4 py-2 rounded-lg text-[14px] font-medium bg-error text-white hover:bg-error/90 shadow-sm transition-colors focus:outline-none"
              >
                Clear All Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col items-center">
        <div className="max-w-3xl w-full flex flex-col gap-6">
          {/* Date separator */}
          <div className="flex justify-center">
            <span className="px-4 py-1 bg-surface-container-high text-on-surface-variant text-[12px] font-medium rounded-full">
              Today
            </span>
          </div>

          {isLoadingHistory ? (
            <LoadingState type="chat" />
          ) : messages.length === 0 ? (
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
          <div ref={messagesEndRef} />
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
          <button 
            onClick={startListening}
            className={`p-3 border border-outline-variant rounded-xl transition-colors ${
              isListening 
                ? 'bg-primary text-on-primary animate-pulse' 
                : 'bg-surface-container-lowest text-primary hover:bg-surface-container-low'
            }`}
            title={isListening ? "Listening..." : "Start voice dictation"}
          >
            <Mic size={20} />
          </button>
        </div>
      </footer>
    </>
  );
}
