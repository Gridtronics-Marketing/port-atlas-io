import { useState } from 'react';
import { PlayCircle, Upload, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TradeTubeFolderSidebar } from '@/components/TradeTubeFolderSidebar';
import { TradeTubeContentGrid } from '@/components/TradeTubeContentGrid';
import { TradeTubeSearchBar } from '@/components/TradeTubeSearchBar';
import { TradeTubeUploadModal } from '@/components/TradeTubeUploadModal';
import { TradeTubeMediaPlayer } from '@/components/TradeTubeMediaPlayer';
import { useTradeTubeFolders, TradeTubeFolder } from '@/hooks/useTradeTubeFolders';
import { useTradeTubeContent, TradeTubeContent, MediaType } from '@/hooks/useTradeTubeContent';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const TradeTube = () => {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<MediaType | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'most_viewed' | 'alphabetical'>('newest');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<TradeTubeContent | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [deleteConfirmContent, setDeleteConfirmContent] = useState<TradeTubeContent | null>(null);

  const { hasAnyRole } = useUserRoles();
  const { userRole } = useOrganization();
  
  const canUpload = hasAnyRole(['admin', 'project_manager']) || 
    ['owner', 'admin', 'project_manager'].includes(userRole || '');
  const canManageFolders = hasAnyRole(['admin']) || 
    ['owner', 'admin'].includes(userRole || '');

  const { folders, loading: foldersLoading, createFolder, deleteFolder } = useTradeTubeFolders();
  const { 
    content, 
    loading: contentLoading, 
    createContent, 
    deleteContent, 
    recordView,
    uploadFile 
  } = useTradeTubeContent({
    folderId: selectedFolderId,
    mediaType: mediaTypeFilter,
    searchQuery,
    sortBy,
  });

  const handleUpload = async (data: {
    file: File;
    title: string;
    description?: string;
    mediaType: MediaType;
    folderId?: string;
    tags?: string[];
  }) => {
    const fileUrl = await uploadFile(data.file, data.mediaType);
    if (!fileUrl) return;

    await createContent({
      title: data.title,
      description: data.description,
      media_type: data.mediaType,
      file_url: fileUrl,
      file_size: data.file.size,
      folder_id: data.folderId,
      tags: data.tags,
    });
  };

  const handlePlay = (item: TradeTubeContent) => {
    setSelectedContent(item);
    setIsPlayerOpen(true);
  };

  const handleDeleteContent = async () => {
    if (deleteConfirmContent) {
      await deleteContent(deleteConfirmContent.id);
      setDeleteConfirmContent(null);
    }
  };

  const handleCreateFolder = async (name: string, description?: string) => {
    await createFolder({ name, description });
  };

  const handleDeleteFolder = async (folder: TradeTubeFolder) => {
    if (confirm(`Delete folder "${folder.name}"? Content will be moved to "All Content".`)) {
      await deleteFolder(folder.id);
      if (selectedFolderId === folder.id) {
        setSelectedFolderId(null);
      }
    }
  };

  const selectedFolder = folders.find(f => f.id === selectedFolderId);

  return (
    <main className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent flex items-center gap-2">
            <PlayCircle className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
            TradeTube™
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Your internal knowledge library for training and procedures
          </p>
        </div>
        
        {canUpload && (
          <Button onClick={() => setIsUploadModalOpen(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Content
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <TradeTubeSearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        mediaTypeFilter={mediaTypeFilter}
        onMediaTypeChange={setMediaTypeFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Folder Sidebar */}
        <Card className="lg:w-64 shrink-0">
          <TradeTubeFolderSidebar
            folders={folders}
            loading={foldersLoading}
            selectedFolderId={selectedFolderId}
            onSelectFolder={setSelectedFolderId}
            onCreateFolder={canManageFolders ? handleCreateFolder : undefined}
            onDeleteFolder={canManageFolders ? handleDeleteFolder : undefined}
            canManageFolders={canManageFolders}
          />
        </Card>

        {/* Content Grid */}
        <div className="flex-1 min-w-0">
          {selectedFolder && (
            <div className="mb-4">
              <h2 className="text-lg font-semibold">{selectedFolder.name}</h2>
              {selectedFolder.description && (
                <p className="text-sm text-muted-foreground">{selectedFolder.description}</p>
              )}
            </div>
          )}
          
          <TradeTubeContentGrid
            content={content}
            loading={contentLoading}
            onPlay={handlePlay}
            onDelete={canUpload ? setDeleteConfirmContent : undefined}
            canEdit={canUpload}
            emptyMessage={
              selectedFolderId 
                ? `No content in ${selectedFolder?.name || 'this folder'}`
                : searchQuery 
                  ? 'No content matches your search'
                  : 'No content uploaded yet'
            }
          />
        </div>
      </div>

      {/* Upload Modal */}
      <TradeTubeUploadModal
        open={isUploadModalOpen}
        onOpenChange={setIsUploadModalOpen}
        folders={folders}
        onUpload={handleUpload}
      />

      {/* Media Player */}
      <TradeTubeMediaPlayer
        content={selectedContent}
        open={isPlayerOpen}
        onOpenChange={setIsPlayerOpen}
        onRecordView={recordView}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmContent} onOpenChange={() => setDeleteConfirmContent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Content</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirmContent?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteContent} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
};

export default TradeTube;
