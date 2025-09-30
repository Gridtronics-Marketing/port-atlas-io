import { useState, useEffect } from 'react';
import { Upload, FileText, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentEmployee } from '@/hooks/useCurrentEmployee';

interface TestResultsUploadProps {
  dropPointId: string;
  onUploadComplete?: () => void;
}

interface TestResultFile {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  uploaded_at: string;
  test_type: string | null;
}

export const TestResultsUpload = ({ dropPointId, onUploadComplete }: TestResultsUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<TestResultFile[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { employee: currentEmployee } = useCurrentEmployee();

  const fetchTestResults = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('test_results_files')
        .select('*')
        .eq('drop_point_id', dropPointId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error fetching test results:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestResults();
  }, [dropPointId]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF file',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 10MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = 'pdf';
      const fileName = `${dropPointId}_${Date.now()}.${fileExt}`;
      const filePath = `test-results/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('floor-plans')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('floor-plans')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('test_results_files')
        .insert({
          drop_point_id: dropPointId,
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          uploaded_by: currentEmployee?.id,
          test_type: 'certification',
        });

      if (dbError) throw dbError;

      toast({
        title: 'Success',
        description: 'Test results uploaded successfully',
      });

      fetchTestResults();
      onUploadComplete?.();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload test results',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId: string, fileUrl: string) => {
    try {
      const filePath = fileUrl.split('/').slice(-2).join('/');
      
      await supabase.storage
        .from('floor-plans')
        .remove([filePath]);

      const { error } = await supabase
        .from('test_results_files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Test results deleted successfully',
      });

      fetchTestResults();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to delete test results',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Test Results & Certifications</h3>
        <label htmlFor="test-results-upload">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => document.getElementById('test-results-upload')?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload PDF'}
          </Button>
          <input
            id="test-results-upload"
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : files.length === 0 ? (
        <Card className="p-6 text-center">
          <FileText className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No test results uploaded yet
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <Card key={file.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <FileText className="h-5 w-5 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.file_size / 1024).toFixed(1)} KB • {new Date(file.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(file.file_url, '_blank')}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(file.id, file.file_url)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
