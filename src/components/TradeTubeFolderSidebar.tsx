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
  ChevronRight,
  GripVertical,
  FileText,
  Lightbulb,
  Settings,
  Package,
  Video,
  Camera,
  Bell,
  Star,
  BarChart,
  Lock,
  Briefcase,
  GraduationCap,
  Tag
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TradeTubeFolder } from '@/hooks/useTradeTubeFolders';
import { TradeTubeIconPicker } from '@/components/TradeTubeIconPicker';
import { cn } from '@/lib/utils';

interface TradeTubeFolderSidebarProps {
  folders: TradeTubeFolder[];
  loading: boolean;
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder?: (name: string, description?: string, parentId?: string, icon?: string) => void;
  onUpdateFolder?: (id: string, updates: { name?: string; description?: string; icon?: string; parent_id?: string | null }) => void;
  onDeleteFolder?: (folder: TradeTubeFolder) => void;
  onReorderFolders?: (folderId: string, targetFolderId: string, position: 'before' | 'after') => void;
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
  'file-text': FileText,
  'lightbulb': Lightbulb,
  'settings': Settings,
  'package': Package,
  'video': Video,
  'camera': Camera,
  'bell': Bell,
  'star': Star,
  'bar-chart': BarChart,
  'lock': Lock,
  'briefcase': Briefcase,
  'graduation-cap': GraduationCap,
  'tag': Tag,
};

export function TradeTubeFolderSidebar({
  folders,
  loading,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  onReorderFolders,
  canManageFolders = false,
}: TradeTubeFolderSidebarProps) {
  // Create dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [newFolderIcon, setNewFolderIcon] = useState('folder');
  const [parentFolderId, setParentFolderId] = useState<string>('top-level');

  // Edit dialog state
  const [editingFolder, setEditingFolder] = useState<TradeTubeFolder | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [editFolderDescription, setEditFolderDescription] = useState('');
  const [editFolderIcon, setEditFolderIcon] = useState('folder');
  const [editParentFolderId, setEditParentFolderId] = useState<string>('top-level');

  // Drag and drop state
  const [draggedFolderId, setDraggedFolderId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  // Separate top-level and nested folders
  const topLevelFolders = folders.filter(f => !f.parent_id);
  const getSubfolders = (parentId: string) => folders.filter(f => f.parent_id === parentId);

  const handleCreateFolder = () => {
    if (newFolderName.trim() && onCreateFolder) {
      onCreateFolder(
        newFolderName.trim(),
        newFolderDescription.trim() || undefined,
        parentFolderId === 'top-level' ? undefined : parentFolderId,
        newFolderIcon
      );
      setNewFolderName('');
      setNewFolderDescription('');
      setNewFolderIcon('folder');
      setParentFolderId('top-level');
      setIsCreateDialogOpen(false);
    }
  };

  const handleOpenEditDialog = (folder: TradeTubeFolder) => {
    setEditingFolder(folder);
    setEditFolderName(folder.name);
    setEditFolderDescription(folder.description || '');
    setEditFolderIcon(folder.icon);
    setEditParentFolderId(folder.parent_id || 'top-level');
  };

  const handleUpdateFolder = () => {
    if (editingFolder && editFolderName.trim() && onUpdateFolder) {
      onUpdateFolder(editingFolder.id, {
        name: editFolderName.trim(),
        description: editFolderDescription.trim() || undefined,
        icon: editFolderIcon,
        parent_id: editParentFolderId === 'top-level' ? null : editParentFolderId,
      });
      setEditingFolder(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, folderId: string) => {
    setDraggedFolderId(folderId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    if (draggedFolderId && draggedFolderId !== folderId) {
      setDragOverFolderId(folderId);
    }
  };

  const handleDragLeave = () => {
    setDragOverFolderId(null);
  };

  const handleDrop = (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault();
    if (draggedFolderId && draggedFolderId !== targetFolderId && onReorderFolders) {
      onReorderFolders(draggedFolderId, targetFolderId, 'after');
    }
    setDraggedFolderId(null);
    setDragOverFolderId(null);
  };

  const handleDragEnd = () => {
    setDraggedFolderId(null);
    setDragOverFolderId(null);
  };

  const getIcon = (iconName: string) => {
    return iconMap[iconName] || Folder;
  };

  const renderFolderButton = (folder: TradeTubeFolder, isNested: boolean = false) => {
    const Icon = getIcon(folder.icon);
    const isSelected = selectedFolderId === folder.id;
    const isDragging = draggedFolderId === folder.id;
    const isDragOver = dragOverFolderId === folder.id;

    return (
      <div 
        key={folder.id} 
        className={cn(
          "group flex items-center gap-1", 
          isNested && "ml-3",
          isDragging && "opacity-50",
          isDragOver && "bg-primary/10 rounded-md"
        )}
        draggable={canManageFolders && !!onReorderFolders}
        onDragStart={(e) => handleDragStart(e, folder.id)}
        onDragOver={(e) => handleDragOver(e, folder.id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, folder.id)}
        onDragEnd={handleDragEnd}
      >
        {canManageFolders && onReorderFolders && (
          <GripVertical className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab shrink-0" />
        )}
        {isNested && (
          <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
        )}
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

        {canManageFolders && (onUpdateFolder || onDeleteFolder) && (
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
              {onUpdateFolder && (
                <DropdownMenuItem onClick={() => handleOpenEditDialog(folder)}>
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

          {/* Folder list with hierarchy */}
          {topLevelFolders.map((folder) => (
            <div key={folder.id}>
              {renderFolderButton(folder, false)}
              {getSubfolders(folder.id).map((subfolder) => 
                renderFolderButton(subfolder, true)
              )}
            </div>
          ))}

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
            <TradeTubeIconPicker
              selectedIcon={newFolderIcon}
              onSelectIcon={setNewFolderIcon}
            />
            <div className="space-y-2">
              <Label htmlFor="folder-location">Location</Label>
              <Select value={parentFolderId} onValueChange={setParentFolderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top-level">
                    <span className="flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      Top-level folder
                    </span>
                  </SelectItem>
                  {topLevelFolders.map((folder) => {
                    const Icon = getIcon(folder.icon);
                    return (
                      <SelectItem key={folder.id} value={folder.id}>
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          Under: {folder.name}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
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

      {/* Edit Folder Dialog */}
      <Dialog open={!!editingFolder} onOpenChange={(open) => !open && setEditingFolder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
            <DialogDescription>
              Update folder details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <TradeTubeIconPicker
              selectedIcon={editFolderIcon}
              onSelectIcon={setEditFolderIcon}
            />
            <div className="space-y-2">
              <Label htmlFor="edit-folder-location">Location</Label>
              <Select value={editParentFolderId} onValueChange={setEditParentFolderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top-level">
                    <span className="flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      Top-level folder
                    </span>
                  </SelectItem>
                  {topLevelFolders
                    .filter(f => f.id !== editingFolder?.id) // Can't nest under itself
                    .map((folder) => {
                      const Icon = getIcon(folder.icon);
                      return (
                        <SelectItem key={folder.id} value={folder.id}>
                          <span className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            Under: {folder.name}
                          </span>
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-folder-name">Folder Name</Label>
              <Input
                id="edit-folder-name"
                value={editFolderName}
                onChange={(e) => setEditFolderName(e.target.value)}
                placeholder="e.g., Safety Training"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-folder-description">Description (optional)</Label>
              <Textarea
                id="edit-folder-description"
                value={editFolderDescription}
                onChange={(e) => setEditFolderDescription(e.target.value)}
                placeholder="What type of content goes in this folder?"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingFolder(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateFolder} disabled={!editFolderName.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
