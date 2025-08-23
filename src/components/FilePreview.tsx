'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileItem } from '@/lib/api';
import { formatBytes, formatDate, getFileIconComponent, getFileCategory } from '@/lib/utils';
import {
  Download,
  Share2,
  Star,
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  File as FileIcon,
  ExternalLink,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';

interface FilePreviewProps {
  file: FileItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (file: FileItem) => void;
  onShare: (file: FileItem) => void;
  onStar: (file: FileItem) => void;
  files?: FileItem[]; // For navigation between files
}

const ImagePreview: React.FC<{ file: FileItem; onLoad?: () => void }> = ({ file, onLoad }) => {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div className="relative flex-1 flex items-center justify-center bg-black/5 rounded-lg overflow-hidden">
      <div className="absolute top-4 right-4 z-10 flex space-x-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setZoom(Math.max(25, zoom - 25))}
          disabled={zoom <= 25}
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setZoom(Math.min(400, zoom + 25))}
          disabled={zoom >= 400}
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setRotation(rotation + 90)}
        >
          <RotateCw className="w-4 h-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setIsFullscreen(!isFullscreen)}
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>

      <img
        src={file.downloadUrl || file.thumbnailUrl || ''}
        alt={file.name}
        className="max-w-full max-h-full object-contain transition-transform duration-200"
        style={{
          transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
          filter: isFullscreen ? 'none' : 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
        }}
        onLoad={onLoad}
      />

      {zoom !== 100 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
            {zoom}%
          </div>
        </div>
      )}
    </div>
  );
};

const VideoPreview: React.FC<{ file: FileItem; onLoad?: () => void }> = ({ file, onLoad }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(progress);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      onLoad?.();
    }
  };

  return (
    <div className="relative flex-1 flex items-center justify-center bg-black/5 rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        src={file.downloadUrl}
        className="max-w-full max-h-full"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-background/90 backdrop-blur-sm rounded-lg p-3">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" onClick={togglePlay}>
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            
            <div className="flex-1">
              <Progress value={progress} className="h-1" />
            </div>

            <Button variant="ghost" size="icon" onClick={toggleMute}>
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AudioPreview: React.FC<{ file: FileItem; onLoad?: () => void }> = ({ file, onLoad }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(progress);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      onLoad?.();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-full max-w-md">
        <audio
          ref={audioRef}
          src={file.downloadUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        <div className="bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-xl p-8 text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center">
            <Music className="w-12 h-12 text-white" />
          </div>

          <h3 className="text-lg font-semibold mb-2">{file.name}</h3>
          <p className="text-muted-foreground mb-6">{formatBytes(file.size)}</p>

          <div className="space-y-4">
            <Progress value={progress} className="h-2" />
            
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{formatTime((audioRef.current?.currentTime || 0))}</span>
              <span>{formatTime(duration)}</span>
            </div>

            <Button
              onClick={togglePlay}
              size="lg"
              className="w-full bg-gradient-to-r from-primary to-blue-600"
            >
              {isPlaying ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TextPreview: React.FC<{ file: FileItem; onLoad?: () => void }> = ({ file, onLoad }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadTextContent = async () => {
      try {
        if (file.downloadUrl) {
          const response = await fetch(file.downloadUrl);
          if (!response.ok) throw new Error('Failed to load file');
          const text = await response.text();
          setContent(text);
          onLoad?.();
        }
      } catch (err) {
        setError('Failed to load file content');
      } finally {
        setLoading(false);
      }
    };

    loadTextContent();
  }, [file.downloadUrl, onLoad]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading file content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-muted/20 rounded-lg p-6 overflow-auto">
      <pre className="whitespace-pre-wrap text-sm font-mono">{content}</pre>
    </div>
  );
};

const PdfPreview: React.FC<{ file: FileItem; onLoad?: () => void }> = ({ file, onLoad }) => {
  // Use an iframe to leverage the browser's native PDF viewer
  return (
    <div className="relative flex-1 flex items-center justify-center bg-black/5 rounded-lg overflow-hidden">
      {file.downloadUrl ? (
        <iframe
          title={file.name}
          src={`${file.downloadUrl}#toolbar=1&navpanes=0&statusbar=0&view=FitH`}
          className="w-full h-full"
          onLoad={onLoad}
        />
      ) : (
        <UnsupportedPreview file={file} />
      )}
    </div>
  );
};

const UnsupportedPreview: React.FC<{ file: FileItem }> = ({ file }) => {
  const { icon: Icon } = getFileIconComponent(file.mimeType || '');
  
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 mx-auto mb-6 bg-muted/30 rounded-full flex items-center justify-center">
          <Icon className="w-10 h-10" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{file.name}</h3>
        <p className="text-muted-foreground mb-6">
          Preview not available for this file type
        </p>
        <Button asChild className="bg-gradient-to-r from-primary to-blue-600">
          <a href={file.downloadUrl} download={file.name}>
            <Download className="w-4 h-4 mr-2" />
            Download to view
          </a>
        </Button>
      </div>
    </div>
  );
};

export const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  isOpen,
  onClose,
  onDownload,
  onShare,
  onStar,
  files = []
}) => {
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (file && files.length > 0) {
      const index = files.findIndex(f => f.id === file.id);
      setCurrentIndex(index >= 0 ? index : 0);
    }
  }, [file, files]);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
    }
  }, [isOpen, file]);

  if (!file) return null;

  const canNavigate = files.length > 1;
  const hasPrevious = canNavigate && currentIndex > 0;
  const hasNext = canNavigate && currentIndex < files.length - 1;

  const navigateToFile = (direction: 'prev' | 'next') => {
    if (!canNavigate) return;
    
    const newIndex = direction === 'prev' 
      ? Math.max(0, currentIndex - 1)
      : Math.min(files.length - 1, currentIndex + 1);
    
    setCurrentIndex(newIndex);
    // You would typically call a prop function here to change the file
    // For now, we'll just update the index
  };

  const getPreviewComponent = () => {
    const mimeType = file.mimeType || '';
    const category = getFileCategory(mimeType);

    switch (category) {
      case 'image':
        return <ImagePreview file={file} onLoad={() => setLoading(false)} />;
      case 'video':
        return <VideoPreview file={file} onLoad={() => setLoading(false)} />;
      case 'audio':
        return <AudioPreview file={file} onLoad={() => setLoading(false)} />;
      case 'text':
      case 'document':
        if (mimeType.includes('application/pdf') || mimeType.includes('pdf')) {
          return <PdfPreview file={file} onLoad={() => setLoading(false)} />;
        }
        if (mimeType.includes('text/') || mimeType.includes('json') || mimeType.includes('xml')) {
          return <TextPreview file={file} onLoad={() => setLoading(false)} />;
        }
        return <UnsupportedPreview file={file} />;
      default:
        return <UnsupportedPreview file={file} />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {(() => { const { icon: FileIconComp } = getFileIconComponent(file.mimeType || ''); return <FileIconComp className="w-5 h-5" />; })()}
              <div className="min-w-0 flex-1">
                <DialogTitle className="truncate">{file.name}</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {formatBytes(file.size)} • {formatDate(file.updatedAt)}
                  {file.owner && ` • ${file.owner.name}`}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-4">
              {canNavigate && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigateToFile('prev')}
                    disabled={!hasPrevious}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    {currentIndex + 1} of {files.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigateToFile('next')}
                    disabled={!hasNext}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => onStar(file)}
              >
                <Star className={`w-4 h-4 ${file.isStarred ? 'text-yellow-500 fill-current' : ''}`} />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => onShare(file)}
              >
                <Share2 className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDownload(file)}
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Preview Content */}
        <div className="flex-1 p-6 pt-4 min-h-[400px] flex flex-col">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-muted-foreground">Loading preview...</p>
              </div>
            </div>
          )}
          
          {getPreviewComponent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};
