import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProjectBudget {
  id: string;
  project_id: string;
  category: string;
  budgeted_amount: number;
  actual_amount: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  project_id?: string;
  work_order_id?: string;
  employee_id: string;
  expense_type: string;
  category: string;
  amount: number;
  description: string;
  receipt_url?: string;
  vendor?: string;
  expense_date: string;
  status: 'pending' | 'approved' | 'rejected' | 'reimbursed';
  approved_by?: string;
  approval_date?: string;
  created_at: string;
  updated_at: string;
}

export interface TimeEntry {
  id: string;
  employee_id: string;
  project_id?: string;
  work_order_id?: string;
  hours: number;
  hourly_rate: number;
  total_cost: number;
  description?: string;
  work_date: string;
  created_at: string;
}

export interface FinancialSummary {
  project_id: string;
  total_budget: number;
  total_expenses: number;
  total_labor_cost: number;
  total_material_cost: number;
  total_actual_cost: number;
  budget_variance: number;
  budget_variance_percentage: number;
}

const expenseCategories = [
  'Materials',
  'Labor',
  'Equipment Rental',
  'Transportation',
  'Permits',
  'Subcontractor',
  'Utilities',
  'Insurance',
  'Other',
];

const expenseTypes = [
  'Receipt',
  'Mileage',
  'Per Diem',
  'Hotel',
  'Fuel',
  'Parking',
  'Tools',
  'Materials',
  'Equipment',
  'Subcontractor Payment',
];

export function useFinancials() {
  const [budgets, setBudgets] = useState<ProjectBudget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFinancialData = async () => {
    try {
      // Fetch projects for budget simulation
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*');

      if (projectsError) throw projectsError;

      // Create sample budgets based on projects
      const sampleBudgets: ProjectBudget[] = projectsData?.map(project => ({
        id: `budget-${project.id}`,
        project_id: project.id,
        category: 'Total Project',
        budgeted_amount: project.estimated_budget || 50000,
        actual_amount: project.actual_cost || 0,
        description: `Budget for ${project.name}`,
        created_at: project.created_at,
        updated_at: project.updated_at,
      })) || [];

      setBudgets(sampleBudgets);

      // Create sample expenses
      const sampleExpenses: Expense[] = [
        {
          id: 'exp-1',
          project_id: projectsData?.[0]?.id,
          employee_id: 'emp-1',
          expense_type: 'Receipt',
          category: 'Materials',
          amount: 1250.00,
          description: '500ft Cat6 cable and connectors',
          vendor: 'Cable Supply Co',
          expense_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'approved',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'exp-2',
          project_id: projectsData?.[0]?.id,
          employee_id: 'emp-2',
          expense_type: 'Mileage',
          category: 'Transportation',
          amount: 67.50,
          description: 'Travel to client site - 135 miles @ $0.50/mile',
          expense_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'exp-3',
          project_id: projectsData?.[1]?.id,
          employee_id: 'emp-1',
          expense_type: 'Equipment',
          category: 'Equipment Rental',
          amount: 850.00,
          description: 'Scissor lift rental - 3 days',
          vendor: 'Equipment Rental Plus',
          expense_date: new Date().toISOString(),
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      setExpenses(sampleExpenses);

      // Fetch time entries from daily_logs
      const { data: logsData, error: logsError } = await supabase
        .from('daily_logs')
        .select('*')
        .not('hours_worked', 'is', null);

      if (logsError) throw logsError;

      const timeEntriesData: TimeEntry[] = logsData?.map(log => ({
        id: log.id,
        employee_id: log.employee_id,
        project_id: log.project_id,
        work_order_id: log.work_order_id,
        hours: log.hours_worked || 0,
        hourly_rate: 75, // Default rate
        total_cost: (log.hours_worked || 0) * 75,
        description: log.work_description,
        work_date: log.log_date,
        created_at: log.created_at,
      })) || [];

      setTimeEntries(timeEntriesData);
    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch financial data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async (expenseData: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newExpense: Expense = {
        id: crypto.randomUUID(),
        ...expenseData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setExpenses(prev => [newExpense, ...prev]);
      toast({
        title: 'Success',
        description: 'Expense added successfully',
      });
      
      return newExpense;
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: 'Error',
        description: 'Failed to add expense',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateExpenseStatus = async (expenseId: string, status: Expense['status'], approvedBy?: string) => {
    try {
      setExpenses(prev =>
        prev.map(exp => exp.id === expenseId ? {
          ...exp,
          status,
          approved_by: approvedBy,
          approval_date: status === 'approved' ? new Date().toISOString() : undefined,
          updated_at: new Date().toISOString(),
        } : exp)
      );

      toast({
        title: 'Success',
        description: `Expense ${status} successfully`,
      });
    } catch (error) {
      console.error('Error updating expense status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update expense status',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const addTimeEntry = async (timeData: Omit<TimeEntry, 'id' | 'total_cost' | 'created_at'>) => {
    try {
      const totalCost = timeData.hours * timeData.hourly_rate;
      
      const newTimeEntry: TimeEntry = {
        id: crypto.randomUUID(),
        ...timeData,
        total_cost: totalCost,
        created_at: new Date().toISOString(),
      };

      setTimeEntries(prev => [newTimeEntry, ...prev]);
      
      // Store in daily_logs as well
      if (timeData.project_id) {
        await supabase
          .from('daily_logs')
          .insert([{
            employee_id: timeData.employee_id,
            project_id: timeData.project_id,
            work_order_id: timeData.work_order_id,
            log_date: timeData.work_date,
            hours_worked: timeData.hours,
            work_description: timeData.description || 'Time entry',
          }]);
      }

      toast({
        title: 'Success',
        description: 'Time entry added successfully',
      });
      
      return newTimeEntry;
    } catch (error) {
      console.error('Error adding time entry:', error);
      toast({
        title: 'Error',
        description: 'Failed to add time entry',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const getProjectFinancialSummary = (projectId: string): FinancialSummary => {
    const projectBudgets = budgets.filter(b => b.project_id === projectId);
    const projectExpenses = expenses.filter(e => e.project_id === projectId);
    const projectTimeEntries = timeEntries.filter(t => t.project_id === projectId);

    const totalBudget = projectBudgets.reduce((sum, b) => sum + b.budgeted_amount, 0);
    const totalExpenses = projectExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalLaborCost = projectTimeEntries.reduce((sum, t) => sum + t.total_cost, 0);
    const materialExpenses = projectExpenses.filter(e => e.category === 'Materials');
    const totalMaterialCost = materialExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalActualCost = totalExpenses + totalLaborCost;
    const budgetVariance = totalBudget - totalActualCost;
    const budgetVariancePercentage = totalBudget > 0 ? (budgetVariance / totalBudget) * 100 : 0;

    return {
      project_id: projectId,
      total_budget: totalBudget,
      total_expenses: totalExpenses,
      total_labor_cost: totalLaborCost,
      total_material_cost: totalMaterialCost,
      total_actual_cost: totalActualCost,
      budget_variance: budgetVariance,
      budget_variance_percentage: budgetVariancePercentage,
    };
  };

  const getPendingExpenses = () => {
    return expenses.filter(exp => exp.status === 'pending');
  };

  const getExpensesByCategory = () => {
    const categoryTotals: Record<string, number> = {};
    expenses.forEach(exp => {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });
    return categoryTotals;
  };

  const getMonthlyExpenseTrend = () => {
    const monthlyTotals: Record<string, number> = {};
    expenses.forEach(exp => {
      const month = new Date(exp.expense_date).toISOString().slice(0, 7); // YYYY-MM
      monthlyTotals[month] = (monthlyTotals[month] || 0) + exp.amount;
    });
    return monthlyTotals;
  };

  useEffect(() => {
    fetchFinancialData();
  }, []);

  return {
    budgets,
    expenses,
    timeEntries,
    loading,
    expenseCategories,
    expenseTypes,
    addExpense,
    updateExpenseStatus,
    addTimeEntry,
    getProjectFinancialSummary,
    getPendingExpenses,
    getExpensesByCategory,
    getMonthlyExpenseTrend,
    refetch: fetchFinancialData,
  };
}