import { useState } from 'react';
import { 
  Folder, 
  FolderOpen, 
  Plus, 
  BookOpen, 
  UserPlus, 
  Wrench, 
  ShieldCheck, 
  Building, 
  MapPin,
  MoreVertical,
  Pencil,
  Trash2,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TradeTubeFolder } from '@/hooks/useTradeTubeFolders';
import { cn } from '@/lib/utils';

interface TradeTubeFolderSidebarProps {
  folders: TradeTubeFolder[];
  loading: boolean;
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder?: (name: string, description?: string) => void;
  onEditFolder?: (folder: TradeTubeFolder) => void;
  onDeleteFolder?: (folder: TradeTubeFolder) => void;
  canManageFolders?: boolean;
}

const iconMap: Record<string, React.ElementType> = {
  'folder': Folder,
  'book-open': BookOpen,
  'user-plus': UserPlus,
  'wrench': Wrench,
  'shield-check': ShieldCheck,
  'building': Building,
  'map-pin': MapPin,
};

export function TradeTubeFolderSidebar({
  folders,
  loading,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  canManageFolders = false,
}: TradeTubeFolderSidebarProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');

  const handleCreateFolder = () => {
    if (newFolderName.trim() && onCreateFolder) {
      onCreateFolder(newFolderName.trim(), newFolderDescription.trim() || undefined);
      setNewFolderName('');
      setNewFolderDescription('');
      setIsCreateDialogOpen(false);
    }
  };

  const getIcon = (iconName: string) => {
    return iconMap[iconName] || Folder;
  };

  if (loading) {
    return (
      <div className="w-full space-y-2 p-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Folders</h3>
          {canManageFolders && onCreateFolder && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* All Content option */}
          <Button
            variant={selectedFolderId === null ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-2 h-9 px-2",
              selectedFolderId === null && "bg-primary/10 text-primary"
            )}
            onClick={() => onSelectFolder(null)}
          >
            <FolderOpen className="h-4 w-4 shrink-0" />
            <span className="truncate">All Content</span>
          </Button>

          {/* Folder list */}
          {folders.map((folder) => {
            const Icon = getIcon(folder.icon);
            const isSelected = selectedFolderId === folder.id;

            return (
              <div key={folder.id} className="group flex items-center gap-1">
                <Button
                  variant={isSelected ? "secondary" : "ghost"}
                  className={cn(
                    "flex-1 justify-start gap-2 h-9 px-2",
                    isSelected && "bg-primary/10 text-primary"
                  )}
                  onClick={() => onSelectFolder(folder.id)}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{folder.name}</span>
                </Button>

                {canManageFolders && (onEditFolder || onDeleteFolder) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onEditFolder && (
                        <DropdownMenuItem onClick={() => onEditFolder(folder)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {onDeleteFolder && (
                        <DropdownMenuItem
                          onClick={() => onDeleteFolder(folder)}
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
            );
          })}

          {folders.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No folders yet
            </p>
          )}
        </div>
      </ScrollArea>

      {/* Create Folder Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Organize your content by creating folders
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g., Safety Training"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="folder-description">Description (optional)</Label>
              <Textarea
                id="folder-description"
                value={newFolderDescription}
                onChange={(e) => setNewFolderDescription(e.target.value)}
                placeholder="What type of content goes in this folder?"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
