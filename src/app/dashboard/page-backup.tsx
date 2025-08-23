'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sidebar } from '@/components/Sidebar';
import { SearchBar } from '@/components/SearchBar';
import { FileGrid } from '@/components/FileGrid';
import { FileUpload } from '@/components/FileUpload';
import { FilePreviewModal } from '@/components/FilePreviewModal';
import { ShareModal } from '@/components/ShareModal';
import { CreateFolderModal } from '@/components/CreateFolderModal';
import { SettingsModal } from '@/components/SettingsModal';
import { apiClient, FileItem, FolderItem } from '@/lib/api';
import { formatBytes, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Upload,
  FolderPlus,
  Grid3X3,
  List,
  Filter,
  SortAsc,
  SortDesc,
  MoreVertical,
  Star,
  Download,
  Share2,
  Trash2,
  User,
  Settings,
  LogOut,
  File,
  Folder,
  Image,
  Video,
  Music,
  FileText,
  HardDrive,
  Archive,
  Eye,
  Loader2,
  RefreshCw,
  ChevronRight,
  Home,
  Activity,
  TrendingUp,
  Cloud,
  Sparkles,
  Bell,
  Search,
  Plus
} from 'lucide-react';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal states
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [shareItem, setShareItem] = useState<{ item: FileItem | FolderItem; type: 'file' | 'folder' } | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Data states with localStorage persistence
  const [files, setFiles] = useState<FileItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('drive-files');
      return saved ? JSON.parse(saved) : [
        {
          id: '1',
          name: 'Project Proposal.pdf',
          size: 2048576,
          mimeType: 'application/pdf',
          url: '/api/files/1/download',
          isStarred: true,
          isShared: false,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
    }
    return [];
  });
  
  const [folders, setFolders] = useState<FolderItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('drive-folders');
      return saved ? JSON.parse(saved) : [
        {
          id: '2',
          name: 'Documents',
          itemCount: 24,
          isStarred: false,
          isShared: true,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
    }
    return [];
  });
  
  const [currentFolder, setCurrentFolder] = useState<FolderItem | null>(null);
  
  // Save to localStorage whenever data changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('drive-files', JSON.stringify(files));
    }
  }, [files]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('drive-folders', JSON.stringify(folders));
    }
  }, [folders]);

  // Backend connection check
  const [backendConnected, setBackendConnected] = useState(false);
  
  useEffect(() => {
    const checkBackendConnection = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/health`);
        setBackendConnected(response.ok);
        if (response.ok) {
          toast.success('Backend connected successfully!');
        }
      } catch (error) {
        setBackendConnected(false);
        console.log('Backend not available, using local storage mode');
      }
    };
    
    checkBackendConnection();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    setIsUploading(true);
    
    try {
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        
        if (backendConnected) {
          // Try backend upload first
          try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await apiClient.post('/files/upload', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            const newFile: FileItem = response.data;
            setFiles(prev => [...prev, newFile]);
            toast.success(`${file.name} uploaded successfully`);
          } catch (apiError) {
            // Fall back to local storage
            const newFile: FileItem = {
              id: Date.now().toString() + i,
              name: file.name,
              size: file.size,
              mimeType: file.type,
              url: URL.createObjectURL(file),
              isStarred: false,
              isShared: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            
            setFiles(prev => [...prev, newFile]);
            toast.success(`${file.name} uploaded locally (backend unavailable)`);
          }
        } else {
          // Local storage mode
          const newFile: FileItem = {
            id: Date.now().toString() + i,
            name: file.name,
            size: file.size,
            mimeType: file.type,
            url: URL.createObjectURL(file),
            isStarred: false,
            isShared: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          setFiles(prev => [...prev, newFile]);
          toast.success(`${file.name} uploaded locally`);
        }
      }
    } catch (error) {
      toast.error('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleCreateFolder = async () => {
    const folderName = prompt('Enter folder name:');
    if (!folderName || !folderName.trim()) return;

    try {
      if (backendConnected) {
        // Try backend creation first
        try {
          const response = await apiClient.post('/folders', { name: folderName.trim() });
          const newFolder: FolderItem = response.data;
          setFolders(prev => [...prev, newFolder]);
          toast.success(`Folder "${folderName}" created successfully`);
        } catch (apiError) {
          // Fall back to local storage
          const newFolder: FolderItem = {
            id: Date.now().toString(),
            name: folderName.trim(),
            itemCount: 0,
            isStarred: false,
            isShared: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          setFolders(prev => [...prev, newFolder]);
          toast.success(`Folder "${folderName}" created locally (backend unavailable)`);
        }
      } else {
        // Local storage mode
        const newFolder: FolderItem = {
          id: Date.now().toString(),
          name: folderName.trim(),
          itemCount: 0,
          isStarred: false,
          isShared: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        setFolders(prev => [...prev, newFolder]);
        toast.success(`Folder "${folderName}" created locally`);
      }
    } catch (error) {
      toast.error('Failed to create folder. Please try again.');
    }
  };

  const handleDeleteItem = async (id: string, type: 'file' | 'folder') => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      if (backendConnected) {
        // Try backend deletion first
        try {
          await apiClient.delete(`/${type}s/${id}`);
          if (type === 'file') {
            setFiles(prev => prev.filter(f => f.id !== id));
          } else {
            setFolders(prev => prev.filter(f => f.id !== id));
          }
          toast.success(`${type} deleted successfully`);
        } catch (apiError) {
          // Fall back to local deletion
          if (type === 'file') {
            setFiles(prev => prev.filter(f => f.id !== id));
          } else {
            setFolders(prev => prev.filter(f => f.id !== id));
          }
          toast.success(`${type} deleted locally (backend unavailable)`);
        }
      } else {
        // Local storage mode
        if (type === 'file') {
          setFiles(prev => prev.filter(f => f.id !== id));
        } else {
          setFolders(prev => prev.filter(f => f.id !== id));
        }
        toast.success(`${type} deleted locally`);
      }
    } catch (error) {
      toast.error(`Failed to delete ${type}. Please try again.`);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.startsWith('image/')) return '🖼️';
    if (mimeType?.includes('presentation')) return '📊';
    if (mimeType?.includes('spreadsheet')) return '📈';
    if (mimeType?.includes('document')) return '📄';
    if (mimeType?.startsWith('video/')) return '🎥';
    if (mimeType?.startsWith('audio/')) return '🎵';
    if (mimeType?.includes('pdf')) return '📕';
    if (mimeType?.includes('zip') || mimeType?.includes('archive')) return '📦';
    return '📄';
  };

  const storageUsed = files.reduce((total, file) => total + file.size, 0);
  const storageLimit = 15 * 1024 * 1024 * 1024; // 15GB
  const storagePercentage = (storageUsed / storageLimit) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="flex h-screen">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="glass-card border-b border-border/50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  My Drive
                </h1>
                {!backendConnected && (
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                    Local Mode
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-4">
                <SearchBar 
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search files and folders..."
                />
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
                  </Button>
                  
                  <Avatar className="w-8 h-8 cursor-pointer" onClick={() => setShowSettings(true)}>
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm">
                      {user?.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            <main className="flex-1 overflow-auto p-6">
              {/* Action Bar */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    onClick={() => document.getElementById('file-upload')?.click()}
                    disabled={isUploading}
                    className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white"
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    {isUploading ? 'Uploading...' : 'Upload'}
                  </Button>
                  
                  <Button variant="outline" onClick={handleCreateFolder}>
                    <FolderPlus className="w-4 h-4 mr-2" />
                    New Folder
                  </Button>
                </div>
              </div>

              {/* Storage Info */}
              <div className="glass-card p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Storage</span>
                  <span className="text-sm text-muted-foreground">
                    {formatBytes(storageUsed)} of {formatBytes(storageLimit)} used
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                  />
                </div>
              </div>

              {/* Files and Folders */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      className="glass-card p-4 hover:bg-accent/50 transition-all duration-200 cursor-pointer group"
                      onClick={() => setCurrentFolder(folder)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <Folder className="w-8 h-8 text-blue-500" />
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {folder.isStarred && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                          {folder.isShared && <Share2 className="w-4 h-4 text-blue-500" />}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-6 h-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteItem(folder.id, 'folder');
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground truncate mb-1">{folder.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {folder.itemCount} items • {formatDate(folder.updatedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="glass-card p-4 hover:bg-accent/50 transition-all duration-200 cursor-pointer group"
                      onClick={() => setPreviewFile(file)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-2xl">{getFileIcon(file.mimeType)}</div>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {file.isStarred && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                          {file.isShared && <Share2 className="w-4 h-4 text-blue-500" />}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-6 h-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteItem(file.id, 'file');
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground truncate mb-1">{file.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(file.size)} • {formatDate(file.updatedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-card">
                  <div className="divide-y divide-border/50">
                    {[...folders, ...files].map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors cursor-pointer group"
                        onClick={() => 'itemCount' in item ? setCurrentFolder(item) : setPreviewFile(item)}
                      >
                        <div className="flex items-center flex-1">
                          <div className="flex items-center mr-4">
                            {'itemCount' in item ? (
                              <Folder className="w-5 h-5 text-blue-500" />
                            ) : (
                              <File className="w-5 h-5 text-muted-foreground" />
                            )}
                            <span className="ml-2 text-lg">
                              {'itemCount' in item ? '📁' : getFileIcon((item as FileItem).mimeType)}
                            </span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-foreground">{item.name}</h3>
                            <p className="text-sm text-muted-foreground">Modified {formatDate(item.updatedAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-muted-foreground min-w-16">
                            {'itemCount' in item 
                              ? `${item.itemCount} items` 
                              : formatBytes((item as FileItem).size)
                            }
                          </span>
                          <div className="flex items-center space-x-1">
                            {item.isStarred && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                            {item.isShared && <Share2 className="w-4 h-4 text-blue-500" />}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="w-8 h-8 opacity-0 group-hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteItem(item.id, 'itemCount' in item ? 'folder' : 'file');
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {files.length === 0 && folders.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Cloud className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">No files yet</h3>
                  <p className="text-muted-foreground mb-6">Upload your first file to get started</p>
                  <Button
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Files
                  </Button>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* Modals */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
      
      {shareItem && (
        <ShareModal
          item={shareItem.item}
          type={shareItem.type}
          isOpen={!!shareItem}
          onClose={() => setShareItem(null)}
        />
      )}
      
      <CreateFolderModal
        isOpen={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
        onCreateFolder={handleCreateFolder}
      />
      
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}
