
import React, { useState, useRef } from 'react';
import { Upload, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Song } from '@/lib/types';
import { toast } from 'sonner';

interface UploadSongProps {
  onSongUpload: (song: Song) => void;
}

const UploadSong: React.FC<UploadSongProps> = ({ onSongUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUploadArea, setShowUploadArea] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  };
  
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };
  
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const processFiles = async (files: FileList) => {
    setIsProcessing(true);
    
    // Process each audio file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check if file is an audio file
      if (!file.type.startsWith('audio/')) {
        toast.error(`${file.name} is not an audio file`);
        continue;
      }
      
      try {
        // Create object URL for the file
        const songUrl = URL.createObjectURL(file);
        
        // Extract metadata from the file
        const { title, artist, duration } = await extractMetadata(file, songUrl);
        
        // Create song object
        const song: Song = {
          id: `song_${Date.now()}_${i}`,
          title,
          artist,
          duration,
          src: songUrl,
          favorite: false,
        };
        
        // Pass song to parent component
        onSongUpload(song);
        
        toast.success(`Added "${song.title}" to your playlist`);
      } catch (error) {
        console.error('Failed to process audio file:', error);
        toast.error(`Failed to process ${file.name}`);
      }
    }
    
    setIsProcessing(false);
    setShowUploadArea(false);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const extractMetadata = (file: File, url: string): Promise<{ title: string, artist: string, duration: number }> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      
      audio.onloadedmetadata = () => {
        // Get duration from audio element
        const duration = audio.duration;
        
        // Try to extract title and artist from filename
        const filename = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
        let title = filename;
        let artist = 'Unknown Artist';
        
        // Check for common separator patterns in filename
        const separators = [' - ', ' – ', ' _ ', ' by '];
        for (const separator of separators) {
          if (filename.includes(separator)) {
            const parts = filename.split(separator);
            if (parts.length >= 2) {
              artist = parts[0].trim();
              title = parts[1].trim();
              break;
            }
          }
        }
        
        resolve({ title, artist, duration });
      };
      
      audio.onerror = () => {
        reject(new Error('Failed to load audio metadata'));
      };
      
      audio.src = url;
    });
  };
  
  return (
    <>
      <button
        className="glass-button px-4 py-2"
        onClick={() => setShowUploadArea(prev => !prev)}
      >
        <Upload size={18} className="inline mr-2" />
        {showUploadArea ? 'Cancel' : 'Upload Music'}
      </button>
      
      {showUploadArea && (
        <div
          className={cn(
            "glass-panel mt-4 p-6 border-2 border-dashed transition-colors duration-300 animate-fade-in",
            isDragging ? "border-blue-400" : "border-white/30"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="audio/*"
            multiple
            onChange={handleFileInputChange}
          />
          
          <div className="text-center">
            {isProcessing ? (
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-white text-lg font-medium">Processing audio...</p>
              </div>
            ) : (
              <>
                <Upload size={40} className="mx-auto mb-3 text-white/70" />
                <h3 className="text-white text-lg font-medium mb-2">
                  {isDragging ? 'Drop your music here' : 'Drag and drop your music here'}
                </h3>
                <p className="text-white/70 text-sm mb-4">
                  or
                </p>
                <button
                  className="glass-button px-4 py-2"
                  onClick={handleButtonClick}
                >
                  Browse Files
                </button>
                <p className="text-white/50 text-xs mt-4">
                  Supported formats: MP3, WAV, AAC, OGG
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default UploadSong;
