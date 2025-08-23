'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FolderPlus, Folder, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: (name: string, parentId?: string) => Promise<void>;
  parentFolder?: { id: string; name: string } | null;
}

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  isOpen,
  onClose,
  onCreateFolder,
  parentFolder
}) => {
  const [folderName, setFolderName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!folderName.trim()) {
      setError('Folder name is required');
      return;
    }

    if (folderName.length > 255) {
      setError('Folder name is too long');
      return;
    }

    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(folderName)) {
      setError('Folder name contains invalid characters');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      await onCreateFolder(folderName.trim(), parentFolder?.id);
      toast.success(`Folder "${folderName}" created successfully`);
      handleClose();
    } catch (error: any) {
      setError(error.message || 'Failed to create folder');
      toast.error(error.message || 'Failed to create folder');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setFolderName('');
    setError('');
    setIsCreating(false);
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFolderName(e.target.value);
    if (error) setError('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <FolderPlus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Create New Folder</h2>
              {parentFolder && (
                <p className="text-sm text-muted-foreground font-normal">
                  in "{parentFolder.name}"
                </p>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Folder Preview */}
          <div className="flex items-center justify-center py-6">
            <div className="relative">
              <div className="w-16 h-16 bg-primary/20 rounded-lg flex items-center justify-center">
                <Folder className="w-8 h-8 text-primary" />
              </div>
              {folderName && (
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <div className="bg-background border border-border rounded px-2 py-1 text-xs font-medium max-w-32 truncate">
                    {folderName}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Folder Name Input */}
          <div className="space-y-2">
            <label htmlFor="folderName" className="text-sm font-medium">
              Folder Name
            </label>
            <Input
              id="folderName"
              value={folderName}
              onChange={handleInputChange}
              placeholder="Enter folder name"
              className={error ? 'border-destructive focus:ring-destructive' : ''}
              disabled={isCreating}
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Folder names cannot contain: &lt; &gt; : " / \ | ? *
            </p>
          </div>

          {/* Location Info */}
          {parentFolder && (
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-sm">
                <Folder className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Location:</span>
                <span className="font-medium">{parentFolder.name}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!folderName.trim() || isCreating}
              className="flex-1 btn-premium"
            >
              {isCreating ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Creating...
                </div>
              ) : (
                <>
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Create Folder
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
