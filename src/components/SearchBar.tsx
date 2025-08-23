'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiClient, FileItem, FolderItem } from '@/lib/api';
import { formatBytes, formatDate, getFileIconComponent, debounce } from '@/lib/utils';
import {
  Search,
  Filter,
  X,
  Clock,
  File,
  Folder,
  Image,
  Video,
  Music,
  FileText,
  Archive,
  Calendar,
  User,
  HardDrive,
  Star,
  Loader2,
  TrendingUp,
  History
} from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string, filters?: SearchFilters) => void;
  onFileSelect: (file: FileItem) => void;
  onFolderSelect: (folder: FolderItem) => void;
  placeholder?: string;
  className?: string;
}

interface SearchFilters {
  type?: 'all' | 'files' | 'folders' | 'images' | 'videos' | 'audio' | 'documents' | 'archives';
  owner?: 'me' | 'shared' | 'all';
  dateRange?: 'today' | 'week' | 'month' | 'year' | 'all';
  starred?: boolean;
  size?: 'small' | 'medium' | 'large' | 'all';
}

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'suggestion' | 'file' | 'folder';
  item?: FileItem | FolderItem;
  icon?: React.ReactNode;
}

const defaultFilters: SearchFilters = {
  type: 'all',
  owner: 'all',
  dateRange: 'all',
  starred: false,
  size: 'all'
};

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onFileSelect,
  onFolderSelect,
  placeholder = "Search files and folders...",
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<{
    files: FileItem[];
    folders: FolderItem[];
    total: number;
  }>({ files: [], folders: [], total: 0 });

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Debounced search suggestions
  const debouncedGetSuggestions = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setSuggestions([]);
        return;
      }

      try {
        setIsSearching(true);
        const response = await apiClient.searchSuggestions(searchQuery);
        
        const suggestions: SearchSuggestion[] = [
          // Recent searches
          ...recentSearches
            .filter(recent => recent.toLowerCase().includes(searchQuery.toLowerCase()))
            .slice(0, 3)
            .map(recent => ({
              id: `recent-${recent}`,
              text: recent,
              type: 'recent' as const,
              icon: <History className="w-4 h-4 text-muted-foreground" />
            })),
          
          // Search suggestions
          ...response.suggestions.slice(0, 5).map((suggestion, index) => ({
            id: `suggestion-${index}`,
            text: suggestion,
            type: 'suggestion' as const,
            icon: <TrendingUp className="w-4 h-4 text-muted-foreground" />
          })),
          
          // File results
          ...response.files.slice(0, 5).map(file => ({
            id: `file-${file.id}`,
            text: file.name,
            type: 'file' as const,
            item: file,
            icon: (() => { const { icon: Icon, color } = getFileIconComponent(file.mimeType || ''); return <Icon className={`w-4 h-4 ${color}`} /> })()
          })),
          
          // Folder results
          ...response.folders.slice(0, 3).map(folder => ({
            id: `folder-${folder.id}`,
            text: folder.name,
            type: 'folder' as const,
            item: folder,
            icon: <Folder className="w-4 h-4 text-primary" />
          }))
        ];

        setSuggestions(suggestions);
      } catch (error) {
        console.error('Failed to get search suggestions:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [recentSearches]
  );

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.trim()) {
      debouncedGetSuggestions(value);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle search submission
  const handleSearch = (searchQuery?: string, searchFilters?: SearchFilters) => {
    const finalQuery = searchQuery || query;
    const finalFilters = searchFilters || filters;
    
    if (!finalQuery.trim()) return;

    saveRecentSearch(finalQuery);
    onSearch(finalQuery, finalFilters);
    setShowSuggestions(false);
    
    // Perform actual search
    performSearch(finalQuery, finalFilters);
  };

  // Perform search API call
  const performSearch = async (searchQuery: string, searchFilters: SearchFilters) => {
    try {
      setIsSearching(true);
      const response = await apiClient.search(searchQuery, {
        type: searchFilters.type,
        owner: searchFilters.owner,
        dateRange: searchFilters.dateRange,
        starred: searchFilters.starred,
        size: searchFilters.size
      });
      
      setSearchResults(response);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'file' && suggestion.item) {
      onFileSelect(suggestion.item as FileItem);
    } else if (suggestion.type === 'folder' && suggestion.item) {
      onFolderSelect(suggestion.item as FolderItem);
    } else {
      setQuery(suggestion.text);
      handleSearch(suggestion.text);
    }
    setShowSuggestions(false);
  };

  // Handle key navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getFilterIcon = (type: string) => {
    switch (type) {
      case 'files': return <File className="w-4 h-4" />;
      case 'folders': return <Folder className="w-4 h-4" />;
      case 'images': return <Image className="w-4 h-4" />;
      case 'videos': return <Video className="w-4 h-4" />;
      case 'audio': return <Music className="w-4 h-4" />;
      case 'documents': return <FileText className="w-4 h-4" />;
      case 'archives': return <Archive className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    const defaultValue = defaultFilters[key as keyof SearchFilters];
    return value !== defaultValue;
  }).length;

  return (
    <div className={`relative ${className}`}>
      <div className="relative flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (query.trim() && suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            className="pl-10 pr-20 h-12 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary/50 focus:bg-background transition-all duration-200"
          />
          
          {/* Loading indicator */}
          {isSearching && (
            <div className="absolute right-16 top-1/2 transform -translate-y-1/2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          )}
          
          {/* Clear button */}
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-12 top-1/2 transform -translate-y-1/2 w-8 h-8"
              onClick={() => {
                setQuery('');
                setSuggestions([]);
                setShowSuggestions(false);
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Filter button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="ml-2 h-12 w-12 relative"
            >
              <Filter className="w-4 h-4" />
              {activeFiltersCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="p-2">
              <h4 className="font-medium mb-2">File Type</h4>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { key: 'all', label: 'All', icon: <Search className="w-4 h-4" /> },
                  { key: 'files', label: 'Files', icon: <File className="w-4 h-4" /> },
                  { key: 'folders', label: 'Folders', icon: <Folder className="w-4 h-4" /> },
                  { key: 'images', label: 'Images', icon: <Image className="w-4 h-4" /> },
                  { key: 'videos', label: 'Videos', icon: <Video className="w-4 h-4" /> },
                  { key: 'audio', label: 'Audio', icon: <Music className="w-4 h-4" /> },
                  { key: 'documents', label: 'Docs', icon: <FileText className="w-4 h-4" /> },
                  { key: 'archives', label: 'Archives', icon: <Archive className="w-4 h-4" /> }
                ].map(({ key, label, icon }) => (
                  <Button
                    key={key}
                    variant={filters.type === key ? "default" : "ghost"}
                    size="sm"
                    className="justify-start h-8"
                    onClick={() => setFilters(prev => ({ ...prev, type: key as any }))}
                  >
                    {icon}
                    <span className="ml-1 text-xs">{label}</span>
                  </Button>
                ))}
              </div>
            </div>
            
            <DropdownMenuSeparator />
            
            <div className="p-2">
              <h4 className="font-medium mb-2">Owner</h4>
              <div className="space-y-1">
                {[
                  { key: 'all', label: 'All files' },
                  { key: 'me', label: 'Owned by me' },
                  { key: 'shared', label: 'Shared with me' }
                ].map(({ key, label }) => (
                  <Button
                    key={key}
                    variant={filters.owner === key ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-start h-8"
                    onClick={() => setFilters(prev => ({ ...prev, owner: key as any }))}
                  >
                    <User className="w-4 h-4 mr-2" />
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <DropdownMenuSeparator />

            <div className="p-2">
              <h4 className="font-medium mb-2">Date Modified</h4>
              <div className="space-y-1">
                {[
                  { key: 'all', label: 'Any time' },
                  { key: 'today', label: 'Today' },
                  { key: 'week', label: 'This week' },
                  { key: 'month', label: 'This month' },
                  { key: 'year', label: 'This year' }
                ].map(({ key, label }) => (
                  <Button
                    key={key}
                    variant={filters.dateRange === key ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-start h-8"
                    onClick={() => setFilters(prev => ({ ...prev, dateRange: key as any }))}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => setFilters(prev => ({ ...prev, starred: !prev.starred }))}
            >
              <Star className={`w-4 h-4 mr-2 ${filters.starred ? 'text-yellow-500 fill-current' : ''}`} />
              Starred only
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => setShowAdvancedSearch(true)}>
              <Search className="w-4 h-4 mr-2" />
              Advanced Search
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 z-50 mt-2 bg-popover border rounded-lg shadow-lg max-h-96 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              className="flex items-center space-x-3 px-4 py-3 hover:bg-accent cursor-pointer transition-colors duration-150 border-b last:border-b-0"
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              <div className="flex-shrink-0">
                {suggestion.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{suggestion.text}</p>
                {suggestion.item && (
                  <p className="text-xs text-muted-foreground">
                    {suggestion.type === 'file' && (
                      <>
                        {formatBytes((suggestion.item as FileItem).size)} • 
                        {formatDate(suggestion.item.updatedAt)}
                      </>
                    )}
                    {suggestion.type === 'folder' && (
                      <>
                        {(suggestion.item as FolderItem).fileCount || 0} items • 
                        {formatDate(suggestion.item.updatedAt)}
                      </>
                    )}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0 text-xs text-muted-foreground">
                {suggestion.type === 'recent' && 'Recent'}
                {suggestion.type === 'suggestion' && 'Suggestion'}
                {suggestion.type === 'file' && 'File'}
                {suggestion.type === 'folder' && 'Folder'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Advanced Search Dialog */}
      <Dialog open={showAdvancedSearch} onOpenChange={setShowAdvancedSearch}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Advanced Search</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Search Query</label>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter search terms..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">File Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  <option value="all">All Types</option>
                  <option value="files">Files Only</option>
                  <option value="folders">Folders Only</option>
                  <option value="images">Images</option>
                  <option value="videos">Videos</option>
                  <option value="audio">Audio</option>
                  <option value="documents">Documents</option>
                  <option value="archives">Archives</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Owner</label>
                <select
                  value={filters.owner}
                  onChange={(e) => setFilters(prev => ({ ...prev, owner: e.target.value as any }))}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  <option value="all">All Files</option>
                  <option value="me">Owned by Me</option>
                  <option value="shared">Shared with Me</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  <option value="all">Any Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">File Size</label>
                <select
                  value={filters.size}
                  onChange={(e) => setFilters(prev => ({ ...prev, size: e.target.value as any }))}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  <option value="all">Any Size</option>
                  <option value="small">Small (&lt; 1MB)</option>
                  <option value="medium">Medium (1-10MB)</option>
                  <option value="large">Large (&gt; 10MB)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="starred"
                checked={filters.starred}
                onChange={(e) => setFilters(prev => ({ ...prev, starred: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="starred" className="text-sm font-medium">
                Starred files only
              </label>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setFilters(defaultFilters);
                  setQuery('');
                }}
              >
                Clear All
              </Button>
              <Button
                onClick={() => {
                  handleSearch(query, filters);
                  setShowAdvancedSearch(false);
                }}
                className="bg-gradient-to-r from-primary to-blue-600"
              >
                Search
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
