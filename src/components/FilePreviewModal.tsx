'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileItem } from '@/lib/api';
import { formatBytes, formatDate, getFileIconComponent, getFileCategory } from '@/lib/utils';
import {
  X,
  Download,
  Share2,
  Star,
  Edit,
  Trash2,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';

interface FilePreviewModalProps {
  file: FileItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (file: FileItem) => void;
  onShare: (file: FileItem) => void;
  onStar: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
  onRename: (file: FileItem) => void;
  files?: FileItem[];
  currentIndex?: number;
  onNavigate?: (direction: 'prev' | 'next') => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  isOpen,
  onClose,
  onDownload,
  onShare,
  onStar,
  onDelete,
  onRename,
  files = [],
  currentIndex = 0,
  onNavigate
}) => {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (isOpen && file) {
      setZoom(100);
      setRotation(0);
      setIsPlaying(false);
      setIsMuted(false);
    }
  }, [isOpen, file]);

  if (!file) return null;

  const fileIcon = getFileIconComponent(file.mimeType || '');
  const Icon = fileIcon.icon;
  const isImage = file.mimeType?.startsWith('image/');
  const isVideo = file.mimeType?.startsWith('video/');
  const isAudio = file.mimeType?.startsWith('audio/');
  const isPDF = file.mimeType === 'application/pdf';
  const isText = file.mimeType?.startsWith('text/') || 
                 file.mimeType?.includes('json') ||
                 file.mimeType?.includes('xml');

  const canNavigate = files.length > 1 && onNavigate;
  const hasPrev = canNavigate && currentIndex > 0;
  const hasNext = canNavigate && currentIndex < files.length - 1;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 25));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const renderPreview = () => {
    if (isImage) {
      return (
        <div className="relative flex items-center justify-center h-full bg-black/5 rounded-lg overflow-hidden">
          <img
            src={file.url || file.thumbnailUrl || '/placeholder-image.png'}
            alt={file.name}
            className="max-w-full max-h-full object-contain transition-transform duration-200"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`
            }}
          />
          
          {/* Image Controls */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-2 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 25}
              className="text-white hover:bg-white/20"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-white text-sm font-medium min-w-12 text-center">
              {zoom}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 300}
              className="text-white hover:bg-white/20"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <div className="w-px h-4 bg-white/30" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRotate}
              className="text-white hover:bg-white/20"
            >
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      );
    }

    if (isVideo) {
      return (
        <div className="relative flex items-center justify-center h-full bg-black/5 rounded-lg overflow-hidden">
          <video
            src={file.url}
            controls
            className="max-w-full max-h-full"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    if (isAudio) {
      return (
        <div className="flex flex-col items-center justify-center h-full space-y-6">
          <div className="w-32 h-32 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center">
            <Volume2 className="w-16 h-16 text-white" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">{file.name}</h3>
            <p className="text-muted-foreground">Audio file</p>
          </div>
          <audio
            src={file.url}
            controls
            className="w-full max-w-md"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          >
            Your browser does not support the audio tag.
          </audio>
        </div>
      );
    }

    if (isPDF) {
      return (
        <div className="h-full">
          <iframe
            src={file.url}
            className="w-full h-full rounded-lg"
            title={file.name}
          />
        </div>
      );
    }

    if (isText) {
      return (
        <div className="h-full bg-muted/30 rounded-lg p-6 overflow-auto">
          <pre className="text-sm font-mono whitespace-pre-wrap">
            {/* Text content would be loaded here */}
            Loading text content...
          </pre>
        </div>
      );
    }

    // Default preview for unsupported files
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6">
        <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center">
          <Icon className={`w-10 h-10 ${fileIcon.color}`} />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">{file.name}</h3>
          <p className="text-muted-foreground mb-4">Preview not available</p>
          <Button onClick={() => onDownload(file)} className="btn-premium">
            <Download className="w-4 h-4 mr-2" />
            Download to view
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0">
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 flex items-center justify-center">
              <Icon className={`w-6 h-6 ${fileIcon.color}`} />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">{file.name}</DialogTitle>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>{formatBytes(file.size)}</span>
                <span>•</span>
                <span>Modified {formatDate(file.updatedAt)}</span>
                {file.isStarred && (
                  <>
                    <span>•</span>
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Navigation */}
            {canNavigate && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate('prev')}
                  disabled={!hasPrev}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentIndex + 1} of {files.length}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate('next')}
                  disabled={!hasNext}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <div className="w-px h-4 bg-border mx-2" />
              </>
            )}

            {/* Actions */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInfo(!showInfo)}
            >
              <Info className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onStar(file)}
            >
              <Star className={`w-4 h-4 ${file.isStarred ? 'text-yellow-500 fill-current' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onShare(file)}
            >
              <Share2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDownload(file)}
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Preview Area */}
          <div className="flex-1 p-4">
            {renderPreview()}
          </div>

          {/* Info Panel */}
          {showInfo && (
            <div className="w-80 border-l bg-muted/30 p-4 overflow-auto">
              <h3 className="font-semibold mb-4">File Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-sm break-all">{file.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Size</label>
                  <p className="text-sm">{formatBytes(file.size)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <p className="text-sm">{file.mimeType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-sm">{formatDate(file.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Modified</label>
                  <p className="text-sm">{formatDate(file.updatedAt)}</p>
                </div>
                {file.description && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                    <p className="text-sm">{file.description}</p>
                  </div>
                )}
                <div className="pt-4 border-t">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{getFileCategory(file.mimeType || '')}</Badge>
                    {file.isStarred && <Badge variant="warning">Starred</Badge>}
                    {file.isShared && <Badge variant="info">Shared</Badge>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
