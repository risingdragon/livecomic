import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';

interface ImageDisplayProps {
  imageUrl?: string;
  isLoading: boolean;
}

export function ImageDisplay({ imageUrl, isLoading }: ImageDisplayProps) {
  const [displayUrl, setDisplayUrl] = useState<string | undefined>(imageUrl);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  useEffect(() => {
    if (imageUrl) {
      console.log("Loading image:", imageUrl); // Debug log
      setIsImageLoaded(false);
      // Small delay to trigger fade effect
      const img = new Image();
      img.src = imageUrl;
      img.onload = () => {
        console.log("Image loaded successfully:", imageUrl); // Debug log
        setDisplayUrl(imageUrl);
        setIsImageLoaded(true);
      };
      img.onerror = (e) => {
        console.error("Failed to load image:", imageUrl, e); // Debug log
      };
    }
  }, [imageUrl]);

  return (
    <div className="relative h-full w-full bg-gray-900 overflow-hidden flex items-center justify-center">
      {/* Grid Overlay Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_1px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>

      {/* Image Layer */}
      {displayUrl ? (
        <img 
          src={displayUrl} 
          alt="Game Scene" 
          className={cn(
            "w-full h-full object-cover transition-opacity duration-1000 ease-in-out",
            isImageLoaded ? "opacity-100" : "opacity-0"
          )}
        />
      ) : (
        <div className="text-gray-600 font-mono text-sm">
          [NO SIGNAL]
        </div>
      )}

      {/* Loading/Scanning Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
          <div className="w-full h-1 bg-green-500/20 absolute top-0 animate-[scan_2s_ease-in-out_infinite]"></div>
          <div className="text-green-500 font-mono animate-pulse">
            [SYSTEM: SYNCHRONIZING VISUAL DATA...]
          </div>
          <div className="mt-2 w-64 h-1 bg-gray-700 rounded-full overflow-hidden">
             <div className="h-full bg-green-500 animate-[progress_2s_ease-in-out_infinite]"></div>
          </div>
        </div>
      )}
      
      {/* Scanline Effect (always on top) */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20 bg-[size:100%_2px,3px_100%] opacity-20"></div>
    </div>
  );
}