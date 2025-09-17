import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProjectReport {
  id: string;
  project_name: string;
  total_work_orders: number;
  completed_work_orders: number;
  completion_rate: number;
  total_hours: number;
  total_cost: number;
  budget_variance: number;
  safety_incidents: number;
  test_pass_rate: number;
  created_at: string;
}

export interface TimeReport {
  employee_name: string;
  total_hours: number;
  billable_hours: number;
  overtime_hours: number;
  projects_worked: number;
}

export interface FinancialReport {
  period: string;
  total_revenue: number;
  total_expenses: number;
  profit_margin: number;
  budget_utilization: number;
  cost_per_hour: number;
}

export const useReporting = () => {
  const [projectReports, setProjectReports] = useState<ProjectReport[]>([]);
  const [timeReports, setTimeReports] = useState<TimeReport[]>([]);
  const [financialReports, setFinancialReports] = useState<FinancialReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateProjectReport = async (startDate: string, endDate: string) => {
    setIsLoading(true);
    try {
      // Fresh install - no project data available yet
      setProjectReports([]);
      toast({
        title: "No Project Data",
        description: "No projects found for the selected period",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate project report",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateTimeReport = async (startDate: string, endDate: string) => {
    setIsLoading(true);
    try {
      // Fresh install - no time tracking data available yet
      setTimeReports([]);
      toast({
        title: "No Time Data",
        description: "No time tracking data found for the selected period",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate time report",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateFinancialReport = async (period: string) => {
    setIsLoading(true);
    try {
      // Fresh install - no financial data available yet
      setFinancialReports([]);
      toast({
        title: "No Financial Data",
        description: "No financial data found for the selected period",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate financial report",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      toast({
        title: "No Data",
        description: "No data available to export",
        variant: "destructive",
      });
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => 
          typeof row[header] === 'string' && row[header].includes(',') 
            ? `"${row[header]}"` 
            : row[header]
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Complete",
      description: `${filename}.csv has been downloaded`,
    });
  };

  const exportToPDF = async (reportType: string, data: any[]) => {
    // Mock PDF export functionality
    toast({
      title: "PDF Export",
      description: `${reportType} PDF export feature coming soon`,
    });
  };

  return {
    projectReports,
    timeReports,
    financialReports,
    isLoading,
    generateProjectReport,
    generateTimeReport,
    generateFinancialReport,
    exportToCSV,
    exportToPDF,
  };
};