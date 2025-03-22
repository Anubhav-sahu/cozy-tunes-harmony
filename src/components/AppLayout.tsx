
import React from 'react';
import NotificationSystem from '@/components/NotificationSystem';
import { Notification } from '@/lib/types';

interface AppLayoutProps {
  children: React.ReactNode;
  backgroundImage: string | null;
  blurAmount: number;
  darknessAmount: number;
  notifications: Notification[];
  onDismissNotification: (id: string) => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  backgroundImage,
  blurAmount,
  darknessAmount,
  notifications,
  onDismissNotification
}) => {
  return (
    <div className="min-h-screen w-full overflow-x-hidden relative">
      {/* Background image */}
      <div className="bg-image-container">
        {backgroundImage ? (
          <img 
            src={backgroundImage} 
            alt="Background" 
            className="bg-image"
            style={{ filter: `blur(${blurAmount}px)` }}
          />
        ) : (
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] w-full h-full"></div>
        )}
        <div 
          className="bg-overlay"
          style={{ 
            background: `rgba(0,0,0,${darknessAmount / 100})` 
          }}
        ></div>
      </div>
      
      {/* Notification System */}
      <NotificationSystem 
        notifications={notifications} 
        onDismiss={onDismissNotification} 
      />
      
      {/* Main content */}
      {children}
    </div>
  );
};

export default AppLayout;
