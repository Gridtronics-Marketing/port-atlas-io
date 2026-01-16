import { Video, FileText, Music, Image, Mic, Play, Eye, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TradeTubeContent, MediaType } from '@/hooks/useTradeTubeContent';
import { formatDistanceToNow } from 'date-fns';

interface TradeTubeContentCardProps {
  content: TradeTubeContent;
  onPlay: (content: TradeTubeContent) => void;
  onEdit?: (content: TradeTubeContent) => void;
  onDelete?: (content: TradeTubeContent) => void;
  canEdit?: boolean;
}

const mediaTypeIcons: Record<MediaType, React.ElementType> = {
  video: Video,
  audio: Music,
  document: FileText,
  image: Image,
  voice_note: Mic,
};

const mediaTypeColors: Record<MediaType, string> = {
  video: 'bg-red-500/10 text-red-600 border-red-500/20',
  audio: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  document: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  image: 'bg-green-500/10 text-green-600 border-green-500/20',
  voice_note: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
};

const mediaTypeLabels: Record<MediaType, string> = {
  video: 'Video',
  audio: 'Audio',
  document: 'Document',
  image: 'Image',
  voice_note: 'Voice Note',
};

export function TradeTubeContentCard({ 
  content, 
  onPlay, 
  onEdit, 
  onDelete,
  canEdit = false 
}: TradeTubeContentCardProps) {
  const Icon = mediaTypeIcons[content.media_type];
  const colorClass = mediaTypeColors[content.media_type];
  const label = mediaTypeLabels[content.media_type];

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return null;
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  };

  return (
    <Card 
      className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] overflow-hidden"
      onClick={() => onPlay(content)}
    >
      {/* Thumbnail area */}
      <div className="relative aspect-video bg-muted flex items-center justify-center overflow-hidden">
        {content.thumbnail_url ? (
          <img 
            src={content.thumbnail_url} 
            alt={content.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${colorClass}`}>
            <Icon className="h-12 w-12 opacity-60" />
          </div>
        )}
        
        {/* Play overlay for video/audio */}
        {(content.media_type === 'video' || content.media_type === 'audio' || content.media_type === 'voice_note') && (
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
              <Play className="h-7 w-7 text-foreground fill-current ml-1" />
            </div>
          </div>
        )}

        {/* Duration badge */}
        {content.duration_seconds && (
          <Badge className="absolute bottom-2 right-2 bg-black/70 text-white text-xs">
            {formatDuration(content.duration_seconds)}
          </Badge>
        )}

        {/* Media type badge */}
        <Badge className={`absolute top-2 left-2 ${colorClass} text-xs`}>
          <Icon className="h-3 w-3 mr-1" />
          {label}
        </Badge>

        {/* Featured badge */}
        {content.is_featured && (
          <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs">
            Featured
          </Badge>
        )}
      </div>

      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm line-clamp-2 mb-1">
              {content.title}
            </h3>
            {content.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {content.description}
              </p>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {content.view_count} views
              </span>
              <span>
                {formatDistanceToNow(new Date(content.created_at), { addSuffix: true })}
              </span>
              {content.file_size && (
                <span>{formatFileSize(content.file_size)}</span>
              )}
            </div>
          </div>

          {canEdit && (onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(content); }}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={(e) => { e.stopPropagation(); onDelete(content); }}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Tags */}
        {content.tags && content.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {content.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                {tag}
              </Badge>
            ))}
            {content.tags.length > 3 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                +{content.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
