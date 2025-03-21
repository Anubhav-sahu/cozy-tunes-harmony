
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const JoinRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [isJoining, setIsJoining] = useState(true);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (loading) return;
    
    const joinRoom = async () => {
      try {
        if (!user) {
          // Save the room ID to join after auth
          sessionStorage.setItem('joinRoomAfterAuth', roomId);
          toast.info('Please sign in to join the music room');
          navigate('/');
          return;
        }
        
        // In a real implementation, we would validate the room ID
        // and join the room in the database
        
        // Redirect to the main page with the room ID
        localStorage.setItem('syncRoomId', roomId);
        toast.success('Joined music room successfully!');
        navigate('/');
      } catch (error) {
        console.error('Failed to join room:', error);
        toast.error('Failed to join the music room');
        navigate('/');
      } finally {
        setIsJoining(false);
      }
    };
    
    joinRoom();
  }, [roomId, user, loading, navigate]);
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] to-[#16213e]">
      <div className="glass-panel p-8 text-center max-w-md">
        <Loader2 size={40} className="mx-auto mb-4 animate-spin text-blue-400" />
        <h1 className="text-2xl font-bold text-white mb-2">Joining Music Room</h1>
        <p className="text-white/70">
          Please wait while we connect you to the shared music experience...
        </p>
      </div>
    </div>
  );
};

export default JoinRoom;
