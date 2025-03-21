
import React, { useEffect, useState } from 'react';
import { X, Bell } from 'lucide-react';
import { Notification } from '@/lib/types';
import { cn } from '@/lib/utils';

interface NotificationSystemProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({
  notifications,
  onDismiss
}) => {
  if (!notifications.length) return null;
  
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-md">
      {notifications.map((notification) => (
        <NotificationItem 
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
};

const NotificationItem: React.FC<{
  notification: Notification;
  onDismiss: (id: string) => void;
}> = ({ notification, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);
  
  useEffect(() => {
    if (notification.autoHide) {
      const timeout = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => onDismiss(notification.id), 300);
      }, 5000);
      
      return () => clearTimeout(timeout);
    }
  }, [notification, onDismiss]);
  
  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(notification.id), 300);
  };
  
  const bgColorClass = {
    info: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  }[notification.type];
  
  return (
    <div 
      className={cn(
        'p-4 rounded-lg shadow-lg text-white flex items-start gap-3 transition-all duration-300',
        bgColorClass,
        isExiting ? 'opacity-0 transform translate-x-full' : 'opacity-100'
      )}
    >
      <Bell size={20} />
      <div className="flex-1">
        <p className="font-medium">{notification.message}</p>
        <p className="text-xs text-white/80">
          {new Date(notification.timestamp).toLocaleTimeString()}
        </p>
      </div>
      <button 
        className="text-white/80 hover:text-white p-1"
        onClick={handleDismiss}
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default NotificationSystem;
