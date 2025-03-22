
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Trash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatMessage } from '@/lib/types';
import ChatBubble from './ChatBubble';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';

interface ChatSectionProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onClearChat: () => void;
  onToggle: () => void;
  unreadCount: number;
}

const ChatSection: React.FC<ChatSectionProps> = ({
  messages,
  onSendMessage,
  onClearChat,
  onToggle,
  unreadCount = 0
}) => {
  const [messageText, setMessageText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isOpen]);
  
  // Focus input when chat is opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim()) {
      onSendMessage(messageText);
      setMessageText('');
    }
  };
  
  const handleToggle = () => {
    setIsOpen(prev => !prev);
    onToggle();
  };
  
  return (
    <div className={cn(
      "glass-panel transition-all duration-300 overflow-hidden",
      isOpen ? "h-[400px] flex flex-col" : "h-auto"
    )}>
      <div 
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={handleToggle}
      >
        <div className="flex items-center">
          <MessageSquare size={20} className="text-white/80 mr-2" />
          <h3 className="text-white font-medium">Chat</h3>
          
          {!isOpen && unreadCount > 0 && (
            <div className="ml-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount}
            </div>
          )}
        </div>
        
        {isOpen && (
          <Button
            variant="ghost"
            size="sm"
            title="Clear chat"
            onClick={(e) => {
              e.stopPropagation();
              onClearChat();
            }}
            className="text-white/60 hover:text-white/90"
          >
            <Trash size={16} />
          </Button>
        )}
      </div>
      
      {isOpen && (
        <>
          <div className="flex-1 p-4 animate-fade-in overflow-hidden">
            <ScrollArea className="h-[270px] pr-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-white/50 text-center">
                  <div>
                    <MessageSquare size={40} className="mx-auto mb-2 opacity-50" />
                    <p>No messages yet</p>
                    <p className="text-sm">Start chatting with your friend!</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <ChatBubble
                      key={message.id}
                      message={message.text}
                      sender={message.sender}
                      timestamp={message.timestamp}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>
          </div>
          
          <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="bg-white/10 border-white/20"
              />
              <Button type="submit" size="icon" disabled={!messageText.trim()}>
                <Send size={16} />
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default ChatSection;
