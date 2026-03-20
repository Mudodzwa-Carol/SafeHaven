import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import { generateAIResponse, getInitialGreeting, ChatMessage } from "../services/ai";

export function AIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([getInitialGreeting()]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      createdAt: Date.now(),
    };

    setMessages([...messages, userMessage]);
    const currentInput = inputMessage;
    setInputMessage("");
    setIsTyping(true);

    try {
      // Backend equivalent: POST /api/chat with message and conversation history
      const aiResponseContent = await generateAIResponse(currentInput);
      
      const aiResponse: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        content: aiResponseContent,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        createdAt: Date.now(),
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error("Error generating AI response:", error);
      // Fallback response
      const errorResponse: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        content: "I'm here to listen. Please tell me more about what's on your mind.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] sm:h-[calc(100vh-250px)] bg-white/80 backdrop-blur-sm border border-purple-200 rounded-xl shadow-md overflow-hidden w-full">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0 shadow-lg">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative">
            <Bot className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-sm sm:text-base">AI Companion</h2>
            <p className="text-xs sm:text-sm text-purple-100">Always here to listen</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6 space-y-3 sm:space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-2 sm:gap-3 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${
                message.role === "user" 
                  ? "bg-gradient-to-br from-purple-500 to-pink-500" 
                  : "bg-gradient-to-br from-emerald-400 to-teal-500 ring-2 ring-emerald-200 ring-offset-2"
              }`}
            >
              {message.role === "user" ? (
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              ) : (
                <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              )}
            </div>
            <div
              className={`flex flex-col gap-1 max-w-[75%] sm:max-w-[70%] ${
                message.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`px-3 sm:px-4 py-2 sm:py-3 rounded-2xl break-words ${
                  message.role === "user"
                    ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-tr-sm shadow-md"
                    : "bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 text-gray-900 rounded-tl-sm border-2 border-emerald-300 shadow-lg"
                }`}
              >
                <p className="text-xs sm:text-sm leading-relaxed">{message.content}</p>
              </div>
              <span className="text-xs text-gray-500 px-2">{message.timestamp}</span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-emerald-400 to-teal-500 ring-2 ring-emerald-200 ring-offset-2 shadow-md">
              <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-2 border-emerald-300 px-3 sm:px-4 py-2 sm:py-3 rounded-2xl rounded-tl-sm shadow-lg">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-purple-200 p-3 sm:p-4 bg-white/50 flex-shrink-0">
        <div className="flex gap-2 w-full">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 min-w-0 px-3 sm:px-4 py-2 sm:py-3 border border-purple-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white text-sm sm:text-base"
            rows={1}
            disabled={isTyping}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-2 sm:p-3 rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex-shrink-0"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}