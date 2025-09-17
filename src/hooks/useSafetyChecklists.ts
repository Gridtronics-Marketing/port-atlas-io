import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SafetyChecklistItem {
  id: string;
  title: string;
  description?: string;
  required: boolean;
  category: string;
  order: number;
}

export interface SafetyChecklist {
  id: string;
  name: string;
  description?: string;
  checklist_type: string;
  items: SafetyChecklistItem[];
  created_at: string;
  updated_at: string;
}

export interface SafetySubmission {
  id: string;
  checklist_id: string;
  employee_id: string;
  project_id?: string;
  location_id?: string;
  work_order_id?: string;
  responses: Record<string, {
    checked: boolean;
    notes?: string;
    photo_url?: string;
  }>;
  submitted_at: string;
  created_at: string;
}

export function useSafetyChecklists() {
  const [checklists, setChecklists] = useState<SafetyChecklist[]>([]);
  const [submissions, setSubmissions] = useState<SafetySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchChecklists = async () => {
    try {
      // For now, we'll create default checklists since we don't have the table yet
      const defaultChecklists: SafetyChecklist[] = [
        {
          id: 'pre-job-hazard',
          name: 'Pre-Job Hazard Assessment',
          description: 'Complete before starting any work',
          checklist_type: 'pre-job',
          items: [
            {
              id: 'ppe-hard-hat',
              title: 'Hard Hat',
              description: 'Hard hat is worn and in good condition',
              required: true,
              category: 'PPE',
              order: 1,
            },
            {
              id: 'ppe-safety-glasses',
              title: 'Safety Glasses',
              description: 'Safety glasses are worn and clean',
              required: true,
              category: 'PPE',
              order: 2,
            },
            {
              id: 'ppe-high-vis',
              title: 'High-Visibility Vest',
              description: 'High-visibility vest is worn',
              required: true,
              category: 'PPE',
              order: 3,
            },
            {
              id: 'ppe-safety-boots',
              title: 'Safety Boots',
              description: 'Safety boots with steel toes are worn',
              required: true,
              category: 'PPE',
              order: 4,
            },
            {
              id: 'hazard-electrical',
              title: 'Electrical Hazards Identified',
              description: 'All electrical hazards have been identified and marked',
              required: true,
              category: 'Hazards',
              order: 5,
            },
            {
              id: 'hazard-fall-protection',
              title: 'Fall Protection Required',
              description: 'Fall protection equipment is available if working at height',
              required: true,
              category: 'Hazards',
              order: 6,
            },
            {
              id: 'tools-inspection',
              title: 'Tools Inspected',
              description: 'All tools have been inspected and are in good working order',
              required: true,
              category: 'Equipment',
              order: 7,
            },
            {
              id: 'emergency-contact',
              title: 'Emergency Contact Information',
              description: 'Emergency contact numbers are readily available',
              required: true,
              category: 'Emergency',
              order: 8,
            },
          ],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'confined-space',
          name: 'Confined Space Entry',
          description: 'Required for entering confined spaces',
          checklist_type: 'confined-space',
          items: [
            {
              id: 'cs-permit',
              title: 'Entry Permit Obtained',
              description: 'Valid confined space entry permit has been obtained',
              required: true,
              category: 'Permits',
              order: 1,
            },
            {
              id: 'cs-atmosphere-test',
              title: 'Atmosphere Testing',
              description: 'Atmosphere has been tested for oxygen, flammable gases, and toxic substances',
              required: true,
              category: 'Testing',
              order: 2,
            },
            {
              id: 'cs-ventilation',
              title: 'Ventilation System',
              description: 'Mechanical ventilation system is operating properly',
              required: true,
              category: 'Ventilation',
              order: 3,
            },
            {
              id: 'cs-attendant',
              title: 'Attendant Present',
              description: 'Trained attendant is present outside the confined space',
              required: true,
              category: 'Personnel',
              order: 4,
            },
            {
              id: 'cs-rescue-equipment',
              title: 'Rescue Equipment',
              description: 'Rescue equipment is available and ready for use',
              required: true,
              category: 'Equipment',
              order: 5,
            },
          ],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      setChecklists(defaultChecklists);
    } catch (error) {
      console.error('Error fetching checklists:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch safety checklists',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const submitChecklist = async (
    checklistId: string,
    employeeId: string,
    responses: Record<string, { checked: boolean; notes?: string; photo_url?: string }>,
    projectId?: string,
    locationId?: string,
    workOrderId?: string
  ) => {
    try {
      // Store in safety_incidents table as a safety compliance record
      const { data, error } = await supabase
        .from('safety_incidents')
        .insert([{
          incident_type: 'Compliance Check',
          description: `Safety checklist completed: ${checklists.find(c => c.id === checklistId)?.name}`,
          severity: 'Low',
          reported_by: employeeId,
          project_id: projectId,
          location_id: locationId,
          incident_date: new Date().toISOString(),
          investigation_notes: JSON.stringify(responses),
        }])
        .select()
        .single();

      if (error) throw error;

      const submission: SafetySubmission = {
        id: data.id,
        checklist_id: checklistId,
        employee_id: employeeId,
        project_id: projectId,
        location_id: locationId,
        work_order_id: workOrderId,
        responses,
        submitted_at: data.incident_date,
        created_at: data.created_at,
      };

      setSubmissions(prev => [submission, ...prev]);
      
      toast({
        title: 'Success',
        description: 'Safety checklist submitted successfully',
      });

      return submission;
    } catch (error) {
      console.error('Error submitting checklist:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit safety checklist',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const fetchSubmissions = async (employeeId?: string) => {
    try {
      let query = supabase
        .from('safety_incidents')
        .select('*')
        .eq('incident_type', 'Compliance Check')
        .order('created_at', { ascending: false });

      if (employeeId) {
        query = query.eq('reported_by', employeeId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const submissionData = data?.map(incident => ({
        id: incident.id,
        checklist_id: incident.description?.includes('Pre-Job') ? 'pre-job-hazard' : 'confined-space',
        employee_id: incident.reported_by,
        project_id: incident.project_id,
        location_id: incident.location_id,
        responses: incident.investigation_notes ? JSON.parse(incident.investigation_notes) : {},
        submitted_at: incident.incident_date,
        created_at: incident.created_at,
      })) || [];

      setSubmissions(submissionData);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  useEffect(() => {
    fetchChecklists();
    fetchSubmissions();
  }, []);

  return {
    checklists,
    submissions,
    loading,
    submitChecklist,
    fetchSubmissions,
    refetch: fetchChecklists,
  };
}