import { Search, SlidersHorizontal, Video, FileText, Music, Image, Mic, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { MediaType } from '@/hooks/useTradeTubeContent';

interface TradeTubeSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  mediaTypeFilter: MediaType | null;
  onMediaTypeChange: (type: MediaType | null) => void;
  sortBy: 'newest' | 'oldest' | 'most_viewed' | 'alphabetical';
  onSortChange: (sort: 'newest' | 'oldest' | 'most_viewed' | 'alphabetical') => void;
}

const mediaTypes: { value: MediaType; label: string; icon: React.ElementType }[] = [
  { value: 'video', label: 'Videos', icon: Video },
  { value: 'audio', label: 'Audio', icon: Music },
  { value: 'document', label: 'Documents', icon: FileText },
  { value: 'image', label: 'Images', icon: Image },
  { value: 'voice_note', label: 'Voice Notes', icon: Mic },
];

export function TradeTubeSearchBar({
  searchQuery,
  onSearchChange,
  mediaTypeFilter,
  onMediaTypeChange,
  sortBy,
  onSortChange,
}: TradeTubeSearchBarProps) {
  const activeFiltersCount = (mediaTypeFilter ? 1 : 0) + (sortBy !== 'newest' ? 1 : 0);

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search content..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => onSearchChange('')}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Media Type Filter - Desktop */}
      <div className="hidden md:flex gap-1">
        <Button
          variant={mediaTypeFilter === null ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onMediaTypeChange(null)}
        >
          All
        </Button>
        {mediaTypes.map(({ value, label, icon: Icon }) => (
          <Button
            key={value}
            variant={mediaTypeFilter === value ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onMediaTypeChange(mediaTypeFilter === value ? null : value)}
            className="gap-1.5"
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">{label}</span>
          </Button>
        ))}
      </div>

      {/* Filters Popover - Mobile */}
      <div className="flex gap-2 md:hidden">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="end">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Content Type</label>
                <div className="flex flex-wrap gap-1">
                  <Button
                    variant={mediaTypeFilter === null ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => onMediaTypeChange(null)}
                  >
                    All
                  </Button>
                  {mediaTypes.map(({ value, label, icon: Icon }) => (
                    <Button
                      key={value}
                      variant={mediaTypeFilter === value ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => onMediaTypeChange(mediaTypeFilter === value ? null : value)}
                      className="gap-1"
                    >
                      <Icon className="h-3 w-3" />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Sort By</label>
                <Select value={sortBy} onValueChange={(v) => onSortChange(v as typeof sortBy)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="most_viewed">Most Viewed</SelectItem>
                    <SelectItem value="alphabetical">Alphabetical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Sort Select - Desktop */}
      <Select value={sortBy} onValueChange={(v) => onSortChange(v as typeof sortBy)}>
        <SelectTrigger className="w-[140px] hidden md:flex">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest First</SelectItem>
          <SelectItem value="oldest">Oldest First</SelectItem>
          <SelectItem value="most_viewed">Most Viewed</SelectItem>
          <SelectItem value="alphabetical">Alphabetical</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
