'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatBytes, formatDate, getFileCategory, getFileIconComponent, truncateText } from '@/lib/utils';
import { FileItem, FolderItem } from '@/lib/api';
import {
  MoreVertical,
  Download,
  Share2,
  Edit,
  Trash2,
  Star,
  Copy,
  Move,
  Info,
  Eye,
  Folder,
  FolderOpen,
  Image,
  Play,
  FileText,
  Archive
} from 'lucide-react';

// Try to robustly derive folder item counts across multiple backend shapes
function getFolderItemCount(folder: any): number {
  if (!folder) return 0;
  // Prefer explicit totals
  const explicit =
    folder.itemCount ??
    folder.itemsCount ??
    folder.items_count ??
    folder.childrenCount ??
    folder.children_count ??
    folder.childCount ??
    folder.child_count ??
    folder.totalItems ??
    folder.total ??
    folder.count ??
    folder.childrenTotal ??
    folder.totalChildren ??
    folder.trashedItemCount ??
    folder.trashedItemsCount ??
    folder.trashedChildrenCount ??
    folder.trashedFilesCount ??
    folder.numChildren ??
    folder.num_children ??
    folder.numItems ??
    folder.num_items ??
    folder.contentsCount ??
    folder.contents_count ??
    folder.metadata?.itemCount ??
    folder.metadata?.childrenCount ??
    folder.stats?.total ??
    folder.stats?.items ??
    folder.stats?.count ??
    folder.totals?.items ??
    folder.summary?.items ??
    folder._count?.items ??
    (typeof folder.children?.total === 'number' ? folder.children.total : undefined);

  if (typeof explicit === 'number') return explicit;

  // Sum of file/folder counts if available
  const fileCnt = folder.fileCount ?? folder.filesCount ?? folder.stats?.files ?? folder.metadata?.filesCount ?? folder._count?.files;
  const folderCnt = folder.folderCount ?? folder.foldersCount ?? folder.stats?.folders ?? folder.metadata?.foldersCount ?? folder._count?.folders;
  if (typeof fileCnt === 'number' || typeof folderCnt === 'number') {
    return (Number(fileCnt || 0) + Number(folderCnt || 0));
  }

  // Fallback to array lengths
  if (Array.isArray(folder.files)) return folder.files.length;
  if (Array.isArray(folder.items)) return folder.items.length;
  if (Array.isArray(folder.children)) return folder.children.length;
  return 0;
}

interface FileGridProps {
  files: FileItem[];
  folders: FolderItem[];
  viewMode: 'grid' | 'list';
  selectedItems: string[];
  onItemSelect: (id: string, type: 'file' | 'folder') => void;
  onItemDoubleClick: (item: FileItem | FolderItem, type: 'file' | 'folder') => void;
  onDownload: (file: FileItem) => void;
  onShare: (item: FileItem | FolderItem, type: 'file' | 'folder') => void;
  onRename: (item: FileItem | FolderItem, type: 'file' | 'folder') => void;
  onDelete: (item: FileItem | FolderItem, type: 'file' | 'folder') => void;
  onStar: (item: FileItem | FolderItem, type: 'file' | 'folder') => void;
  onPreview: (file: FileItem) => void;
  onMove: (item: FileItem | FolderItem, type: 'file' | 'folder') => void;
  onCopy: (item: FileItem | FolderItem, type: 'file' | 'folder') => void;
  onInfo: (item: FileItem | FolderItem, type: 'file' | 'folder') => void;
  isInTrash?: boolean;
  onRestore?: (item: FileItem | FolderItem, type: 'file' | 'folder') => void;
  onPermanentDelete?: (item: FileItem | FolderItem, type: 'file' | 'folder') => void;
}

const FileCard: React.FC<{
  item: FileItem | FolderItem;
  type: 'file' | 'folder';
  isSelected: boolean;
  onSelect: () => void;
  onDoubleClick: () => void;
  onDownload?: () => void;
  onShare: () => void;
  onRename: () => void;
  onDelete: () => void;
  onStar: () => void;
  onPreview?: () => void;
  onMove: () => void;
  onCopy: () => void;
  onInfo: () => void;
  isInTrash?: boolean;
  onRestore?: () => void;
  onPermanentDelete?: () => void;
}> = ({
  item,
  type,
  isSelected,
  onSelect,
  onDoubleClick,
  onDownload,
  onShare,
  onRename,
  onDelete,
  onStar,
  onPreview,
  onMove,
  onCopy,
  onInfo,
  isInTrash,
  onRestore,
  onPermanentDelete
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const isFile = type === 'file';
  const file = isFile ? item as FileItem : null;
  const folder = !isFile ? item as FolderItem : null;

  const getPreviewIcon = () => {
    if (isFile && file) {
      const category = file.mimeType ? getFileCategory(file.mimeType) : 'file';
      switch (category) {
        case 'image':
          return file.thumbnailUrl ? (
            <img 
              src={file.thumbnailUrl} 
              alt={file.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : <Image className="w-12 h-12 text-green-500" />;
        case 'video':
          return <Play className="w-12 h-12 text-red-500" />;
        case 'document':
        case 'text':
          return <FileText className="w-12 h-12 text-blue-500" />;
        case 'archive':
          return <Archive className="w-12 h-12 text-yellow-500" />;
        default: {
          const { icon: Icon, color } = getFileIconComponent(file.mimeType || '');
          return <Icon className={`w-12 h-12 ${color}`} />;
        }
      }
    } else {
      return <Folder className="w-12 h-12 text-primary" />;
    }
  };

  return (
    <div
      ref={cardRef}
      className={`
        group relative p-4 rounded-2xl border bg-background/60 backdrop-blur-sm transition-all duration-200 cursor-pointer
        ${isSelected 
          ? 'border-primary/60 ring-1 ring-primary/20 shadow-md' 
          : 'border-border hover:border-primary/40 hover:shadow-xl hover:-translate-y-0.5'
        }
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
    >
      {/* Actions */}
      <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 hover:bg-background/80"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 z-30">
            {isFile && onPreview && (
              <DropdownMenuItem onClick={onPreview}>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </DropdownMenuItem>
            )}
            {isFile && onDownload && !isInTrash && (
              <DropdownMenuItem onClick={onDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </DropdownMenuItem>
            )}
            {!isInTrash && (
              <DropdownMenuItem onClick={onShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </DropdownMenuItem>
            )}
            {!isInTrash && <DropdownMenuSeparator />}
            {!isInTrash && (
              <>
                <DropdownMenuItem onClick={onRename}>
                  <Edit className="w-4 h-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onMove}>
                  <Move className="w-4 h-4 mr-2" />
                  Move
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onCopy}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onStar}>
                  <Star className={`w-4 h-4 mr-2 ${item.isStarred ? 'text-yellow-500 fill-current' : ''}`} />
                  {item.isStarred ? 'Remove Star' : 'Add Star'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {isInTrash && (
              <>
                <DropdownMenuItem onClick={onRestore}>
                  <Archive className="w-4 h-4 mr-2" />
                  Restore
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onPermanentDelete} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete permanently
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={onInfo}>
              <Info className="w-4 h-4 mr-2" />
              Details
            </DropdownMenuItem>
            {!isInTrash && (
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* File/Folder Icon or Preview */}
      <div className="flex items-center justify-center h-24 mb-3 rounded-xl bg-accent/20">
        {getPreviewIcon()}
      </div>

      {/* File/Folder Info */}
      <div className="text-center">
        <h3 className="font-medium text-sm mb-1 truncate flex items-center justify-center gap-1" title={item.name}>
          {truncateText(item.name, 20)}
          {item.isStarred && <Star className="w-3.5 h-3.5 text-yellow-500 fill-current flex-shrink-0" />}
        </h3>
        <div className="text-xs text-muted-foreground space-y-1">
          {isFile && file && (
            <p>{formatBytes(file.size)}</p>
          )}
          <p>{isInTrash
            ? `Deleted ${formatDate((item as any).deletedAt || (item as any).trashedAt || (item as any).removedAt || (item as any).deleted_at || item.updatedAt)}`
            : formatDate(
                (item as any).updatedAt ||
                (item as any).modifiedAt ||
                (item as any).lastModified ||
                (item as any).lastAccessedAt ||
                (item as any).sharedAt ||
                (item as any).createdAt
              )
          }</p>
          {isFile && file?.owner && (
            <p>
              by {(
                (file.owner.firstName || file.owner.lastName)
                  ? `${file.owner.firstName ?? ''} ${file.owner.lastName ?? ''}`.trim()
                  : file.owner.username
              )}
            </p>
          )}
          {!isFile && folder && (
            (() => {
              const cnt = getFolderItemCount(folder as any);
              return <p>{cnt} items</p>;
            })()
          )}
        </div>
      </div>

      {/* Hover Effects */}
      <div className={`
        pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-blue-500/5 opacity-0 transition-opacity duration-200
        ${isHovered ? 'opacity-100' : ''}
      `} />
    </div>
  );
};

const FileListItem: React.FC<{
  item: FileItem | FolderItem;
  type: 'file' | 'folder';
  isSelected: boolean;
  onSelect: () => void;
  onDoubleClick: () => void;
  onDownload?: () => void;
  onShare: () => void;
  onRename: () => void;
  onDelete: () => void;
  onStar: () => void;
  onPreview?: () => void;
  onMove: () => void;
  onCopy: () => void;
  onInfo: () => void;
  isInTrash?: boolean;
  onRestore?: () => void;
  onPermanentDelete?: () => void;
}> = ({
  item,
  type,
  isSelected,
  onSelect,
  onDoubleClick,
  onDownload,
  onShare,
  onRename,
  onDelete,
  onStar,
  onPreview,
  onMove,
  onCopy,
  onInfo,
  isInTrash,
  onRestore,
  onPermanentDelete
}) => {
  const isFile = type === 'file';
  const file = isFile ? item as FileItem : null;
  const folder = !isFile ? item as FolderItem : null;

  return (
    <div
      className={`
        group flex items-center space-x-4 p-3 rounded-xl border bg-background/50 backdrop-blur-sm transition-all duration-200 cursor-pointer
        ${isSelected 
          ? 'border-primary/60 ring-1 ring-primary/20' 
          : 'border-border hover:border-primary/40 hover:bg-accent/20'
        }
      `}
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
    >
      {/* File Icon */}
      <div className="flex-shrink-0">
        {isFile && file ? (
          (() => { const { icon: Icon, color } = getFileIconComponent(file.mimeType || ''); return <Icon className={`w-5 h-5 ${color}`} />; })()
        ) : (
          <Folder className="w-5 h-5 text-primary" />
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <h3 className="font-medium truncate">{item.name}</h3>
          {item.isStarred && (
            <Star className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0" />
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {isFile && file ? (
            `${formatBytes(file.size)} • ${isInTrash
              ? `Deleted ${formatDate((item as any).deletedAt || (item as any).trashedAt || (item as any).removedAt || (item as any).deleted_at || item.updatedAt)}`
              : formatDate(
                  (item as any).updatedAt ||
                  (item as any).modifiedAt ||
                  (item as any).lastModified ||
                  (item as any).lastAccessedAt ||
                  (item as any).sharedAt ||
                  (item as any).createdAt
                )
            }`
          ) : (
            `${(() => { const cnt = getFolderItemCount(folder as any); return `${cnt} items`; })()} • ${isInTrash
              ? `Deleted ${formatDate((item as any).deletedAt || (item as any).trashedAt || (item as any).removedAt || (item as any).deleted_at || item.updatedAt)}`
              : formatDate(
                  (item as any).updatedAt ||
                  (item as any).modifiedAt ||
                  (item as any).lastModified ||
                  (item as any).lastAccessedAt ||
                  (item as any).sharedAt ||
                  (item as any).createdAt
                )
            }`
          )}
        </p>
      </div>

      {/* Owner */}
      <div className="hidden md:block w-32 text-sm text-muted-foreground truncate">
        {isFile && file?.owner
          ? `by ${((file.owner.firstName || file.owner.lastName)
              ? `${file.owner.firstName ?? ''} ${file.owner.lastName ?? ''}`.trim()
              : file.owner.username)}`
          : ''}
      </div>

      {/* Actions */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={(e) => e.stopPropagation()}>
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {isFile && onPreview && (
              <DropdownMenuItem onClick={onPreview}>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </DropdownMenuItem>
            )}
            {isFile && onDownload && !isInTrash && (
              <DropdownMenuItem onClick={onDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </DropdownMenuItem>
            )}
            {!isInTrash && (
              <DropdownMenuItem onClick={onShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </DropdownMenuItem>
            )}
            {!isInTrash && <DropdownMenuSeparator />}
            {!isInTrash && (
              <>
                <DropdownMenuItem onClick={onRename}>
                  <Edit className="w-4 h-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onMove}>
                  <Move className="w-4 h-4 mr-2" />
                  Move
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onCopy}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onStar}>
                  <Star className={`w-4 h-4 mr-2 ${item.isStarred ? 'text-yellow-500 fill-current' : ''}`} />
                  {item.isStarred ? 'Remove Star' : 'Add Star'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {isInTrash && (
              <>
                <DropdownMenuItem onClick={onRestore}>
                  <Archive className="w-4 h-4 mr-2" />
                  Restore
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onPermanentDelete} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete permanently
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={onInfo}>
              <Info className="w-4 h-4 mr-2" />
              Details
            </DropdownMenuItem>
            {!isInTrash && (
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export const FileGrid: React.FC<FileGridProps> = ({
  files,
  folders,
  viewMode,
  selectedItems,
  onItemSelect,
  onItemDoubleClick,
  onDownload,
  onShare,
  onRename,
  onDelete,
  onStar,
  onPreview,
  onMove,
  onCopy,
  onInfo,
  isInTrash,
  onRestore,
  onPermanentDelete
}) => {
  const allItems = [
    ...folders.map(folder => ({ ...folder, type: 'folder' as const })),
    ...files.map(file => ({ ...file, type: 'file' as const }))
  ];

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {allItems.map((item) => (
          <FileCard
            key={`${item.type}-${item.id}`}
            item={item}
            type={item.type}
            isSelected={selectedItems.includes(`${item.type}-${item.id}`)}
            onSelect={() => onItemSelect(item.id, item.type)}
            onDoubleClick={() => onItemDoubleClick(item, item.type)}
            onDownload={item.type === 'file' ? () => onDownload(item as FileItem) : undefined}
            onShare={() => onShare(item, item.type)}
            onRename={() => onRename(item, item.type)}
            onDelete={() => onDelete(item, item.type)}
            onStar={() => onStar(item, item.type)}
            onPreview={item.type === 'file' ? () => onPreview(item as FileItem) : undefined}
            onMove={() => onMove(item, item.type)}
            onCopy={() => onCopy(item, item.type)}
            onInfo={() => onInfo(item, item.type)}
            isInTrash={isInTrash}
            onRestore={() => onRestore && onRestore(item, item.type)}
            onPermanentDelete={() => onPermanentDelete && onPermanentDelete(item, item.type)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* List Header */}
      <div className="grid grid-cols-12 gap-4 px-3 py-2 text-sm font-medium text-muted-foreground border-b">
        <div className="col-span-6 flex items-center space-x-3">
          <div className="w-5" /> {/* Icon space */}
          <span>Name</span>
        </div>
        <div className="col-span-2 hidden md:block">Owner</div>
        <div className="col-span-2 hidden lg:block">{isInTrash ? 'Deleted' : 'Modified'}</div>
        <div className="col-span-2 hidden xl:block">Size</div>
      </div>

      {/* List Items */}
      {allItems.map((item) => (
        <FileListItem
          key={`${item.type}-${item.id}`}
          item={item}
          type={item.type}
          isSelected={selectedItems.includes(`${item.type}-${item.id}`)}
          onSelect={() => onItemSelect(item.id, item.type)}
          onDoubleClick={() => onItemDoubleClick(item, item.type)}
          onDownload={item.type === 'file' ? () => onDownload(item as FileItem) : undefined}
          onShare={() => onShare(item, item.type)}
          onRename={() => onRename(item, item.type)}
          onDelete={() => onDelete(item, item.type)}
          onStar={() => onStar(item, item.type)}
          onPreview={item.type === 'file' ? () => onPreview(item as FileItem) : undefined}
          onMove={() => onMove(item, item.type)}
          onCopy={() => onCopy(item, item.type)}
          onInfo={() => onInfo(item, item.type)}
          isInTrash={isInTrash}
          onRestore={() => onRestore && onRestore(item, item.type)}
          onPermanentDelete={() => onPermanentDelete && onPermanentDelete(item, item.type)}
        />
      ))}
    </div>
  );
};
