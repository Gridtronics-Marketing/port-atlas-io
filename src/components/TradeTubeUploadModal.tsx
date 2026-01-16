import { useState, useCallback } from 'react';
import { Upload, X, Video, FileText, Music, Image, Mic, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TradeTubeFolder } from '@/hooks/useTradeTubeFolders';
import { MediaType } from '@/hooks/useTradeTubeContent';
import { cn } from '@/lib/utils';

interface TradeTubeUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: TradeTubeFolder[];
  onUpload: (data: {
    file: File;
    title: string;
    description?: string;
    mediaType: MediaType;
    folderId?: string;
    tags?: string[];
  }) => Promise<void>;
}

const mediaTypeConfig: Record<MediaType, { 
  icon: React.ElementType; 
  label: string; 
  accept: string;
  extensions: string[];
}> = {
  video: { 
    icon: Video, 
    label: 'Video', 
    accept: 'video/mp4,video/webm,video/quicktime',
    extensions: ['mp4', 'webm', 'mov']
  },
  audio: { 
    icon: Music, 
    label: 'Audio', 
    accept: 'audio/mpeg,audio/wav,audio/x-m4a,audio/mp4',
    extensions: ['mp3', 'wav', 'm4a']
  },
  document: { 
    icon: FileText, 
    label: 'Document', 
    accept: 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation',
    extensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']
  },
  image: { 
    icon: Image, 
    label: 'Image', 
    accept: 'image/jpeg,image/png,image/gif,image/webp',
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp']
  },
  voice_note: { 
    icon: Mic, 
    label: 'Voice Note', 
    accept: 'audio/mpeg,audio/wav,audio/x-m4a,audio/mp4,audio/webm',
    extensions: ['mp3', 'wav', 'm4a', 'webm']
  },
};

export function TradeTubeUploadModal({
  open,
  onOpenChange,
  folders,
  onUpload,
}: TradeTubeUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('video');
  const [folderId, setFolderId] = useState<string>('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const detectMediaType = (file: File): MediaType => {
    const type = file.type.toLowerCase();
    if (type.startsWith('video/')) return 'video';
    if (type.startsWith('audio/')) return 'audio';
    if (type.startsWith('image/')) return 'image';
    if (type.includes('pdf') || type.includes('document') || type.includes('sheet') || type.includes('presentation')) return 'document';
    return 'document';
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    // Auto-detect media type
    setMediaType(detectMediaType(selectedFile));
    // Auto-fill title from filename if empty
    if (!title) {
      const name = selectedFile.name.replace(/\.[^/.]+$/, '');
      setTitle(name.replace(/[-_]/g, ' '));
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [title]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = async () => {
    if (!file || !title.trim()) return;

    setIsUploading(true);
    try {
      await onUpload({
        file,
        title: title.trim(),
        description: description.trim() || undefined,
        mediaType,
        folderId: folderId || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });
      resetForm();
      onOpenChange(false);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setTitle('');
    setDescription('');
    setMediaType('video');
    setFolderId('');
    setTags([]);
    setTagInput('');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const config = mediaTypeConfig[mediaType];
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Content</DialogTitle>
          <DialogDescription>
            Add videos, documents, audio, or images to your knowledge library
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
              file && "border-green-500 bg-green-500/5"
            )}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept={Object.values(mediaTypeConfig).map(c => c.accept).join(',')}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelect(f);
              }}
            />
            
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <Icon className="h-8 w-8 text-green-600" />
                <div className="text-left">
                  <p className="font-medium text-sm truncate max-w-[200px]">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium">Drop file here or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Videos, audio, documents, images up to 100MB
                </p>
              </>
            )}
          </div>

          {/* Media Type Selector */}
          <div className="space-y-2">
            <Label>Content Type</Label>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(mediaTypeConfig) as [MediaType, typeof config][]).map(([type, cfg]) => {
                const TypeIcon = cfg.icon;
                return (
                  <Button
                    key={type}
                    variant={mediaType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMediaType(type)}
                    className="gap-1.5"
                  >
                    <TypeIcon className="h-3.5 w-3.5" />
                    {cfg.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter content title"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this content"
              rows={2}
            />
          </div>

          {/* Folder */}
          <div className="space-y-2">
            <Label htmlFor="folder">Folder</Label>
            <Select value={folderId} onValueChange={setFolderId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a folder (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No folder</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Add tags (press Enter)"
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={addTag}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!file || !title.trim() || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
