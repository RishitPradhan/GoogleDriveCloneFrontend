'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
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
import { formatBytes, formatDate, getFileIconComponent } from '@/lib/utils';
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
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function DashboardContent() {
  const { user, plan, logout } = useAuth();
  const router = useRouter();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'files' | 'folders'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'modified' | 'size' | 'type'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  
  // Modal states
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [shareItem, setShareItem] = useState<{ item: FileItem | FolderItem; type: 'file' | 'folder' } | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Data states with real API integration
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [trashFiles, setTrashFiles] = useState<FileItem[]>([]);
  const [trashFolders, setTrashFolders] = useState<FolderItem[]>([]);
  const [isInTrash, setIsInTrash] = useState(false);
  // Storage info from backend
  const [storageInfo, setStorageInfo] = useState<{ used: number; total: number }>({ used: 0, total: 0 });
  const [currentFolder, setCurrentFolder] = useState<FolderItem | null>(null);
  const [currentView, setCurrentView] = useState<string>('home');
  // Client-side persisted starred IDs (fallback if backend doesn't return flags)
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  
  // Data is now managed by backend API

  // Backend connection check and data loading
  const [backendConnected, setBackendConnected] = useState(false);

  // Normalization helpers
  const isStarredFlag = (item: any) => {
    if (!item) return false;
    const direct = item.isStarred ?? item.starred ?? item.is_starred ?? item.star;
    const flags = item.flags?.starred;
    const meta = item.metadata?.starred;
    const label = Array.isArray(item.labels) && item.labels.includes('starred');
    return !!(direct || flags || meta || label);
  };
  const isFileLike = (item: any) => item?.type === 'file' || !!(item?.mimeType ?? item?.mime_type);
  const isFolderLike = (item: any) => item?.type === 'folder' || (!isFileLike(item) && !!item?.name);
  const isStarredByClient = (id?: string) => (id ? starredIds.has(id) : false);
  const withStarOverlay = <T extends { id: string }>(items: T[]): T[] =>
    items.map((i: any) => ({ ...i, isStarred: isStarredFlag(i) || isStarredByClient(i?.id) }));

  // Robust parentId detector (reused in Trash navigation)
  const getParentId = (it: any): string | undefined =>
    it?.parentId ?? it?.parent_id ?? it?.folderId ?? it?.folder_id ?? it?.parent?.id ?? it?.directoryId ?? it?.directory_id ??
    // Original/previous parent references often kept in trash payloads
    it?.originalParentId ?? it?.original_parent_id ?? it?.originalFolderId ?? it?.original_folder_id ??
    it?.previousParentId ?? it?.previous_parent_id ?? it?.previousFolderId ?? it?.previous_folder_id ??
    it?.sourceParentId ?? it?.source_parent_id ?? it?.sourceFolderId ?? it?.source_folder_id ??
    it?.movedFromId ?? it?.moved_from_id ?? it?.oldParentId ?? it?.old_parent_id ??
    it?.parentFolderId ?? it?.parent_folder_id ?? it?.originParentId ?? it?.origin_parent_id ??
    // Nested containers commonly used in trash payloads
    it?.original?.parentId ?? it?.original?.parent_id ??
    it?.trashInfo?.parentId ?? it?.trashInfo?.parent_id ??
    it?.trash?.parentId ?? it?.trash?.parent_id ??
    it?.deleted?.parentId ?? it?.deleted?.parent_id ??
    it?.meta?.parentId ?? it?.meta?.parent_id;

  // Robust folder ID detector (for matching parents in trash)
  const getFolderId = (fo: any): string | undefined =>
    (fo?.id ?? fo?._id ?? fo?.uuid ?? fo?.folderId ?? fo?.folder_id ?? fo?.originalId ?? fo?.original_id ?? fo?.sourceId ?? fo?.source_id ?? fo?.previousId ?? fo?.previous_id ?? fo?.deleted?.id ?? fo?.trash?.id ?? fo?.meta?.id)?.toString();
  const getFolderIdAliases = (fo: any): Set<string> => {
    const candidates = [
      fo?.id, fo?._id, fo?.uuid, fo?.folderId, fo?.folder_id,
      fo?.originalId, fo?.original_id, fo?.sourceId, fo?.source_id, fo?.previousId, fo?.previous_id,
      fo?.deleted?.id, fo?.trash?.id, fo?.meta?.id
    ];
    const set = new Set<string>();
    for (const v of candidates) {
      if (v != null) set.add(String(v));
    }
    return set;
  };

  // Given a parent folder id (or undefined for root trash), compute visible trash children
  const getTrashChildren = (parentFolderId?: string) => {
    const parentIdSet = parentFolderId ? new Set([parentFolderId]) : undefined;
    // At root trash: show ALL trashed items
    const childFiles = parentIdSet
      ? trashFiles.filter((it: any) => String(getParentId(it) ?? '') === parentFolderId)
      : [...trashFiles];
    let childFolders = parentIdSet
      ? trashFolders.filter((it: any) => String(getParentId(it) ?? '') === parentFolderId)
      : [...trashFolders];
    // Compute counts for these child folders using the global trash items
    const counts: Record<string, number> = {};
    for (const it of [...trashFiles, ...trashFolders]) {
      const pid = String(getParentId(it) ?? '');
      if (!pid) continue;
      counts[pid] = (counts[pid] ?? 0) + 1;
    }
    childFolders = childFolders.map((fo: any) => {
      const fid = getFolderId(fo) ?? '';
      return { ...fo, itemCount: counts[fid] ?? 0 };
    });
    return { childFiles, childFolders };
  };

  // Sorting helpers (component scope)
  function compareStrings(a: string = '', b: string = '') {
    return a.localeCompare(b, undefined, { sensitivity: 'base' });
  }
  function getSorted<T extends FileItem | FolderItem>(list: T[]): T[] {
    const arr = [...list];
    arr.sort((a: any, b: any) => {
      let cmp = 0;
      switch (sortBy) {
        case 'name':
          cmp = compareStrings(a?.name, b?.name);
          break;
        case 'modified':
          cmp = new Date(a?.updatedAt || a?.createdAt || 0).getTime() - new Date(b?.updatedAt || b?.createdAt || 0).getTime();
          break;
        case 'size':
          cmp = (a?.size || 0) - (b?.size || 0);
          break;
        case 'type':
          cmp = compareStrings((a?.mimeType || a?.type || ''), (b?.mimeType || b?.type || ''));
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }
  
  useEffect(() => {
    const checkBackendConnection = async () => {
      try {
        const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api/v1').replace(/\/$/, '');
        const healthBase = apiUrl.replace(/\/api(\/v1)?$/, '');
        const response = await fetch(`${healthBase}/health`);
        setBackendConnected(response.ok);
        if (response.ok) {
          toast.success('Backend connected successfully!');
          // Load real data from backend
          loadFilesAndFolders();
          // Load storage info
          try {
            const s = await apiClient.getStorageInfo();
            // Derive total strictly from plan mapping to avoid unit mismatches
            const planGb = plan === 'business' ? 2000 : plan === 'pro' ? 200 : 15;
            const totalBytes = planGb * 1024 * 1024 * 1024;
            const usedBytes = Number(s.used) || 0;
            const safeUsed = Math.max(0, Math.min(usedBytes, totalBytes));
            setStorageInfo({ used: safeUsed, total: totalBytes });
          } catch {}
        }
      } catch (error) {
        setBackendConnected(false);
        console.log('Backend not available');
      }
    };

    checkBackendConnection();
    // Load client-starred IDs from localStorage
    try {
      const raw = localStorage.getItem('starredIds');
      if (raw) setStarredIds(new Set(JSON.parse(raw)));
    } catch {}
  }, []);

  // Recompute storage total when plan changes (force to plan mapping)
  useEffect(() => {
    const planGb = plan === 'business' ? 2000 : plan === 'pro' ? 200 : 15;
    const totalBytes = planGb * 1024 * 1024 * 1024;
    setStorageInfo((prev) => ({ used: Math.max(0, Math.min(prev.used, totalBytes)), total: totalBytes }));
  }, [plan]);

  // Load files and folders from backend
  const loadFilesAndFolders = async (folderId?: string) => {
    try {
      setIsLoading(true);
      console.log('Loading files and folders for folderId:', folderId);
      // Fetch in parallel but tolerate single-endpoint failure
      const results = await Promise.allSettled([
        apiClient.getFiles({ folderId }),
        apiClient.getFolders({ parentId: folderId, includeFiles: true })
      ]);

      let filesRes: any | null = null;
      let foldersRes: any | null = null;

      if (results[0].status === 'fulfilled') {
        filesRes = (results[0] as PromiseFulfilledResult<any>).value;
      } else {
        const err: any = (results[0] as PromiseRejectedResult).reason;
        console.warn('getFiles failed, continuing with folders:', err);
      }

      if (results[1].status === 'fulfilled') {
        foldersRes = (results[1] as PromiseFulfilledResult<any>).value;
      } else {
        // Retry folders without includeFiles if includeFiles not supported
        try {
          console.warn('getFolders(includeFiles:true) failed, retrying without includeFiles');
          foldersRes = await apiClient.getFolders({ parentId: folderId });
        } catch (retryErr: any) {
          console.error('getFolders retry failed:', retryErr);
        }
      }

      console.log('Files data raw:', filesRes);
      console.log('Folders data raw:', foldersRes);

      // Normalize various shapes to arrays
      let filesArr: any[] = [];
      if (filesRes) {
        const fRaw: any = filesRes as any;
        const dFiles = fRaw?.data ?? fRaw;
        if (Array.isArray(dFiles)) filesArr = dFiles;
        else if (Array.isArray(dFiles?.files)) filesArr = dFiles.files;
        else if (Array.isArray(dFiles?.items)) filesArr = (dFiles.items as any[]).filter((i) => i?.type === 'file');
        else if (Array.isArray(dFiles?.results)) filesArr = (dFiles.results as any[]).filter((i) => i?.type === 'file');
      }

      let foldersArr: any[] = [];
      if (foldersRes) {
        const foRaw: any = foldersRes as any;
        const dFolders = foRaw?.data ?? foRaw;
        if (Array.isArray(dFolders)) foldersArr = dFolders;
        else if (Array.isArray(dFolders?.folders)) foldersArr = dFolders.folders;
        else if (Array.isArray(dFolders?.items)) foldersArr = (dFolders.items as any[]).filter((i) => i?.type === 'folder');
        else if (Array.isArray(dFolders?.results)) foldersArr = (dFolders.results as any[]).filter((i) => i?.type === 'folder');
      }

      // Overlay client-starred flags
      const filesOverlay = withStarOverlay(filesArr);
      const foldersOverlay = withStarOverlay(foldersArr);
      // Update what we have; avoid throwing if one side is empty
      setFiles(filesOverlay as any);
      setFolders(foldersOverlay as any);

      // If both failed, surface an error toast with richer detail
      if (!filesRes && !foldersRes) {
        throw new Error('Both files and folders requests failed');
      }
    } catch (error: any) {
      // Build a richer message (handles non-enumerable Error props)
      const status = typeof error?.status === 'number' ? error.status : undefined;
      const fallbackMsg = (() => {
        try {
          return JSON.stringify(error, Object.getOwnPropertyNames(error));
        } catch {
          return String(error ?? 'Unknown error');
        }
      })();
      const msg = typeof error?.message === 'string' && error.message.length > 0 ? error.message : fallbackMsg;
      console.error('Failed to load data error object:', error);
      toast.error(`Failed to load data${status ? ` (${status})` : ''}: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load items shared by the current user
  const loadSharedByMe = async () => {
    try {
      setIsLoading(true);
      setIsInTrash(false);
      setCurrentFolder(null);
      setFilterType('all');
      console.log('[SharedByMe] Fetching my shares...');
      const raw: any = await apiClient.getMyShares();
      // Accept multiple shapes commonly returned by backends
      // raw may already be response.data per apiClient.request
      const dataLevel: any = raw?.data ?? raw;
      let shares: any[] = [];
      if (Array.isArray(dataLevel)) shares = dataLevel;
      else if (Array.isArray(dataLevel?.results)) shares = dataLevel.results;
      else if (Array.isArray(dataLevel?.items)) shares = dataLevel.items;
      else if (Array.isArray(dataLevel?.shares)) shares = dataLevel.shares;
      else if (Array.isArray(dataLevel?.data?.results)) shares = dataLevel.data.results;
      else if (Array.isArray(dataLevel?.data?.items)) shares = dataLevel.data.items;
      else if (Array.isArray(dataLevel?.data?.shares)) shares = dataLevel.data.shares;
      // Extract underlying items from share objects
      const items = shares
        .map((s: any) => s?.item || s?.target || s?.file || s?.folder || s)
        .filter(Boolean);
      const filesArr = items.filter((i: any) => isFileLike(i));
      const foldersArr = items.filter((i: any) => isFolderLike(i));
      console.log('[SharedByMe] Items extracted', { files: filesArr.length, folders: foldersArr.length });
      setFiles(filesArr);
      setFolders(foldersArr);
      toast.success(`Loaded ${filesArr.length + foldersArr.length} shared item(s)`);
    } catch (error: any) {
      const status = typeof error?.status === 'number' ? error.status : undefined;
      toast.error(`Failed to load shared by me${status ? ` (${status})` : ''}: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load starred items (fetch and filter both files and folders)
  const loadStarred = async () => {
    try {
      setIsLoading(true);
      setIsInTrash(false);
      setCurrentFolder(null);
      setFilterType('all');
      console.log('[Starred] Fetching files & folders then filtering by isStarred');
      const [filesRes, foldersRes]: any = await Promise.all([
        apiClient.getFiles({}),
        apiClient.getFolders({ includeFiles: false }),
      ]);
      const fLevel = filesRes?.data ?? filesRes;
      const foLevel = foldersRes?.data ?? foldersRes;
      const allFiles: any[] = Array.isArray(fLevel)
        ? fLevel
        : Array.isArray(fLevel?.files)
        ? fLevel.files
        : Array.isArray(fLevel?.items)
        ? (fLevel.items as any[]).filter((i) => i?.type === 'file')
        : Array.isArray(fLevel?.results)
        ? (fLevel.results as any[]).filter((i) => i?.type === 'file')
        : [];
      const allFolders: any[] = Array.isArray(foLevel)
        ? foLevel
        : Array.isArray(foLevel?.folders)
        ? foLevel.folders
        : Array.isArray(foLevel?.items)
        ? (foLevel.items as any[]).filter((i) => i?.type === 'folder')
        : Array.isArray(foLevel?.results)
        ? (foLevel.results as any[]).filter((i) => i?.type === 'folder')
        : [];
      // Apply overlay first, then filter by either backend flag or client persisted flag
      const filesOverlay = withStarOverlay(allFiles);
      const foldersOverlay = withStarOverlay(allFolders);
      const starredFiles = filesOverlay.filter((f: any) => isStarredFlag(f) || isStarredByClient(f?.id));
      const starredFolders = foldersOverlay.filter((fo: any) => isStarredFlag(fo) || isStarredByClient(fo?.id));
      setFiles(starredFiles as any);
      setFolders(starredFolders as any);
      toast.success(`Loaded ${starredFiles.length + starredFolders.length} starred item(s)`);
    } catch (error: any) {
      const status = typeof error?.status === 'number' ? error.status : undefined;
      toast.error(`Failed to load starred${status ? ` (${status})` : ''}: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load recent items (backend-first; focus on files by updatedAt desc)
  const loadRecent = async () => {
    try {
      setIsLoading(true);
      setIsInTrash(false);
      setCurrentFolder(null);
      setFilterType('files');
      console.log('[Recent] Fetching recent files');
      const res: any = await apiClient.getFiles({ sortBy: 'updatedAt', sortOrder: 'desc', limit: 100 });
      const level = (res as any)?.data ?? res;
      const recentFiles: any[] = Array.isArray(level)
        ? level
        : Array.isArray(level?.files)
        ? level.files
        : Array.isArray(level?.items)
        ? (level.items as any[]).filter((i) => i?.type === 'file')
        : Array.isArray(level?.results)
        ? (level.results as any[]).filter((i) => i?.type === 'file')
        : [];
      // Recent is usually files only; clear folders
      setFiles(withStarOverlay(recentFiles) as any);
      setFolders([]);
      toast.success(`Loaded ${recentFiles.length} recent file(s)`);
    } catch (error: any) {
      const status = typeof error?.status === 'number' ? error.status : undefined;
      toast.error(`Failed to load recent${status ? ` (${status})` : ''}: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Trash operation handlers
  const handleRestore = async (item: FileItem | FolderItem, type: 'file' | 'folder') => {
    try {
      await apiClient.restoreItem(type, item.id);
      toast.success(`${type === 'file' ? 'File' : 'Folder'} restored`);
      if (isInTrash) {
        await loadTrash();
      } else {
        await loadFilesAndFolders(currentFolder?.id);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to restore');
      throw error;
    }
  };

  const handlePermanentDelete = async (item: FileItem | FolderItem, type: 'file' | 'folder') => {
    try {
      await apiClient.permanentlyDeleteItem(type, item.id);
      toast.success(`${type === 'file' ? 'File' : 'Folder'} deleted permanently`);
      await loadTrash();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete permanently');
      throw error;
    }
  };

  // Load root files and folders
  const loadRootFiles = async (event?: React.MouseEvent) => {
    event?.preventDefault();
    setCurrentFolder(null);
    setIsInTrash(false);
    await loadFilesAndFolders(undefined);
  };

  // Load files and folders for current folder
  const loadCurrentFolder = async (folder: FolderItem) => {
    setCurrentFolder(folder);
    await loadFilesAndFolders(folder.id);
  };

// Load trash items
const loadTrash = async () => {
try {
setIsLoading(true);
setIsInTrash(true);

// 1) Prefer fetching files and folders explicitly
let filesRaw: any = null;
let foldersRaw: any = null;
try {
  const [fRes, dRes] = await Promise.all([
    apiClient.getTrash({ type: 'file' }),
    apiClient.getTrash({ type: 'folder' }),
  ]);
  filesRaw = fRes; foldersRaw = dRes;
} catch (e) {
  // Fallback to a single 'all' request
  const all = await apiClient.getTrash({ type: 'all' });
  filesRaw = all; foldersRaw = all;
}

const pickList = (raw: any): any[] => {
  const d = raw?.data ?? raw;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.files)) return d.files;
  if (Array.isArray(d?.items)) return d.items;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(d?.trash)) return d.trash;
  if (Array.isArray(d?.trashItems)) return d.trashItems;
  if (Array.isArray(d?.trashFiles)) return d.trashFiles;
  if (Array.isArray(d?.trashFolders)) return d.trashFolders;
  return [];
};

let filesArr = pickList(filesRaw);
let foldersArr = pickList(foldersRaw);

// If both came back from a single 'all' call, separate by simple heuristics
if (filesRaw === foldersRaw && (filesArr.length > 0) && foldersArr.length === filesArr.length) {
  const isFileLike = (it: any) => !!(it?.mimeType || it?.size || (it?.type?.toLowerCase?.() === 'file'));
  const isFolderLike = (it: any) => (it?.type?.toLowerCase?.() === 'folder') || it?.isFolder === true || it?.mimeType === 'application/vnd.google-apps.folder';
  foldersArr = filesArr.filter(isFolderLike);
  filesArr = filesArr.filter(isFileLike);
}
// Debug: log one sample folder to discover available count fields
try {
  const sample = foldersArr[0];
  if (sample) {
    const keys = Object.keys(sample).slice(0, 30);
    console.log('[Trash] Sample folder keys:', keys);
    console.log('[Trash] Sample folder counts hints:', {
      itemCount: (sample as any).itemCount,
      itemsCount: (sample as any).itemsCount,
      childrenCount: (sample as any).childrenCount,
      totalItems: (sample as any).totalItems,
      total: (sample as any).total,
      filesCount: (sample as any).filesCount,
      foldersCount: (sample as any).foldersCount,
      fileCount: (sample as any).fileCount,
      folderCount: (sample as any).folderCount,
      trashedItemsCount: (sample as any).trashedItemsCount,
      stats: (sample as any).stats,
      metadata: (sample as any).metadata,
    });
  }
} catch {}

// Compute folder item counts by grouping trashed items by parent ID (mirror My Drive behavior)
try {
  const getParentId = (it: any): string | undefined =>
    it?.parentId ?? it?.parent_id ?? it?.folderId ?? it?.folder_id ?? it?.parent?.id ?? it?.directoryId ?? it?.directory_id ??
    // Original/previous parent references often kept in trash payloads
    it?.originalParentId ?? it?.original_parent_id ?? it?.originalFolderId ?? it?.original_folder_id ??
    it?.previousParentId ?? it?.previous_parent_id ?? it?.previousFolderId ?? it?.previous_folder_id ??
    it?.sourceParentId ?? it?.source_parent_id ?? it?.sourceFolderId ?? it?.source_folder_id ??
    it?.movedFromId ?? it?.moved_from_id ?? it?.oldParentId ?? it?.old_parent_id ??
    it?.parentFolderId ?? it?.parent_folder_id ?? it?.originParentId ?? it?.origin_parent_id ??
    // Nested containers commonly used in trash payloads
    it?.original?.parentId ?? it?.original?.parent_id ??
    it?.trashInfo?.parentId ?? it?.trashInfo?.parent_id ??
    it?.trash?.parentId ?? it?.trash?.parent_id ??
    it?.deleted?.parentId ?? it?.deleted?.parent_id ??
    it?.meta?.parentId ?? it?.meta?.parent_id;
  const counts: Record<string, number> = {};
  let parentHits = 0;
  for (const it of filesArr) {
    // Do not count the folder itself
    const rawPid = getParentId(it);
    const pid = rawPid != null ? String(rawPid) : undefined;
    if (!pid) continue;
    parentHits++;
    counts[pid] = (counts[pid] ?? 0) + 1;
  }
  console.log('[Trash] Items total:', filesArr.length, 'withParent:', parentHits);
  const countsPreview = Object.entries(counts).slice(0, 10);
  console.log('[Trash] parentId->count (preview):', countsPreview);
  // Override or set itemCount for trash folders using computed map
  const getFolderId = (fo: any): string | undefined =>
    (fo?.id ?? fo?._id ?? fo?.uuid ?? fo?.folderId ?? fo?.folder_id ?? fo?.originalId ?? fo?.original_id ?? fo?.sourceId ?? fo?.source_id ?? fo?.previousId ?? fo?.previous_id ?? fo?.deleted?.id ?? fo?.trash?.id ?? fo?.meta?.id)?.toString();
  foldersArr = foldersArr.map((fo: any) => {
    const fid = getFolderId(fo) ?? '';
    const computed = counts[fid] ?? 0;
    return { ...fo, itemCount: computed };
  });
  console.log('[Trash] Folders with computed counts (preview):', foldersArr.slice(0, 5).map((f: any) => ({ id: (f as any).id ?? (f as any)._id, itemCount: (f as any).itemCount })));
} catch (e) {
  console.warn('[Trash] Failed to compute counts by parentId:', e);
}

// Skip enrichment fetch for trashed folders to avoid 404s on backends without detail endpoints in trash

setTrashFiles(filesArr);
setTrashFolders(foldersArr);
// Show root Trash contents immediately using local arrays to avoid async state race
setFiles(withStarOverlay(filesArr as any));
setFolders(withStarOverlay(foldersArr as any));
setCurrentFolder(null);
} catch (error: any) {
const status = error?.status ?? error?.response?.status;
const msg = error?.message || error?.response?.data?.message || 'Unknown error';
console.error('Failed to load trash error:', { error });
toast.error(`Failed to load trash${status ? ` (${status})` : ''}: ${msg}`);
} finally {
setIsLoading(false);
}
};

const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
const files = event.target.files;
if (!files || files.length === 0) return;

setIsUploading(true);

try {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // Upload to backend
    const formData = new FormData();
    formData.append('files', file); // Backend expects 'files' field
    if (currentFolder?.id) {
      formData.append('folderId', currentFolder.id);
    }

    console.log('Uploading file:', { name: file.name, size: file.size, type: file.type });
    const response = await apiClient.uploadFile(formData);
    console.log('Upload response:', response);
    toast.success(`${file.name} uploaded successfully`);
  }

  // Reload data from backend
  await loadFilesAndFolders(currentFolder?.id);
} catch (error: any) {
  console.error('Upload failed:', error);
  toast.error(`Upload failed: ${error.message || 'Please try again.'}`);
} finally {
  setIsUploading(false);
  // Reset input
  event.target.value = '';
}
};

// Handle folder upload (drag and drop folders)
const handleFolderUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  setIsUploading(true);

  try {
    // Group files by top-level folder (webkitRelativePath if available)
    const fileGroups = new Map<string, File[]>();
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const pathParts = file.webkitRelativePath?.split('/') || [file.name];
      const folderName = pathParts[0];
      if (!fileGroups.has(folderName)) fileGroups.set(folderName, []);
      fileGroups.get(folderName)!.push(file);
    }

    // Process each folder group
    for (const [folderName, folderFiles] of fileGroups) {
      // Create a folder under currentFolder if needed
      let folderId = currentFolder?.id;
      if (folderName !== currentFolder?.name) {
        try {
          const created = await apiClient.createFolder({ name: folderName, parentId: currentFolder?.id });
          folderId = (created as any)?.id ?? (created as any)?.data?.id ?? folderId;
        } catch (e) {
          console.warn(`Failed to create folder "${folderName}":`, e);
          // Continue uploading into currentFolder
        }
      }

      // Upload files for this logical folder
      for (const file of folderFiles) {
        const formData = new FormData();
        formData.append('files', file);
        if (folderId) formData.append('folderId', folderId);
        await apiClient.uploadFile(formData);
      }
      toast.success(`Folder "${folderName}" uploaded successfully`);
    }

    // Reload data from backend
    await loadFilesAndFolders(currentFolder?.id);
  } catch (error: any) {
    console.error('Folder upload failed:', error);
    toast.error(`Folder upload failed: ${error.message || 'Please try again.'}`);
  } finally {
    setIsUploading(false);
    // Reset input
    event.target.value = '';
  }
};

  const handleCreateFolder = async () => {
    setShowCreateFolder(true);
  };


  // File operation handlers
  const handleDownload = async (file: FileItem) => {
    try {
      // For now, create a download link
      const link = document.createElement('a');
      link.href = file.url || '#';
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started');
    } catch (error) {
      toast.error('Download failed');
    }
  };

  // Preview a file
  const handlePreview = (file: FileItem) => {
    setPreviewFile(file);
  };

  // Open Share modal for a file or folder
  const handleShare = (item: FileItem | FolderItem, type: 'file' | 'folder') => {
    setShareItem({ item, type });
  };

  // Optimistically toggle star on a file or folder
  const handleStar = (item: FileItem | FolderItem, type: 'file' | 'folder') => {
    const itemId = (item as any)?.id;
    if (!itemId) return;

    const toastLabel = type === 'file' ? 'File' : 'Folder';
    // Toggle within files
    setFiles((prev) => prev.map((f: any) => f.id === itemId ? { ...f, isStarred: !isStarredFlag(f) } : f));
    // Toggle within folders
    setFolders((prev) => prev.map((fo: any) => fo.id === itemId ? { ...fo, isStarred: !isStarredFlag(fo) } : fo));
    // Update client-star set and persist
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId); else next.add(itemId);
      try { localStorage.setItem('starredIds', JSON.stringify(Array.from(next))); } catch {}
      return next;
    });
    toast.success(`${toastLabel} ${isStarredFlag(item) ? 'unstarred' : 'starred'}`);
  };

  const handleDelete = async (item: FileItem | FolderItem, type: 'file' | 'folder') => {
    if (confirm(`Are you sure you want to delete ${item.name}?`)) {
      try {
        if (type === 'file') {
          await apiClient.deleteFile(item.id);
        } else {
          await apiClient.deleteFolder(item.id);
        }
        toast.success(`${type} moved to trash successfully`);
        // Reload current data
        if (isInTrash) {
          await loadTrash();
        } else {
          await loadFilesAndFolders(currentFolder?.id);
        }
      } catch (error: any) {
        toast.error(`Failed to delete ${type}: ${error.message || 'Unknown error'}`);
      }
    }
  };

  // FileGrid interactions
  const handleItemSelect = (id: string, type: 'file' | 'folder') => {
    const key = `${type}-${id}`;
    setSelectedItems((prev) => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const handleItemDoubleClick = (item: FileItem | FolderItem, type: 'file' | 'folder') => {
    if (type === 'folder') {
      if (isInTrash) {
        // Client-side navigate inside Trash using already loaded trash data
        const folder = item as FolderItem;
        setCurrentFolder(folder);
        const fid = String((folder as any).id ?? '');
        const childrenFiles = trashFiles.filter((it: any) => String(getParentId(it) ?? '') === fid);
        let childrenFolders = trashFolders.filter((it: any) => String(getParentId(it) ?? '') === fid);
        // Compute counts for child folders within trash
        const getFolderId = (fo: any): string | undefined =>
          (fo?.id ?? fo?._id ?? fo?.uuid ?? fo?.folderId ?? fo?.folder_id ?? fo?.originalId ?? fo?.original_id ?? fo?.sourceId ?? fo?.source_id ?? fo?.previousId ?? fo?.previous_id ?? fo?.deleted?.id ?? fo?.trash?.id ?? fo?.meta?.id)?.toString();
        const childCounts: Record<string, number> = {};
        for (const it of [...trashFiles, ...trashFolders]) {
          const pid = String(getParentId(it) ?? '');
          if (!pid) continue;
          childCounts[pid] = (childCounts[pid] ?? 0) + 1;
        }
        childrenFolders = childrenFolders.map((fo: any) => {
          const cfid = getFolderId(fo) ?? '';
          return { ...fo, itemCount: childCounts[cfid] ?? 0 };
        });
        setFiles(withStarOverlay(childrenFiles as any));
        setFolders(withStarOverlay(childrenFolders as any));
        setIsInTrash(true);
      } else {
        loadCurrentFolder(item as FolderItem);
      }
    } else {
      handlePreview(item as FileItem);
    }
  };

  const handleRename = async (item: FileItem | FolderItem, type: 'file' | 'folder') => {
    const current = item.name;
    const next = prompt(`Rename ${type}`, current);
    if (!next || next === current) return;
    try {
      if (type === 'file') {
        await apiClient.updateFile(item.id, { name: next });
      } else {
        await apiClient.updateFolder(item.id, { name: next });
      }
      toast.success(`${type === 'file' ? 'File' : 'Folder'} renamed`);
      await loadFilesAndFolders(currentFolder?.id);
    } catch (error: any) {
      toast.error(error.message || 'Failed to rename');
    }
  };

  const handleMove = async (item: FileItem | FolderItem, type: 'file' | 'folder') => {
    const target = prompt('Enter destination folder ID (leave empty for root):', currentFolder?.id || '');
    if (target === null) return; // cancelled
    try {
      if (type === 'file') {
        await apiClient.updateFile(item.id, { folderId: target || undefined });
      } else {
        await apiClient.updateFolder(item.id, { parentId: target || undefined });
      }
      toast.success('Moved successfully');
      await loadFilesAndFolders(currentFolder?.id);
    } catch (error: any) {
      toast.error(error.message || 'Failed to move');
    }
  };

  const handleCopy = async (item: FileItem | FolderItem, type: 'file' | 'folder') => {
    try {
      let link: string | undefined;
      if (type === 'file') {
        const f = item as FileItem;
        link = f.url;
      }
      if (!link) {
        toast('No direct link available. Use Share to create a link.');
        return;
      }
      await navigator.clipboard.writeText(link);
      toast.success('Link copied to clipboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to copy link');
    }
  };

  const handleInfo = (item: FileItem | FolderItem, type: 'file' | 'folder') => {
    const lines: string[] = [];
    lines.push(`${type.toUpperCase()}: ${item.name}`);
    lines.push(`ID: ${item.id}`);
    if (type === 'file') {
      const f = item as FileItem;
      lines.push(`Type: ${f.mimeType}`);
      lines.push(`Size: ${formatBytes(f.size)}`);
    }
    lines.push(`Created: ${formatDate((item as any).createdAt)}`);
    lines.push(`Modified: ${formatDate((item as any).updatedAt)}`);
    console.log('[Details]', item);
    toast(lines.join(' • '));
  };

  // Sidebar navigation
  const handleViewChange = async (view: string) => {
    setCurrentView(view);
    try {
      if (view === 'home') {
        setIsInTrash(false);
        await loadRootFiles();
      } else if (view === 'shared') {
        setIsInTrash(false);
        await loadSharedByMe();
      } else if (view === 'starred') {
        setIsInTrash(false);
        await loadStarred();
      } else if (view === 'recent') {
        setIsInTrash(false);
        await loadRecent();
      } else if (view === 'trash') {
        await loadTrash();
      } else if (view.startsWith('folder-')) {
        toast.success('Opening quick access folder');
      }
    } catch (e) {
      console.error('Failed to change view', e);
    }
  };

  return (
    <>
    {/* Top progress bar when loading */}
    {isLoading && (
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-transparent">
        <div className="top-progress">
          <div className="top-progress-bar" />
        </div>
      </div>
    )}
    <div className="w-full h-full flex">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        onUpload={() => document.getElementById('file-upload')?.click()}
        onCreateFolder={handleCreateFolder}
        className="w-72"
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Premium Header */}
        <header className="p-4 border-b bg-gradient-to-r from-primary/5 via-blue-500/5 to-transparent">
          <div className="flex items-center justify-between gap-4 mb-3">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 min-w-0">
              <Home className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">My Drive</span>
              {currentFolder && (
                <>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium truncate" title={currentFolder.name}>{currentFolder.name}</span>
                </>
              )}
            </div>

            {/* Quick stats */}
            <div className="hidden md:flex items-center gap-4 text-sm">
              <div className="px-3 py-1.5 rounded-full bg-background/60 border">
                Files: <span className="font-medium">{(isInTrash ? trashFiles : files).length}</span>
              </div>
              <div className="px-3 py-1.5 rounded-full bg-background/60 border">
                Folders: <span className="font-medium">{(isInTrash ? trashFolders : folders).length}</span>
              </div>
              {storageInfo.total > 0 && (
                <div className="px-3 py-1.5 rounded-full bg-background/60 border">
                  Storage: <span className="font-medium">{formatBytes(storageInfo.used)} / {plan === 'business' ? '2000 GB' : plan === 'pro' ? '200 GB' : '15 GB'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Search + Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <SearchBar
              onSearch={(q) => setSearchQuery(q)}
              onFileSelect={(file) => handlePreview(file)}
              onFolderSelect={(folder) => loadCurrentFolder(folder)}
              className="flex-1"
            />

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} title="Toggle view">
                {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    {sortDir === 'asc' ? <SortAsc className="w-4 h-4 mr-2" /> : <SortDesc className="w-4 h-4 mr-2" />}
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={() => setSortBy('name')}>Name</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('modified')}>Last modified</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('size')}>Size</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('type')}>Type</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}>
                    {sortDir === 'asc' ? 'Ascending' : 'Descending'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" onClick={() => (isInTrash ? loadTrash() : loadFilesAndFolders(currentFolder?.id))} title="Refresh">
                <RefreshCw className="w-4 h-4" />
              </Button>
              {plan === 'free' ? (
                <Link href="/upgrade">
                  <Button className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white" title="Upgrade plan">
                    <Sparkles className="w-4 h-4 mr-2" /> Upgrade
                  </Button>
                </Link>
              ) : (
                <Link href="/upgrade">
                  <Button variant="outline" title="View your plan">
                    <Sparkles className="w-4 h-4 mr-2" /> View Plan
                  </Button>
                </Link>
              )}
              <Button className="bg-gradient-to-r from-primary to-blue-600 text-white" onClick={() => document.getElementById('file-upload')?.click()}>
                <Plus className="w-4 h-4 mr-2" /> New
              </Button>
              {/* Logout button (right-most) */}
              <Button
                variant="destructive"
                title="Logout"
                onClick={async () => {
                  try {
                    await logout();
                  } finally {
                    router.push('/');
                  }
                }}
              >
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Hidden upload inputs */}
        <input
          id="file-upload"
          type="file"
          multiple
          className="hidden"
          onChange={handleFileUpload}
        />
        {/* Folder upload input removed due to TS typing; will re-add with ref-based attribute if needed */}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4">
          {/* Loading skeleton */}
          {isLoading && (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-xl border bg-background/50 animate-pulse">
                    <div className="h-24 mb-3 bg-muted rounded-xl" />
                    <div className="h-4 w-3/4 bg-muted rounded mb-2" />
                    <div className="h-3 w-1/2 bg-muted rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 mb-6">
                <div className="grid grid-cols-12 gap-4 px-3 py-2 text-sm font-medium text-muted-foreground border-b">
                  <div className="col-span-6 flex items-center space-x-3">
                    <div className="w-5" />
                    <span>Name</span>
                  </div>
                  <div className="col-span-2 hidden md:block">Owner</div>
                  <div className="col-span-2 hidden lg:block">{isInTrash ? 'Deleted' : 'Modified'}</div>
                  <div className="col-span-2 hidden xl:block">Size</div>
                </div>
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-12 gap-4 p-3 rounded-xl border bg-background/50 animate-pulse">
                    <div className="col-span-6 flex items-center space-x-3">
                      <div className="w-5 h-5 bg-muted rounded" />
                      <div className="h-4 w-48 bg-muted rounded" />
                    </div>
                    <div className="col-span-2 hidden md:flex items-center">
                      <div className="h-4 w-24 bg-muted rounded" />
                    </div>
                    <div className="col-span-2 hidden lg:flex items-center">
                      <div className="h-4 w-20 bg-muted rounded" />
                    </div>
                    <div className="col-span-2 hidden xl:flex items-center">
                      <div className="h-4 w-16 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          <FileGrid
            files={getSorted(isInTrash ? trashFiles : files)}
            folders={getSorted(isInTrash ? trashFolders : folders)}
            viewMode={viewMode}
            selectedItems={selectedItems}
            onItemSelect={handleItemSelect}
            onItemDoubleClick={handleItemDoubleClick}
            onDownload={handleDownload}
            onShare={handleShare}
            onRename={handleRename}
            onDelete={handleDelete}
            onStar={handleStar}
            onPreview={handlePreview}
            onMove={handleMove}
            onCopy={handleCopy}
            onInfo={handleInfo}
            isInTrash={isInTrash}
            onRestore={handleRestore}
            onPermanentDelete={handlePermanentDelete}
          />

          {/* Empty State */}
          {((isInTrash && trashFiles.length === 0 && trashFolders.length === 0) || 
            (!isInTrash && files.length === 0 && folders.length === 0)) && !isLoading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Cloud className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                {isInTrash ? 'Trash is empty' : 'No files or folders yet'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {isInTrash 
                  ? 'Deleted files and folders will appear here' 
                  : 'Upload your first file or create a folder to get started'
                }
              </p>
              {!isInTrash && (
                <div className="flex items-center justify-center space-x-4">
                  <Button
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Files
                  </Button>
                  <Button
                    onClick={handleCreateFolder}
                    variant="outline"
                  >
                    <FolderPlus className="w-4 h-4 mr-2" />
                    Create Folder
                  </Button>
                </div>
              )}
    </div>
  )}

        </main>
      </div>
    </div>

      {shareItem && (
        <ShareModal
          item={shareItem!.item}
          type={shareItem!.type}
          isOpen={!!shareItem}
          onClose={() => setShareItem(null)}
          onShare={async (permission, expiresDays) => {
            try {
              if (shareItem?.type === 'file') {
                await apiClient.shareFile(shareItem.item.id, {
                  permission,
                  expiresDays,
                  allowDownload: true,
                });
              } else if (shareItem?.type === 'folder') {
                await apiClient.shareFolder(shareItem.item.id, {
                  permission,
                  expiresDays,
                });
              }
              toast.success('Share link created');
            } catch (error: any) {
              toast.error(error.message || 'Failed to create share link');
              throw error;
            }
          }}
          onUpdateShare={async () => { toast.success('Update share functionality coming soon'); }}
          onRevokeShare={async (id: string) => {
            try {
              if (!shareItem) return;
              const type = shareItem.type === 'folder' ? 'folder' : 'file';
              await apiClient.revokeShare(id, type);
            } catch (error: any) {
              toast.error(error.message || 'Failed to revoke share link');
              throw error;
            }
          }}
        />
      )}

      {showCreateFolder && (
        <CreateFolderModal
          isOpen={showCreateFolder}
          onClose={() => setShowCreateFolder(false)}
          onCreateFolder={async (name, parentId) => {
            try {
              const response = await apiClient.createFolder({
                name,
                parentId: parentId || currentFolder?.id
              });
              toast.success(`Folder "${name}" created successfully`);
              await loadFilesAndFolders(currentFolder?.id);
            } catch (error: any) {
              toast.error(`Failed to create folder: ${error.message || 'Unknown error'}`);
              throw error;
            }
          }}
          parentFolder={currentFolder}
        />
      )}

      {showSettings && (
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    {/* Styled top progress bar animation */}
    <style jsx>{`
      .top-progress { position: relative; width: 100%; height: 4px; overflow: hidden; background: transparent; }
      .top-progress-bar { position: absolute; left: -40%; top: 0; height: 100%; width: 40%; background: linear-gradient(90deg, rgba(59,130,246,0) 0%, rgba(59,130,246,0.6) 50%, rgba(59,130,246,0) 100%); animation: top-progress-move 1s linear infinite; }
      @keyframes top-progress-move { 0% { left: -40%; } 100% { left: 100%; } }
    `}</style>
    </>
  );
}

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) return null;
  if (!isAuthenticated) return null;
  return <DashboardContent />;
}
