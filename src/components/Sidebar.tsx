'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { formatBytes } from '@/lib/utils';
import {
  Home,
  Star,
  Clock,
  Trash2,
  Share2,
  Cloud,
  Settings,
  HelpCircle,
  Plus,
  FolderPlus,
  Upload,
  Users,
  Shield,
  Zap,
  Crown,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Archive,
  Download,
  Activity,
  BarChart3,
  Bell,
  Gift,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onUpload: () => void;
  onCreateFolder: () => void;
  className?: string;
}

interface StorageInfo {
  used: number;
  total: number;
  percentage: number;
}

interface QuickAccess {
  id: string;
  name: string;
  type: 'folder' | 'file';
  path: string;
  icon?: React.ReactNode;
}

const navigationItems = [
  {
    id: 'home',
    label: 'My Drive',
    icon: <Home className="w-5 h-5" />,
    path: '/dashboard'
  },
  {
    id: 'shared',
    label: 'Shared with me',
    icon: <Users className="w-5 h-5" />,
    path: '/shared'
  },
  {
    id: 'recent',
    label: 'Recent',
    icon: <Clock className="w-5 h-5" />,
    path: '/recent'
  },
  {
    id: 'starred',
    label: 'Starred',
    icon: <Star className="w-5 h-5" />,
    path: '/starred'
  },
  {
    id: 'trash',
    label: 'Trash',
    icon: <Trash2 className="w-5 h-5" />,
    path: '/trash'
  }
];

const quickActions = [
  {
    id: 'upload',
    label: 'Upload files',
    icon: <Upload className="w-4 h-4" />,
    description: 'Add files to your drive'
  },
  {
    id: 'folder',
    label: 'New folder',
    icon: <FolderPlus className="w-4 h-4" />,
    description: 'Create a new folder'
  }
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  onUpload,
  onCreateFolder,
  className = ""
}) => {
  const { user, plan } = useAuth();
  const router = useRouter();
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({
    used: 0,
    total: 15 * 1024 * 1024 * 1024, // 15GB default
    percentage: 0
  });
  const [quickAccess, setQuickAccess] = useState<QuickAccess[]>([]);
  const [isQuickAccessExpanded, setIsQuickAccessExpanded] = useState(true);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Load storage info and quick access
  useEffect(() => {
    if (!(user as any)?.id) return; // wait until user id exists
    const loadSidebarData = async () => {
      try {
        // Load storage info
        const storage = await apiClient.getStorageInfo();
        // Derive total strictly from plan mapping to avoid unit mismatches
        const planGb = plan === 'business' ? 2000 : plan === 'pro' ? 200 : 15;
        const totalBytes = planGb * 1024 * 1024 * 1024;
        const usedBytes = Number(storage.used) || 0;
        const safeUsed = Math.max(0, Math.min(usedBytes, totalBytes));
        setStorageInfo({
          used: safeUsed,
          total: totalBytes,
          percentage: totalBytes > 0 ? (safeUsed / totalBytes) * 100 : 0,
        });

        // Load quick access folders
        const quickAccessData = await apiClient.getQuickAccess();
        setQuickAccess(quickAccessData);

        // Show upgrade prompt if storage is getting full (based on derived total)
        if (totalBytes > 0 && storage.used / totalBytes > 0.8) {
          setShowUpgradePrompt(true);
        }
      } catch (error: any) {
        // Suppress noisy log on unauthorized; dashboard wrapper will handle redirects
        if (error?.status === 401) return;
        const msg = error?.message || (typeof error === 'string' ? error : JSON.stringify(error ?? {}));
        console.error('Failed to load sidebar data:', msg);
      }
    };

    loadSidebarData();
  }, [(user as any)?.id]);

  // React to plan changes: adjust total and percentage (ignore storageLimit)
  useEffect(() => {
    const planGb = plan === 'business' ? 2000 : plan === 'pro' ? 200 : 15;
    const totalBytes = planGb * 1024 * 1024 * 1024;
    setStorageInfo(prev => {
      const safeUsed = Math.max(0, Math.min(prev.used, totalBytes));
      return {
        used: safeUsed,
        total: totalBytes,
        percentage: totalBytes > 0 ? (safeUsed / totalBytes) * 100 : 0,
      };
    });
  }, [plan]);

  // Optionally refetch used bytes when plan changes (backend may not change used)
  useEffect(() => {
    const refreshUsed = async () => {
      try {
        const storage = await apiClient.getStorageInfo();
        setStorageInfo(prev => ({
          used: storage.used,
          total: prev.total,
          percentage: prev.total > 0 ? (storage.used / prev.total) * 100 : 0,
        }));
      } catch {}
    };
    refreshUsed();
  }, [plan]);

  const handleQuickAction = (actionId: string) => {
    switch (actionId) {
      case 'upload':
        onUpload();
        break;
      case 'folder':
        onCreateFolder();
        break;
    }
  };

  const getStorageColor = () => {
    if (storageInfo.percentage > 90) return 'bg-red-500';
    if (storageInfo.percentage > 75) return 'bg-yellow-500';
    return 'bg-gradient-to-r from-primary to-blue-600';
  };

  const getStorageStatus = () => {
    if (storageInfo.percentage > 95) return 'Storage almost full';
    if (storageInfo.percentage > 85) return 'Storage getting full';
    if (storageInfo.percentage > 75) return 'Storage mostly used';
    return 'Storage available';
  };

  return (
    <div className={`flex flex-col min-h-[100dvh] bg-background/50 backdrop-blur-sm border-r ${className}`}>
      {/* Header with Create Button */}
      <div className="p-4 border-b">
        <Button
          onClick={onUpload}
          className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          New
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b">
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              size="sm"
              className="flex flex-col items-center p-3 h-auto hover:bg-accent/50 transition-all duration-200"
              onClick={() => handleQuickAction(action.id)}
              title={action.description}
            >
              {action.icon}
              <span className="text-xs mt-1 font-medium">{action.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <nav className="p-2">
          <div className="space-y-1">
            {navigationItems.map((item) => (
              <Button
                key={item.id}
                variant={currentView === item.id ? "default" : "ghost"}
                className={`w-full justify-start h-10 transition-all duration-200 ${
                  currentView === item.id 
                    ? 'bg-gradient-to-r from-primary to-blue-600 text-white shadow-md' 
                    : 'hover:bg-accent/50'
                }`}
                onClick={() => onViewChange(item.id)}
              >
                {item.icon}
                <span className="ml-3 font-medium">{item.label}</span>
              </Button>
            ))}
          </div>
        </nav>

        {/* Quick Access */}
        {quickAccess.length > 0 && (
          <div className="p-2 mt-4">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start h-8 text-muted-foreground hover:text-foreground mb-2"
              onClick={() => setIsQuickAccessExpanded(!isQuickAccessExpanded)}
            >
              {isQuickAccessExpanded ? (
                <ChevronDown className="w-4 h-4 mr-2" />
              ) : (
                <ChevronRight className="w-4 h-4 mr-2" />
              )}
              <span className="text-sm font-medium">Quick access</span>
            </Button>

            {isQuickAccessExpanded && (
              <div className="space-y-1 ml-2">
                {quickAccess.map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-8 text-sm hover:bg-accent/30"
                    onClick={() => onViewChange(`folder-${item.id}`)}
                  >
                    {item.type === 'folder' ? (
                      <Folder className="w-4 h-4 mr-2 text-primary" />
                    ) : (
                      item.icon || <Cloud className="w-4 h-4 mr-2" />
                    )}
                    <span className="truncate">{item.name}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Premium Features Teaser */}
        {plan === 'free' && (
          <div className="p-4 mt-6">
            <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-lg p-4 border border-yellow-500/20">
              <div className="flex items-center mb-2">
                <Crown className="w-5 h-5 text-yellow-500 mr-2" />
                <span className="font-semibold text-sm">Go Premium</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Unlock advanced features, more storage, and priority support
              </p>
              <div className="space-y-2 mb-3">
                <div className="flex items-center text-xs">
                  <Zap className="w-3 h-3 mr-2 text-yellow-500" />
                  <span>100GB+ storage</span>
                </div>
                <div className="flex items-center text-xs">
                  <Shield className="w-3 h-3 mr-2 text-blue-500" />
                  <span>Advanced security</span>
                </div>
                <div className="flex items-center text-xs">
                  <Activity className="w-3 h-3 mr-2 text-green-500" />
                  <span>Real-time collaboration</span>
                </div>
              </div>
              <Button
                size="sm"
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                onClick={() => router.push('/upgrade')}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Upgrade Now
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Storage Info */}
      <div className="p-4 border-t">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Storage</span>
            <Button variant="ghost" size="icon" className="w-6 h-6">
              <BarChart3 className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatBytes(storageInfo.used)} used</span>
              <span>{formatBytes(storageInfo.total)} total</span>
            </div>
            
            <div className="relative">
              <Progress 
                value={storageInfo.percentage} 
                className="h-2"
              />
              <div 
                className={`absolute top-0 left-0 h-2 rounded-full transition-all duration-300 ${getStorageColor()}`}
                style={{ width: `${Math.min(storageInfo.percentage, 100)}%` }}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              {getStorageStatus()}
            </p>
          </div>

          {showUpgradePrompt && (
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs border-primary/50 hover:bg-primary/5"
              onClick={() => setShowUpgradePrompt(false)}
            >
              <Cloud className="w-3 h-3 mr-2" />
              Get more storage
            </Button>
          )}
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-t">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
            {(((user as any)?.name || (user as any)?.email || 'U') as string).charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{(user as any)?.name || (user as any)?.email || 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{(user as any)?.email || ''}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
