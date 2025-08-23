'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileItem, FolderItem, apiClient } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  X,
  Copy,
  Mail,
  Link,
  Globe,
  Lock,
  Users,
  Eye,
  Edit,
  Trash2,
  Settings,
  Calendar,
  Check,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ShareModalProps {
  item: FileItem | FolderItem | null;
  type: 'file' | 'folder' | null;
  isOpen: boolean;
  onClose: () => void;
  onShare: (permission: 'VIEW' | 'EDIT', expiresDays?: number) => Promise<void>;
  onUpdateShare: (id: string, data: any) => Promise<void>;
  onRevokeShare: (id: string) => Promise<void>;
}

interface ShareLink {
  id: string;
  shareUrl: string;
  permission: 'VIEW' | 'EDIT';
  expiresAt?: string;
  createdAt: string;
  isActive: boolean;
  accessCount: number;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  item,
  type,
  isOpen,
  onClose,
  onShare,
  onUpdateShare,
  onRevokeShare
}) => {
  const [permission, setPermission] = useState<'VIEW' | 'EDIT'>('VIEW');
  const [expiresDays, setExpiresDays] = useState<number | undefined>(30);
  const [isCreating, setIsCreating] = useState(false);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && item) {
      loadShareLinks();
    }
  }, [isOpen, item]);

  const loadShareLinks = async () => {
    if (!item) return;
    
    setIsLoading(true);
    try {
      const res: any = await apiClient.getMyShares({ page: 1, limit: 100 });
      const shares: any[] = res?.data?.shares ?? res?.shares ?? [];
      const filtered = shares.filter((s: any) => {
        const matchesType = (type === 'file' && s.type === 'file') || (type === 'folder' && s.type === 'folder');
        const resourceId = s.resource?.id;
        return matchesType && resourceId === item.id;
      });

      const mapped: ShareLink[] = filtered.map((s: any) => ({
        id: s.id,
        shareUrl: s.shareUrl,
        permission: (s.permission === 'edit' || s.permission === 'download') ? 'EDIT' : 'VIEW',
        expiresAt: s.expiresAt,
        createdAt: s.createdAt,
        isActive: !s.expiresAt || new Date(s.expiresAt) > new Date(),
        accessCount: s.accessCount ?? 0,
      }));
      setShareLinks(mapped);
    } catch (error) {
      console.error('Failed to load share links:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateShare = async () => {
    if (!item) return;

    setIsCreating(true);
    try {
      await onShare(permission, expiresDays);
      toast.success('Share link created successfully');
      await loadShareLinks();
      setPermission('VIEW');
      setExpiresDays(30);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create share link');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = (shareUrl: string) => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Share link copied to clipboard');
  };

  const handleRevokeShare = async (id: string) => {
    try {
      await onRevokeShare(id);
      toast.success('Share link revoked');
      await loadShareLinks();
    } catch (error: any) {
      toast.error(error.message || 'Failed to revoke share link');
    }
  };

  const getExpirationOptions = () => [
    { value: '', label: 'Never expires' },
    { value: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), label: '1 day' },
    { value: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), label: '1 week' },
    { value: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), label: '1 month' },
    { value: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), label: '3 months' },
  ];

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md sm:max-w-lg md:max-w-2xl p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3 flex-wrap">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Link className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold truncate max-w-[70vw] sm:max-w-none">Share "{item.name}"</h2>
              <p className="text-sm text-muted-foreground font-normal">
                Create and manage share links for this {type}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create New Share Link */}
          <div className="glass-card p-4">
            <h3 className="font-medium mb-4 flex items-center">
              <Globe className="w-4 h-4 mr-2 text-primary" />
              Create Share Link
            </h3>
            
            <div className="space-y-4">
              {/* Permission Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Permission</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    variant={permission === 'VIEW' ? 'default' : 'outline'}
                    onClick={() => setPermission('VIEW')}
                    className="justify-start"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View only
                  </Button>
                  <Button
                    variant={permission === 'EDIT' ? 'default' : 'outline'}
                    onClick={() => setPermission('EDIT')}
                    className="justify-start"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Can edit
                  </Button>
                </div>
              </div>

              {/* Expiration */}
              <div>
                <label className="text-sm font-medium mb-2 block">Expires</label>
                  <select
                    value={expiresDays ?? ''}
                    onChange={(e) => setExpiresDays(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Never expires</option>
                    <option value={1}>1 day</option>
                    <option value={7}>1 week</option>
                    <option value={30}>1 month</option>
                    <option value={90}>3 months</option>
                  </select>
              </div>

              <Button
                onClick={handleCreateShare}
                disabled={isCreating}
                className="w-full btn-premium"
              >
                {isCreating ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Creating...
                  </div>
                ) : (
                  <>
                    <Link className="w-4 h-4 mr-2" />
                    Create Share Link
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Existing Share Links */}
          <div>
            <h3 className="font-medium mb-4 flex items-center">
              <Users className="w-4 h-4 mr-2 text-primary" />
              Active Share Links
              {shareLinks.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {shareLinks.length}
                </Badge>
              )}
            </h3>

            {isLoading ? (
              <div className="glass-card p-6 text-center">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading share links...</p>
              </div>
            ) : shareLinks.length === 0 ? (
              <div className="glass-card p-6 text-center">
                <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No active share links</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Create a share link to allow others to access this {type}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {shareLinks.map((link) => (
                  <div key={link.id} className="glass-card p-4">
                    <div className="flex items-center justify-between mb-3 flex-col sm:flex-row gap-3">
                      <div className="flex items-center space-x-3 w-full sm:w-auto">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          {link.permission === 'VIEW' ? (
                            <Eye className="w-4 h-4 text-primary" />
                          ) : (
                            <Edit className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <Badge variant={link.permission === 'VIEW' ? 'secondary' : 'default'}>
                              {link.permission === 'VIEW' ? 'View only' : 'Can edit'}
                            </Badge>
                            {link.isActive ? (
                              <Badge variant="success">Active</Badge>
                            ) : (
                              <Badge variant="destructive">Inactive</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Created {formatDate(link.createdAt)} • {link.accessCount} views
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyLink(link.shareUrl)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevokeShare(link.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Share URL */}
                    <div className="flex items-center space-x-2 bg-muted/30 rounded-md p-2 overflow-x-auto flex-col sm:flex-row gap-2 sm:gap-0">
                      <Input
                        value={link.shareUrl}
                        readOnly
                        className="flex-1 bg-transparent border-none text-sm min-w-0"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyLink(link.shareUrl)}
                        >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Expiration Info */}
                    {link.expiresAt && (
                      <div className="flex items-center space-x-2 mt-2 text-xs text-muted-foreground flex-wrap">
                        <Calendar className="w-3 h-3" />
                        <span>Expires {formatDate(link.expiresAt)}</span>
                        {new Date(link.expiresAt) < new Date() && (
                          <Badge variant="destructive" className="text-xs">
                            Expired
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Security Notice */}
          <div className="flex items-start space-x-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                Security Notice
              </p>
              <p className="text-yellow-700 dark:text-yellow-300">
                Anyone with the share link can access this {type} according to the permissions you set. 
                Only share links with people you trust.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
