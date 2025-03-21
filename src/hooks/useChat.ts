
import { useState, useEffect } from 'react';
import { ChatMessage } from '@/lib/types';
import { toast } from 'sonner';
import { chatService } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export const useChat = (syncRoomId: string | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { user } = useAuth();

  // Load initial messages
  useEffect(() => {
    if (syncRoomId && user) {
      const fetchMessages = async () => {
        try {
          const messagesData = await chatService.getMessages(syncRoomId);
          
          if (messagesData.length === 0) {
            // Initialize with welcome message
            const initialMessage: ChatMessage = {
              id: 'welcome',
              text: 'Chat is ready. Say hello to your partner!',
              sender: 'partner',
              timestamp: Date.now(),
            };
            
            await chatService.sendMessage({
              ...initialMessage,
              roomId: syncRoomId
            });
            
            setMessages([initialMessage]);
          } else {
            setMessages(messagesData);
          }
        } catch (error) {
          console.error('Failed to load chat messages:', error);
          toast.error('Failed to load chat messages');
        }
      };
      
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [syncRoomId, user]);

  // Subscribe to new messages
  useEffect(() => {
    if (!syncRoomId || !user) return;
    
    const subscription = chatService.subscribeToMessages(syncRoomId, (newMessage) => {
      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(msg => msg.id === newMessage.id)) {
          return prev;
        }
        return [...prev, newMessage];
      });
      
      // Show notification for partner messages
      if (newMessage.sender === 'partner') {
        toast.info(`New message: ${newMessage.text}`);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [syncRoomId, user]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !syncRoomId || !user) return;
    
    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      text,
      sender: 'me',
      timestamp: Date.now(),
      roomId: syncRoomId
    };
    
    // Optimistically update UI
    setMessages(prev => [...prev, newMessage]);
    
    try {
      await chatService.sendMessage(newMessage);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
      // Remove the message if it failed to send
      setMessages(prev => prev.filter(msg => msg.id !== newMessage.id));
    }
  };

  const clearChat = async () => {
    if (!syncRoomId || !user) return;
    
    try {
      await chatService.clearChat(syncRoomId);
      setMessages([]);
      toast.success('Chat cleared');
    } catch (error) {
      console.error('Failed to clear chat:', error);
      toast.error('Failed to clear chat');
    }
  };

  return {
    messages,
    sendMessage,
    clearChat,
  };
};
