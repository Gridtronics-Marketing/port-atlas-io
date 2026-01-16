import { TradeTubeContent } from '@/hooks/useTradeTubeContent';
import { TradeTubeContentCard } from './TradeTubeContentCard';
import { Skeleton } from '@/components/ui/skeleton';
import { FolderOpen } from 'lucide-react';

interface TradeTubeContentGridProps {
  content: TradeTubeContent[];
  loading: boolean;
  onPlay: (content: TradeTubeContent) => void;
  onEdit?: (content: TradeTubeContent) => void;
  onDelete?: (content: TradeTubeContent) => void;
  canEdit?: boolean;
  emptyMessage?: string;
}

export function TradeTubeContentGrid({
  content,
  loading,
  onPlay,
  onEdit,
  onDelete,
  canEdit = false,
  emptyMessage = "No content yet"
}: TradeTubeContentGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-video w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (content.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <FolderOpen className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">{emptyMessage}</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Upload videos, documents, audio, and images to build your knowledge library
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {content.map((item) => (
        <TradeTubeContentCard
          key={item.id}
          content={item}
          onPlay={onPlay}
          onEdit={onEdit}
          onDelete={onDelete}
          canEdit={canEdit}
        />
      ))}
    </div>
  );
}
