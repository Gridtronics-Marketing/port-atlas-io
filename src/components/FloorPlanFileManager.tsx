import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Upload, Eye, RefreshCw, FileX, CheckCircle, AlertTriangle, Paintbrush } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getStorageUrl, deleteFloorPlanFile, validateFileAccess } from '@/lib/storage-utils';
import { toast } from 'sonner';

interface FloorPlanFile {
  name: string;
  path: string;
  floor: number;
  size: number;
  lastModified: string;
  type: string;
  isAccessible: boolean;
  url: string;
}

interface FloorPlanFileManagerProps {
  locationId: string;
  onFilesChanged: () => void;
}

export const FloorPlanFileManager: React.FC<FloorPlanFileManagerProps> = ({
  locationId,
  onFilesChanged
}) => {
  const [files, setFiles] = useState<FloorPlanFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, [locationId]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      
      // List all files in the location's storage folder
      const { data: storageFiles, error } = await supabase.storage
        .from('floor-plans')
        .list(locationId);

      if (error) {
        console.error('Error fetching files:', error);
        toast.error('Failed to fetch files');
        return;
      }

      if (!storageFiles) {
        setFiles([]);
        return;
      }

      // Process files and validate accessibility
      const filePromises = storageFiles.map(async (file) => {
        const path = `${locationId}/${file.name}`;
        const url = getStorageUrl('floor-plans', path);
        
        // Extract floor number from filename
        const floorMatch = file.name.match(/^floor_(\d+)\./);
        const floor = floorMatch ? parseInt(floorMatch[1]) : 0;
        
        // Validate file accessibility
        const isAccessible = await validateFileAccess(url);

        return {
          name: file.name,
          path,
          floor,
          size: file.metadata?.size || 0,
          lastModified: file.updated_at || file.created_at || '',
          type: file.metadata?.mimetype || getFileType(file.name),
          isAccessible,
          url
        };
      });

      const processedFiles = await Promise.all(filePromises);
      processedFiles.sort((a, b) => a.floor - b.floor);
      setFiles(processedFiles);
    } catch (error) {
      console.error('Error in fetchFiles:', error);
      toast.error('Failed to fetch files');
    } finally {
      setLoading(false);
    }
  };

  const getFileType = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'png':
      case 'jpg':
      case 'jpeg':
        return 'image';
      case 'pdf':
        return 'pdf';
      case 'svg':
        return 'svg';
      default:
        return 'unknown';
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    
    try {
      for (const file of Array.from(selectedFiles)) {
        // Validate file name format
        const floorMatch = file.name.match(/^floor_(\d+)\./);
        if (!floorMatch) {
          toast.error(`Invalid filename: ${file.name}. Use format: floor_1.png, floor_2.pdf, etc.`);
          continue;
        }

        const filePath = `${locationId}/${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('floor-plans')
          .upload(filePath, file, { 
            upsert: true,
            contentType: file.type 
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`Failed to upload ${file.name}: ${uploadError.message}`);
        } else {
          toast.success(`Uploaded ${file.name} successfully`);
        }
      }

      await fetchFiles();
      onFilesChanged();
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (filePath: string) => {
    try {
      await deleteFloorPlanFile(filePath);
      toast.success('File deleted successfully');
      await fetchFiles();
      onFilesChanged();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  const handleBulkDelete = async () => {
    try {
      const deletePromises = Array.from(selectedFiles).map(path => 
        deleteFloorPlanFile(path)
      );
      
      await Promise.all(deletePromises);
      toast.success(`Deleted ${selectedFiles.size} files successfully`);
      setSelectedFiles(new Set());
      await fetchFiles();
      onFilesChanged();
    } catch (error) {
      console.error('Error deleting files:', error);
      toast.error('Failed to delete files');
    }
  };

  const toggleFileSelection = (path: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(path)) {
      newSelection.delete(path);
    } else {
      newSelection.add(path);
    }
    setSelectedFiles(newSelection);
  };

  const selectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(f => f.path)));
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (file: FloorPlanFile) => {
    if (file.isAccessible) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Floor Plan Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading files...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Floor Plan Files
          <div className="flex gap-2">
            <Button
              onClick={fetchFiles}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Label htmlFor="file-upload" className="cursor-pointer">
              <Button variant="outline" size="sm" disabled={uploading} asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload'}
                </span>
              </Button>
            </Label>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.open(`/floor-plan-editor/${locationId}`, '_blank')}
            >
              <Paintbrush className="h-4 w-4 mr-2" />
              Draw Plan
            </Button>
            <Input
              id="file-upload"
              type="file"
              multiple
              accept=".png,.jpg,.jpeg,.pdf,.svg"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {files.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileX className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No floor plan files found</p>
            <p className="text-sm">Upload files using the format: floor_1.png, floor_2.pdf, etc.</p>
          </div>
        ) : (
          <>
            {/* Bulk actions */}
            {files.length > 0 && (
              <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                <Checkbox
                  checked={selectedFiles.size === files.length}
                  onCheckedChange={selectAll}
                />
                <span className="text-sm text-muted-foreground">
                  {selectedFiles.size} of {files.length} selected
                </span>
                {selectedFiles.size > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Selected ({selectedFiles.size})
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Files</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {selectedFiles.size} selected files? 
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete}>
                          Delete Files
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            )}

            {/* File list */}
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.path}
                  className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selectedFiles.has(file.path)}
                    onCheckedChange={() => toggleFileSelection(file.path)}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(file)}
                      <span className="font-medium truncate">{file.name}</span>
                      <Badge variant="outline">Floor {file.floor}</Badge>
                      <Badge variant="secondary">{file.type}</Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      Size: {formatFileSize(file.size)} • 
                      Modified: {new Date(file.lastModified).toLocaleDateString()}
                      {!file.isAccessible && (
                        <span className="text-red-500 ml-2">• File not accessible</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {file.isAccessible && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(file.url, '_blank')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete File</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{file.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteFile(file.path)}>
                            Delete File
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};