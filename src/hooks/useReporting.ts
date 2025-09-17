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
      // Mock data for project reports
      const mockReports: ProjectReport[] = [
        {
          id: '1',
          project_name: 'Downtown Fiber Installation',
          total_work_orders: 45,
          completed_work_orders: 42,
          completion_rate: 93.3,
          total_hours: 320,
          total_cost: 28500,
          budget_variance: -5.2,
          safety_incidents: 0,
          test_pass_rate: 98.5,
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          project_name: 'Office Complex Network',
          total_work_orders: 28,
          completed_work_orders: 28,
          completion_rate: 100,
          total_hours: 185,
          total_cost: 22400,
          budget_variance: 2.8,
          safety_incidents: 1,
          test_pass_rate: 96.2,
          created_at: new Date().toISOString(),
        },
      ];

      setProjectReports(mockReports);
      toast({
        title: "Project Report Generated",
        description: `Generated reports for ${mockReports.length} projects`,
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
      // Mock data for time reports
      const mockReports: TimeReport[] = [
        {
          employee_name: 'John Smith',
          total_hours: 168,
          billable_hours: 152,
          overtime_hours: 12,
          projects_worked: 3,
        },
        {
          employee_name: 'Sarah Johnson',
          total_hours: 160,
          billable_hours: 160,
          overtime_hours: 8,
          projects_worked: 2,
        },
        {
          employee_name: 'Mike Davis',
          total_hours: 144,
          billable_hours: 136,
          overtime_hours: 4,
          projects_worked: 4,
        },
      ];

      setTimeReports(mockReports);
      toast({
        title: "Time Report Generated",
        description: `Generated reports for ${mockReports.length} employees`,
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
      // Mock data for financial reports
      const mockReports: FinancialReport[] = [
        {
          period: 'Q1 2024',
          total_revenue: 125000,
          total_expenses: 89000,
          profit_margin: 28.8,
          budget_utilization: 89.2,
          cost_per_hour: 85.50,
        },
        {
          period: 'Q2 2024',
          total_revenue: 142000,
          total_expenses: 96500,
          profit_margin: 32.0,
          budget_utilization: 92.1,
          cost_per_hour: 82.75,
        },
      ];

      setFinancialReports(mockReports);
      toast({
        title: "Financial Report Generated",
        description: `Generated financial reports for ${mockReports.length} periods`,
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