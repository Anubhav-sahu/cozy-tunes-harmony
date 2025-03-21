
import { useState, useCallback } from 'react';
import { Notification } from '@/lib/types';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      id: `notification_${Date.now()}`,
      timestamp: Date.now(),
      ...notification,
      autoHide: notification.autoHide ?? true
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    return newNotification.id;
  }, []);
  
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);
  
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);
  
  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications
  };
};
