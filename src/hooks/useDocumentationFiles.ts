import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DocumentationFile {
  id: string;
  location_id: string;
  file_name: string;
  file_type: 'pdf' | 'dwg' | 'cad' | 'photo' | 'doc' | 'xls' | 'txt';
  file_path: string;
  file_size?: number;
  document_category?: 'as_built' | 'compliance' | 'manual' | 'photo' | 'specification' | 'test_report' | 'warranty';
  standards_reference?: string;
  description?: string;
  tags?: string[];
  version: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  creator?: {
    first_name: string;
    last_name: string;
  };
}

export const useDocumentationFiles = (locationId?: string) => {
  const [files, setFiles] = useState<DocumentationFile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFiles = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('documentation_files')
        .select(`
          *,
          creator:employees!created_by(first_name, last_name)
        `);
      
      if (locationId) {
        query = query.eq('location_id', locationId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      setFiles((data as DocumentationFile[]) || []);
    } catch (error) {
      console.error('Error fetching documentation files:', error);
      toast({
        title: "Error",
        description: "Failed to fetch documentation files",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addFile = async (fileData: Omit<DocumentationFile, 'id' | 'created_at' | 'updated_at' | 'creator'>) => {
    try {
      const { data, error } = await supabase
        .from('documentation_files')
        .insert([fileData])
        .select()
        .single();
      
      if (error) throw error;
      await fetchFiles();
      
      toast({
        title: "Success",
        description: "Documentation file added successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error adding documentation file:', error);
      toast({
        title: "Error",
        description: "Failed to add documentation file",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateFile = async (id: string, updates: Partial<DocumentationFile>) => {
    try {
      const { data, error } = await supabase
        .from('documentation_files')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      await fetchFiles();
      
      toast({
        title: "Success",
        description: "Documentation file updated successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error updating documentation file:', error);
      toast({
        title: "Error",
        description: "Failed to update documentation file",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteFile = async (id: string) => {
    try {
      const { error } = await supabase
        .from('documentation_files')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchFiles();
      
      toast({
        title: "Success",
        description: "Documentation file deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting documentation file:', error);
      toast({
        title: "Error",
        description: "Failed to delete documentation file",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [locationId]);

  return {
    files,
    loading,
    fetchFiles,
    addFile,
    updateFile,
    deleteFile
  };
};