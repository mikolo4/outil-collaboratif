import React, { useRef, useEffect } from 'react';

interface VideoPlayerProps {
  url: string;
  onTimeUpdate: (currentTime: number) => void;
  onLoadedMetadata: (duration: number) => void;
  setVideoRef: (ref: HTMLVideoElement | null) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, onTimeUpdate, onLoadedMetadata, setVideoRef }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (setVideoRef) {
      setVideoRef(videoRef.current);
    }
  }, [setVideoRef]);

  return (
    <div className="relative rounded-lg overflow-hidden bg-black shadow-lg aspect-video group">
      <video
        ref={videoRef}
        src={url}
        className="w-full h-full object-contain"
        controls
        onTimeUpdate={() => {
            if(videoRef.current) onTimeUpdate(videoRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
            if(videoRef.current) onLoadedMetadata(videoRef.current.duration);
        }}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
};
