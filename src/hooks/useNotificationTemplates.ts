import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface NotificationTemplate {
  id: string;
  template_name: string;
  template_type: string;
  subject_template: string | null;
  body_template: string;
  variables: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useNotificationTemplates = () => {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .order('template_name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching notification templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTemplate = async (templateData: Omit<NotificationTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .insert([templateData])
        .select()
        .single();

      if (error) throw error;
      
      setTemplates(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Error adding notification template:', error);
      throw error;
    }
  };

  const updateTemplate = async (id: string, updates: Partial<NotificationTemplate>) => {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setTemplates(prev => 
        prev.map(template => 
          template.id === id ? { ...template, ...data } : template
        )
      );
      return data;
    } catch (error) {
      console.error('Error updating notification template:', error);
      throw error;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notification_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTemplates(prev => prev.filter(template => template.id !== id));
    } catch (error) {
      console.error('Error deleting notification template:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return {
    templates,
    loading,
    fetchTemplates,
    addTemplate,
    updateTemplate,
    deleteTemplate
  };
};