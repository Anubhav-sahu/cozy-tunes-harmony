
import React from 'react';
import Auth from '@/components/Auth';

const LandingPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-12 relative z-10 flex flex-col items-center">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-bold text-white mb-2 tracking-tighter">
          Together<span className="text-blue-400">Play</span>
        </h1>
        <p className="text-white/70">Share music moments together</p>
      </header>
      
      <Auth />
    </div>
  );
};

export default LandingPage;
