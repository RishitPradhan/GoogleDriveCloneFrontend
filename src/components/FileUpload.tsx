'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { formatBytes, getFileCategory } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Upload,
  X,
  File,
  Image,
  Video,
  Music,
  FileText,
  Archive,
  CheckCircle,
  AlertCircle,
  Loader2,
  FolderOpen,
  Cloud
} from 'lucide-react';

interface FileUploadProps {
  isOpen: boolean;
  onClose: () => void;
  currentFolderId?: string;
  onUploadComplete?: () => void;
}

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

const getFileIcon = (file: File) => {
  const category = getFileCategory(file.type);
  switch (category) {
    case 'image': return <Image className="w-5 h-5 text-green-500" />;
    case 'video': return <Video className="w-5 h-5 text-red-500" />;
    case 'audio': return <Music className="w-5 h-5 text-purple-500" />;
    case 'pdf':
    case 'document':
    case 'text': return <FileText className="w-5 h-5 text-blue-500" />;
    case 'archive': return <Archive className="w-5 h-5 text-yellow-500" />;
    default: return <File className="w-5 h-5 text-gray-500" />;
  }
};

export const FileUpload: React.FC<FileUploadProps> = ({
  isOpen,
  onClose,
  currentFolderId,
  onUploadComplete
}) => {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const uploadIdCounter = useRef(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      id: `upload-${++uploadIdCounter.current}`,
      file,
      progress: 0,
      status: 'pending'
    }));

    setUploadFiles(prev => [...prev, ...newFiles]);
    setIsDragActive(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive: dropzoneActive } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    multiple: true,
    maxSize: 100 * 1024 * 1024, // 100MB
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
      'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.flv'],
      'audio/*': ['.mp3', '.wav', '.ogg', '.m4a'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'text/*': ['.txt', '.csv', '.json', '.xml', '.html', '.css', '.js', '.ts'],
      'application/zip': ['.zip'],
      'application/x-rar-compressed': ['.rar'],
      'application/x-7z-compressed': ['.7z']
    }
  });

  const uploadFile = async (uploadFile: UploadFile) => {
    const formData = new FormData();
    // Backend expects field name 'files' and supports multiple
    formData.append('files', uploadFile.file);
    if (currentFolderId) {
      formData.append('folderId', currentFolderId);
    }

    setUploadFiles(prev =>
      prev.map(f =>
        f.id === uploadFile.id
          ? { ...f, status: 'uploading', progress: 0 }
          : f
      )
    );

    try {
      await apiClient.uploadFile(formData, (progress) => {
        setUploadFiles(prev =>
          prev.map(f =>
            f.id === uploadFile.id
              ? { ...f, progress }
              : f
          )
        );
      });

      setUploadFiles(prev =>
        prev.map(f =>
          f.id === uploadFile.id
            ? { ...f, status: 'completed', progress: 100 }
            : f
        )
      );

      toast.success(`${uploadFile.file.name} uploaded successfully`);
    } catch (error: any) {
      setUploadFiles(prev =>
        prev.map(f =>
          f.id === uploadFile.id
            ? { ...f, status: 'error', error: error.message || 'Upload failed' }
            : f
        )
      );
      toast.error(`Failed to upload ${uploadFile.file.name}`);
    }
  };

  const startUpload = async () => {
    const pendingFiles = uploadFiles.filter(f => f.status === 'pending');
    
    // Upload files sequentially to avoid overwhelming the server
    for (const file of pendingFiles) {
      await uploadFile(file);
    }

    // Check if all uploads are complete
    const allComplete = uploadFiles.every(f => f.status === 'completed' || f.status === 'error');
    if (allComplete && onUploadComplete) {
      onUploadComplete();
    }
  };

  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const clearCompleted = () => {
    setUploadFiles(prev => prev.filter(f => f.status !== 'completed'));
  };

  const handleClose = () => {
    const hasUploading = uploadFiles.some(f => f.status === 'uploading');
    if (hasUploading) {
      if (confirm('Files are still uploading. Are you sure you want to close?')) {
        setUploadFiles([]);
        onClose();
      }
    } else {
      setUploadFiles([]);
      onClose();
    }
  };

  const totalFiles = uploadFiles.length;
  const completedFiles = uploadFiles.filter(f => f.status === 'completed').length;
  const errorFiles = uploadFiles.filter(f => f.status === 'error').length;
  const uploadingFiles = uploadFiles.filter(f => f.status === 'uploading').length;
  const pendingFiles = uploadFiles.filter(f => f.status === 'pending').length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            Upload Files
            {currentFolderId && (
              <span className="ml-2 text-sm text-muted-foreground flex items-center">
                <FolderOpen className="w-4 h-4 mr-1" />
                to current folder
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Drop Zone */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer
              ${isDragActive || dropzoneActive
                ? 'border-primary bg-primary/5 scale-105'
                : 'border-border hover:border-primary/50 hover:bg-accent/50'
              }
            `}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center space-y-4">
              <div className={`
                w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200
                ${isDragActive || dropzoneActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
                }
              `}>
                <Cloud className="w-8 h-8" />
              </div>
              <div>
                <p className="text-lg font-medium">
                  {isDragActive || dropzoneActive
                    ? 'Drop files here'
                    : 'Drag & drop files here'
                  }
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse • Max 100MB per file
                </p>
              </div>
            </div>
          </div>

          {/* Upload Queue */}
          {totalFiles > 0 && (
            <div className="mt-6 flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">
                  Upload Queue ({totalFiles} files)
                </h3>
                <div className="flex items-center space-x-2">
                  {completedFiles > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearCompleted}
                    >
                      Clear Completed
                    </Button>
                  )}
                  {pendingFiles > 0 && (
                    <Button
                      onClick={startUpload}
                      disabled={uploadingFiles > 0}
                      className="bg-gradient-to-r from-primary to-blue-600"
                    >
                      {uploadingFiles > 0 ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload All
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Progress Summary */}
              {(completedFiles > 0 || errorFiles > 0 || uploadingFiles > 0) && (
                <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>Overall Progress</span>
                    <span>{completedFiles}/{totalFiles} completed</span>
                  </div>
                  <Progress value={(completedFiles / totalFiles) * 100} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                    <span className="flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                      {completedFiles} completed
                    </span>
                    {errorFiles > 0 && (
                      <span className="flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1 text-destructive" />
                        {errorFiles} failed
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* File List */}
              <div className="flex-1 overflow-y-auto space-y-2">
                {uploadFiles.map((uploadFile) => (
                  <div
                    key={uploadFile.id}
                    className="flex items-center space-x-3 p-3 bg-card rounded-lg border"
                  >
                    <div className="flex-shrink-0">
                      {getFileIcon(uploadFile.file)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {uploadFile.file.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatBytes(uploadFile.file.size)}
                      </p>
                      
                      {uploadFile.status === 'uploading' && (
                        <div className="mt-2">
                          <Progress value={uploadFile.progress} className="h-1" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {uploadFile.progress}% uploaded
                          </p>
                        </div>
                      )}
                      
                      {uploadFile.status === 'error' && (
                        <p className="text-xs text-destructive mt-1">
                          {uploadFile.error}
                        </p>
                      )}
                    </div>

                    <div className="flex-shrink-0">
                      {uploadFile.status === 'completed' && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      {uploadFile.status === 'error' && (
                        <AlertCircle className="w-5 h-5 text-destructive" />
                      )}
                      {uploadFile.status === 'uploading' && (
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      )}
                      {uploadFile.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(uploadFile.id)}
                          className="w-8 h-8"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
