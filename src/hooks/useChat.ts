
import { useState, useEffect } from 'react';
import { ChatMessage } from '@/lib/types';
import { toast } from 'sonner';

// Mock implementation of chat functionality using localStorage
// In a real app, you'd use WebSockets or Firebase Realtime Database
export const useChat = (syncRoomId: string | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Load initial messages
  useEffect(() => {
    if (syncRoomId) {
      try {
        const storedMessages = localStorage.getItem(`chat_${syncRoomId}`);
        if (storedMessages) {
          setMessages(JSON.parse(storedMessages));
        } else {
          // Initialize with welcome message
          const initialMessage: ChatMessage = {
            id: 'welcome',
            text: 'Chat is ready. Say hello to your partner!',
            sender: 'partner',
            timestamp: Date.now(),
          };
          setMessages([initialMessage]);
          localStorage.setItem(`chat_${syncRoomId}`, JSON.stringify([initialMessage]));
        }
      } catch (error) {
        console.error('Failed to load chat messages:', error);
      }
    } else {
      setMessages([]);
    }
  }, [syncRoomId]);

  // Save messages to storage whenever they change
  useEffect(() => {
    if (syncRoomId && messages.length > 0) {
      localStorage.setItem(`chat_${syncRoomId}`, JSON.stringify(messages));
    }
  }, [messages, syncRoomId]);

  // Listen for new messages (simulated with storage events)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (syncRoomId && e.key === `chat_${syncRoomId}` && e.newValue) {
        try {
          const newMessages = JSON.parse(e.newValue);
          setMessages(newMessages);
        } catch (error) {
          console.error('Failed to parse chat data:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [syncRoomId]);

  const sendMessage = (text: string) => {
    if (!text.trim() || !syncRoomId) return;
    
    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      text,
      sender: 'me',
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Simulate partner response (in a real app, this would come from WebSockets)
    setTimeout(() => {
      // 30% chance of getting a response
      if (Math.random() < 0.3) {
        const responses = [
          "I love this song!",
          "❤️",
          "Skip this one?",
          "This reminds me of our first date",
          "Turn up the volume!",
          "Let's listen to our playlist",
          "I miss you"
        ];
        
        const responseMessage: ChatMessage = {
          id: `msg_${Date.now()}`,
          text: responses[Math.floor(Math.random() * responses.length)],
          sender: 'partner',
          timestamp: Date.now(),
        };
        
        setMessages(prev => [...prev, responseMessage]);
      }
    }, 2000 + Math.random() * 5000);
  };

  const clearChat = () => {
    if (syncRoomId) {
      localStorage.removeItem(`chat_${syncRoomId}`);
      setMessages([]);
      toast.success('Chat cleared');
    }
  };

  return {
    messages,
    sendMessage,
    clearChat,
  };
};
