
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatMessage } from '@/lib/types';

// Individual message bubble props
interface MessageBubbleProps {
  message: string;
  sender: "me" | "partner";
  timestamp: number;
}

// Main chat bubble component props
interface ChatBubbleProps {
  isOpen: boolean;
  messages: ChatMessage[];
  unreadCount: number;
  onToggleChat: () => void;
  onSendMessage: (text: string) => void;
  onClearChat: () => void;
}

// Message bubble sub-component
const MessageBubble: React.FC<MessageBubbleProps> = ({ message, sender, timestamp }) => {
  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div
      className={cn(
        "max-w-[80%] mb-2 p-2 rounded-lg",
        sender === 'me'
          ? "bg-blue-500/80 ml-auto rounded-br-none"
          : "bg-white/10 rounded-bl-none"
      )}
    >
      <p className="text-white text-sm">{message}</p>
      <p className="text-right text-white/60 text-xs mt-1">
        {formatTime(timestamp)}
      </p>
    </div>
  );
};

const ChatBubble: React.FC<ChatBubbleProps> = ({
  isOpen,
  messages,
  unreadCount,
  onToggleChat,
  onSendMessage,
  onClearChat
}) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };
  
  if (!isOpen) {
    return (
      <button
        className={cn(
          "fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg z-50 animate-float float-shadow transition-all duration-300",
          unreadCount > 0 
            ? "bg-blue-500 hover:bg-blue-600" 
            : "glass-button"
        )}
        onClick={onToggleChat}
      >
        <MessageCircle size={24} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
            {unreadCount}
          </span>
        )}
      </button>
    );
  }
  
  return (
    <div className="fixed bottom-6 right-6 glass-panel w-72 h-96 shadow-xl z-50 flex flex-col animate-scale-in float-shadow">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <h3 className="text-white font-medium flex items-center">
          <MessageCircle size={18} className="mr-2" />
          Chat
        </h3>
        <div className="flex items-center gap-2">
          <button
            className="text-white/70 hover:text-white transition-colors"
            onClick={onClearChat}
            title="Clear chat"
          >
            <Trash2 size={16} />
          </button>
          <button
            className="text-white/70 hover:text-white transition-colors"
            onClick={onToggleChat}
            title="Close chat"
          >
            <X size={18} />
          </button>
        </div>
      </div>
      
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/50 text-center">
            <MessageCircle size={30} className="mb-2" />
            <p>No messages yet</p>
            <p className="text-xs">Send a message to your partner</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg.text}
              sender={msg.sender}
              timestamp={msg.timestamp}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Chat Input */}
      <form 
        className="p-3 border-t border-white/10 flex items-center gap-2"
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          ref={inputRef}
          placeholder="Type a message..."
          className="flex-1 bg-white/10 text-white border-none outline-none rounded-full px-4 py-2 text-sm"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button
          type="submit"
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
            message.trim()
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-white/10 text-white/50 cursor-not-allowed"
          )}
          disabled={!message.trim()}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default ChatBubble;
