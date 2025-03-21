
import React, { useState, useRef } from 'react';
import { Upload, Image, Trash2, Sliders, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BackgroundUploadProps {
  onBackgroundChange: (url: string | null) => void;
  onBlurChange: (blur: number) => void;
  onDarknessChange: (darkness: number) => void;
  onToggleFullscreen: () => void;
  isFullscreenMode: boolean;
  blur: number;
  darkness: number;
}

const BackgroundUpload: React.FC<BackgroundUploadProps> = ({
  onBackgroundChange,
  onBlurChange,
  onDarknessChange,
  onToggleFullscreen,
  isFullscreenMode,
  blur,
  darkness
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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
      processFile(files[0]);
    }
  };
  
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };
  
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const processFile = (file: File) => {
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    try {
      // Create object URL for the file
      const imageUrl = URL.createObjectURL(file);
      
      // Pass background to parent component
      onBackgroundChange(imageUrl);
      
      toast.success('Background updated');
    } catch (error) {
      console.error('Failed to process image file:', error);
      toast.error('Failed to process the image');
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const resetBackground = () => {
    onBackgroundChange(null);
    toast.success('Background reset');
  };
  
  return (
    <div className="glass-panel p-4">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setShowSettings(prev => !prev)}
      >
        <div className="flex items-center">
          <Image size={20} className="text-white/80 mr-3" />
          <h3 className="text-white font-medium">Background</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="text-white/70 hover:text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFullscreen();
            }}
            title={isFullscreenMode ? "Exit fullscreen view" : "Enter fullscreen view"}
          >
            {isFullscreenMode ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          <svg 
            className={cn(
              "w-4 h-4 text-white/70 transition-transform duration-300",
              showSettings ? "transform rotate-180" : ""
            )} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {showSettings && (
        <div className="mt-4 animate-fade-in">
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center transition-colors duration-300 mb-4",
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
              accept="image/*"
              onChange={handleFileInputChange}
            />
            
            <Upload size={24} className="text-white/70 mb-2" />
            <p className="text-white/70 text-sm text-center mb-3">
              {isDragging ? 'Drop your image here' : 'Drag & drop an image or'}
            </p>
            <div className="flex gap-2">
              <button
                className="glass-button px-3 py-1 text-sm"
                onClick={handleButtonClick}
              >
                Browse Files
              </button>
              <button
                className="glass-button px-3 py-1 text-sm bg-white/10"
                onClick={resetBackground}
              >
                <Trash2 size={14} className="inline mr-1" />
                Reset
              </button>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <label className="text-white/80 text-sm flex items-center">
                <Sliders size={14} className="mr-1" />
                Blur
              </label>
              <span className="text-white/60 text-xs">{blur}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              value={blur}
              onChange={(e) => onBlurChange(parseInt(e.target.value))}
              className="w-full h-1 appearance-none bg-white/20 rounded-full outline-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.7) ${blur * 5}%, rgba(255,255,255,0.2) ${blur * 5}%, rgba(255,255,255,0.2) 100%)`
              }}
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-white/80 text-sm flex items-center">
                <Sliders size={14} className="mr-1" />
                Overlay Darkness
              </label>
              <span className="text-white/60 text-xs">{darkness}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="80"
              value={darkness}
              onChange={(e) => onDarknessChange(parseInt(e.target.value))}
              className="w-full h-1 appearance-none bg-white/20 rounded-full outline-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.7) ${darkness * 1.25}%, rgba(255,255,255,0.2) ${darkness * 1.25}%, rgba(255,255,255,0.2) 100%)`
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BackgroundUpload;
