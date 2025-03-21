
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Trash2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatMessage } from '@/lib/types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

interface ChatSectionProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onClearChat: () => void;
}

const ChatSection: React.FC<ChatSectionProps> = ({
  messages,
  onSendMessage,
  onClearChat
}) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };
  
  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="glass-panel h-full flex flex-col">
      <Tabs defaultValue="messages" className="w-full h-full flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <TabsList className="grid grid-cols-1 bg-white/10">
            <TabsTrigger value="messages" className="text-white">
              <MessageCircle size={18} className="mr-2" />
              Chat
            </TabsTrigger>
          </TabsList>
          
          <button
            className="text-white/70 hover:text-white transition-colors"
            onClick={onClearChat}
            title="Clear chat"
          >
            <Trash2 size={16} />
          </button>
        </div>
        
        <TabsContent value="messages" className="flex-1 flex flex-col px-0 mt-0 h-full">
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
                <div
                  key={msg.id}
                  className={cn(
                    "max-w-[80%] mb-2 p-2 rounded-lg",
                    msg.sender === 'me'
                      ? "bg-blue-500/80 ml-auto rounded-br-none"
                      : "bg-white/10 rounded-bl-none"
                  )}
                >
                  <p className="text-white text-sm">{msg.text}</p>
                  <p className="text-right text-white/60 text-xs mt-1">
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Chat Input */}
          <form 
            className="p-3 border-t border-white/10 flex items-center gap-2"
            onSubmit={handleSubmit}
          >
            <Textarea
              placeholder="Type a message..."
              className="flex-1 bg-white/10 text-white border-none outline-none rounded-lg px-4 py-2 text-sm min-h-[40px] max-h-[120px]"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChatSection;
