import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TestResult {
  id: string;
  test_type: string;
  equipment_id?: string;
  location_id?: string;
  drop_point_id?: string;
  test_date: string;
  technician_id: string;
  test_parameters: Record<string, any>;
  results: Record<string, any>;
  pass_fail_status: 'pass' | 'fail' | 'conditional';
  certification_standard?: string;
  file_attachments?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface QualityChecklist {
  id: string;
  name: string;
  description?: string;
  checklist_type: string;
  items: QualityChecklistItem[];
  created_at: string;
  updated_at: string;
}

export interface QualityChecklistItem {
  id: string;
  title: string;
  description?: string;
  required: boolean;
  category: string;
  acceptance_criteria?: string;
  order: number;
}

export interface QualitySubmission {
  id: string;
  checklist_id: string;
  technician_id: string;
  equipment_id?: string;
  location_id?: string;
  work_order_id?: string;
  responses: Record<string, {
    checked: boolean;
    notes?: string;
    photo_url?: string;
    measurement_value?: number;
    measurement_unit?: string;
  }>;
  overall_status: 'pass' | 'fail' | 'conditional';
  submitted_at: string;
  created_at: string;
}

export function useTestResults() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [qualityChecklists, setQualityChecklists] = useState<QualityChecklist[]>([]);
  const [qualitySubmissions, setQualitySubmissions] = useState<QualitySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTestResults = async () => {
    try {
      // Since we don't have a test_results table, we'll simulate with equipment data
      // In a real implementation, you'd create a proper test_results table
      const { data: equipmentData, error } = await supabase
        .from('equipment')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform equipment data to test results format for demonstration
      const mockTestResults: TestResult[] = equipmentData?.map(eq => ({
        id: `test-${eq.id}`,
        test_type: 'Equipment Certification',
        equipment_id: eq.id,
        location_id: eq.location_id,
        test_date: eq.created_at,
        technician_id: eq.assigned_to || 'unknown',
        test_parameters: {
          equipment_type: eq.equipment_type,
          make: eq.make,
          model: eq.model,
        },
        results: {
          status: eq.status,
          serial_number: eq.serial_number,
          firmware_version: eq.firmware_version,
        },
        pass_fail_status: eq.status === 'Available' ? 'pass' : 'conditional' as any,
        certification_standard: 'IEEE 802.3',
        notes: eq.notes,
        created_at: eq.created_at,
        updated_at: eq.updated_at,
      })) || [];

      setTestResults(mockTestResults);
    } catch (error) {
      console.error('Error fetching test results:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch test results',
        variant: 'destructive',
      });
    }
  };

  const fetchQualityChecklists = async () => {
    try {
      // Create default quality checklists
      const defaultChecklists: QualityChecklist[] = [
        {
          id: 'fiber-installation',
          name: 'Fiber Installation QA',
          checklist_type: 'installation',
          items: [
            {
              id: 'fiber-loss-test',
              title: 'Fiber Loss Test',
              description: 'Measure optical loss across fiber links',
              required: true,
              category: 'Testing',
              acceptance_criteria: 'Loss < 0.5dB per connector, < 0.2dB per splice',
              order: 1,
            },
            {
              id: 'otdr-test',
              title: 'OTDR Test',
              description: 'Perform OTDR trace for documentation',
              required: true,
              category: 'Testing',
              acceptance_criteria: 'Clean trace with no anomalies',
              order: 2,
            },
            {
              id: 'connector-inspection',
              title: 'Connector End-Face Inspection',
              description: 'Inspect fiber connector end-faces for defects',
              required: true,
              category: 'Visual',
              acceptance_criteria: 'No scratches, pits, or contamination visible',
              order: 3,
            },
            {
              id: 'cable-labeling',
              title: 'Cable Labeling',
              description: 'Verify all cables are properly labeled',
              required: true,
              category: 'Documentation',
              acceptance_criteria: 'Labels match cable schedule and are legible',
              order: 4,
            },
            {
              id: 'cable-dressing',
              title: 'Cable Dressing',
              description: 'Verify proper cable management and dressing',
              required: true,
              category: 'Installation',
              acceptance_criteria: 'Cables properly supported, minimum bend radius maintained',
              order: 5,
            },
          ],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'copper-installation',
          name: 'Copper Installation QA',
          checklist_type: 'installation',
          items: [
            {
              id: 'cable-certification',
              title: 'Cable Certification Test',
              description: 'Perform Cat6/Cat6A certification testing',
              required: true,
              category: 'Testing',
              acceptance_criteria: 'Pass all TIA-568 requirements for category',
              order: 1,
            },
            {
              id: 'wire-mapping',
              title: 'Wire Mapping',
              description: 'Verify proper pin-to-pin connectivity',
              required: true,
              category: 'Testing',
              acceptance_criteria: 'All pins properly mapped, no miswires',
              order: 2,
            },
            {
              id: 'termination-quality',
              title: 'Termination Quality',
              description: 'Inspect jack and patch panel terminations',
              required: true,
              category: 'Visual',
              acceptance_criteria: 'Proper untwist length, clean terminations',
              order: 3,
            },
            {
              id: 'patch-cord-test',
              title: 'Patch Cord Testing',
              description: 'Test all patch cords for continuity',
              required: true,
              category: 'Testing',
              acceptance_criteria: 'All patch cords test good',
              order: 4,
            },
          ],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      setQualityChecklists(defaultChecklists);
    } catch (error) {
      console.error('Error fetching quality checklists:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTestResult = async (testData: Omit<TestResult, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // For now, we'll store test results in the daily_logs table as a workaround
      const { data, error } = await supabase
        .from('daily_logs')
        .insert([{
          employee_id: testData.technician_id,
          location_id: testData.location_id,
          log_date: testData.test_date.split('T')[0],
          work_description: `Test Result: ${testData.test_type}`,
          materials_used: {
            test_parameters: testData.test_parameters,
            results: testData.results,
            status: testData.pass_fail_status,
            standard: testData.certification_standard,
          },
          issues_encountered: testData.notes,
          hours_worked: 1,
        }])
        .select()
        .single();

      if (error) throw error;

      const newTestResult: TestResult = {
        id: data.id,
        ...testData,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      setTestResults(prev => [newTestResult, ...prev]);
      toast({
        title: 'Success',
        description: 'Test result saved successfully',
      });
      
      return newTestResult;
    } catch (error) {
      console.error('Error adding test result:', error);
      toast({
        title: 'Error',
        description: 'Failed to save test result',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const submitQualityChecklist = async (
    checklistId: string,
    technicianId: string,
    responses: Record<string, any>,
    overallStatus: 'pass' | 'fail' | 'conditional',
    equipmentId?: string,
    locationId?: string,
    workOrderId?: string
  ) => {
    try {
      // Store quality submission in safety_incidents table as a workaround
      const { data, error } = await supabase
        .from('safety_incidents')
        .insert([{
          incident_type: 'Quality Check',
          description: `Quality checklist completed: ${qualityChecklists.find(c => c.id === checklistId)?.name}`,
          severity: overallStatus === 'pass' ? 'Low' : 'Medium',
          reported_by: technicianId,
          location_id: locationId,
          incident_date: new Date().toISOString(),
          investigation_notes: JSON.stringify({
            checklist_id: checklistId,
            responses,
            overall_status: overallStatus,
            equipment_id: equipmentId,
            work_order_id: workOrderId,
          }),
        }])
        .select()
        .single();

      if (error) throw error;

      const submission: QualitySubmission = {
        id: data.id,
        checklist_id: checklistId,
        technician_id: technicianId,
        equipment_id: equipmentId,
        location_id: locationId,
        work_order_id: workOrderId,
        responses,
        overall_status: overallStatus,
        submitted_at: data.incident_date,
        created_at: data.created_at,
      };

      setQualitySubmissions(prev => [submission, ...prev]);
      
      toast({
        title: 'Success',
        description: 'Quality checklist submitted successfully',
      });

      return submission;
    } catch (error) {
      console.error('Error submitting quality checklist:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit quality checklist',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const uploadTestFile = async (file: File, testResultId: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `test-results/${testResultId}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('floor-plans')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      toast({
        title: 'Success',
        description: 'Test file uploaded successfully',
      });

      // Return relative path instead of signed URL
      return fileName;
    } catch (error) {
      console.error('Error uploading test file:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload test file',
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchTestResults();
    fetchQualityChecklists();
  }, []);

  return {
    testResults,
    qualityChecklists,
    qualitySubmissions,
    loading,
    addTestResult,
    submitQualityChecklist,
    uploadTestFile,
    refetch: () => {
      fetchTestResults();
      fetchQualityChecklists();
    },
  };
}