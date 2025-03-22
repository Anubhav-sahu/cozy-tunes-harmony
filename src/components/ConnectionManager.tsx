
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { connectionService } from '@/lib/supabase';
import { Users, UserPlus, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface ConnectionManagerProps {
  onSelectConnection: (roomId: string) => void;
}

interface ConnectionInfo {
  id: string;
  partnerId: string;
  partnerName: string;
  createdAt: string;
  lastActivity: string;
  active: boolean;
}

const ConnectionManager: React.FC<ConnectionManagerProps> = ({ onSelectConnection }) => {
  const [connections, setConnections] = useState<ConnectionInfo[]>([]);
  const [partnerEmail, setPartnerEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  
  // Load user's existing connections
  const loadConnections = async () => {
    if (!user) return;
    
    try {
      setIsLoadingConnections(true);
      setError('');
      const connectionsData = await connectionService.getActiveConnections(user.id);
      setConnections(connectionsData);
      
      if (connectionsData.length === 0) {
        // No connections found, but this isn't an error
        console.log("No active connections found for user");
      }
    } catch (error) {
      console.error('Failed to load connections:', error);
      toast.error('Failed to load your connections');
    } finally {
      setIsLoadingConnections(false);
    }
  };
  
  useEffect(() => {
    if (user) {
      loadConnections();
    }
  }, [user]);
  
  const handleCreateConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !partnerEmail.trim()) return;
    
    // Check if user is attempting to connect with themselves
    if (user.email && user.email.toLowerCase() === partnerEmail.toLowerCase()) {
      setError("You cannot connect with yourself");
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      // Validate that the email exists in the system
      const emailExists = await connectionService.checkUserExists(partnerEmail);
      
      if (!emailExists) {
        setError(`User with email ${partnerEmail} not found. Make sure they have registered.`);
        return;
      }
      
      const connection = await connectionService.createConnection(user.id, partnerEmail);
      toast.success(`Connection with ${partnerEmail} created!`);
      setPartnerEmail('');
      setIsDialogOpen(false);
      
      // Refresh connections
      loadConnections();
    } catch (error: any) {
      console.error('Failed to create connection:', error);
      setError(error.message || 'Failed to create connection');
      toast.error(error.message || 'Failed to create connection');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSelectConnection = (roomId: string) => {
    onSelectConnection(roomId);
    toast.success('Connected! You can now sync music and chat.');
  };
  
  if (!user) {
    return null;
  }
  
  return (
    <div className="glass-panel p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-medium flex items-center">
          <Users size={18} className="mr-2" />
          Your Connections
        </h3>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-white"
            onClick={loadConnections}
            disabled={isLoadingConnections}
          >
            <RefreshCw size={16} className={isLoadingConnections ? "animate-spin" : ""} />
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="bg-blue-500/30 hover:bg-blue-500/50">
                <UserPlus size={16} className="mr-2" />
                Add Connection
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900/95 border-gray-800 text-white">
              <DialogHeader>
                <DialogTitle>Connect with a Friend</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleCreateConnection} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label htmlFor="partnerEmail" className="text-sm text-white/70">
                    Friend's Email
                  </label>
                  <Input
                    id="partnerEmail"
                    type="email"
                    value={partnerEmail}
                    onChange={(e) => setPartnerEmail(e.target.value.trim())}
                    placeholder="Enter their email address"
                    className="bg-white/10 border-white/20"
                    required
                  />
                </div>
                
                {error && (
                  <div className="p-3 rounded bg-red-900/30 border border-red-500/30 flex items-start text-red-200 text-sm">
                    <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full bg-blue-500 hover:bg-blue-600"
                  disabled={isLoading || !partnerEmail.trim()}
                >
                  {isLoading ? (
                    <RefreshCw size={16} className="mr-2 animate-spin" />
                  ) : (
                    <UserPlus size={16} className="mr-2" />
                  )}
                  Connect
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="space-y-3 mt-4">
        {isLoadingConnections ? (
          <div className="flex justify-center py-4">
            <RefreshCw size={20} className="animate-spin text-white/60" />
          </div>
        ) : connections.length === 0 ? (
          <div className="text-center py-4 text-white/60">
            <p>No connections yet</p>
            <p className="text-sm mt-2">
              Add a connection to sync music and chat with friends
            </p>
          </div>
        ) : (
          connections.map((connection) => (
            <div 
              key={connection.id}
              className="bg-white/10 rounded-lg p-3 hover:bg-white/15 transition-colors cursor-pointer"
              onClick={() => handleSelectConnection(connection.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-blue-500/50 flex items-center justify-center mr-3">
                    <Users size={16} />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{connection.partnerName}</h4>
                    <p className="text-white/60 text-xs">
                      {new Date(connection.lastActivity).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="bg-blue-500/20 hover:bg-blue-500/40 text-white"
                >
                  Connect
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConnectionManager;
