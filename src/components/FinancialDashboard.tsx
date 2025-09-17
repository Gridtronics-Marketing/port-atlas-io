import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Clock,
  Receipt,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Calendar,
  PieChart
} from 'lucide-react';
import { useFinancials } from '@/hooks/useFinancials';
import { useProjects } from '@/hooks/useProjects';
import { useEmployees } from '@/hooks/useEmployees';
import { useWorkOrders } from '@/hooks/useWorkOrders';

export function FinancialDashboard() {
  const { 
    expenses, 
    timeEntries, 
    budgets,
    expenseCategories,
    expenseTypes,
    addExpense,
    updateExpenseStatus,
    addTimeEntry,
    getProjectFinancialSummary,
    getPendingExpenses,
    getExpensesByCategory,
    loading 
  } = useFinancials();
  
  const { projects } = useProjects();
  const { employees } = useEmployees();
  const { workOrders } = useWorkOrders();

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddTimeEntry, setShowAddTimeEntry] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');

  const [newExpense, setNewExpense] = useState({
    project_id: '',
    work_order_id: '',
    employee_id: '',
    expense_type: '',
    category: '',
    amount: 0,
    description: '',
    vendor: '',
    expense_date: new Date().toISOString().split('T')[0],
    status: 'pending' as const,
  });

  const [newTimeEntry, setNewTimeEntry] = useState({
    employee_id: '',
    project_id: '',
    work_order_id: '',
    hours: 0,
    hourly_rate: 75,
    description: '',
    work_date: new Date().toISOString().split('T')[0],
  });

  const pendingExpenses = getPendingExpenses();
  const categoryExpenses = getExpensesByCategory();
  
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalTimeValue = timeEntries.reduce((sum, entry) => sum + entry.total_cost, 0);
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.budgeted_amount, 0);
  const totalActual = totalExpenses + totalTimeValue;
  const budgetVariance = totalBudget - totalActual;

  const handleAddExpense = async () => {
    try {
      await addExpense(newExpense);
      setNewExpense({
        project_id: '',
        work_order_id: '',
        employee_id: '',
        expense_type: '',
        category: '',
        amount: 0,
        description: '',
        vendor: '',
        expense_date: new Date().toISOString().split('T')[0],
        status: 'pending',
      });
      setShowAddExpense(false);
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const handleAddTimeEntry = async () => {
    try {
      await addTimeEntry(newTimeEntry);
      setNewTimeEntry({
        employee_id: '',
        project_id: '',
        work_order_id: '',
        hours: 0,
        hourly_rate: 75,
        description: '',
        work_date: new Date().toISOString().split('T')[0],
      });
      setShowAddTimeEntry(false);
    } catch (error) {
      console.error('Error adding time entry:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const projectSummary = selectedProject ? getProjectFinancialSummary(selectedProject) : null;

  if (loading) {
    return <div className="text-center py-8">Loading financial data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalBudget.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalExpenses.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Labor Costs</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalTimeValue.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Variance</CardTitle>
            {budgetVariance >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${budgetVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${Math.abs(budgetVariance).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              {budgetVariance >= 0 ? 'Under budget' : 'Over budget'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label>Filter by Project:</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="All projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedProject && (
              <Button variant="outline" size="sm" onClick={() => setSelectedProject('')}>
                Clear Filter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Project Financial Summary */}
      {projectSummary && (
        <Card>
          <CardHeader>
            <CardTitle>Project Financial Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <div className="text-sm text-muted-foreground">Budget</div>
                <div className="text-lg font-bold">${projectSummary.total_budget.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Actual Cost</div>
                <div className="text-lg font-bold">${projectSummary.total_actual_cost.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Variance</div>
                <div className={`text-lg font-bold ${projectSummary.budget_variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${Math.abs(projectSummary.budget_variance).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Variance %</div>
                <div className={`text-lg font-bold ${projectSummary.budget_variance_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {projectSummary.budget_variance_percentage.toFixed(1)}%
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Budget Usage</span>
                <span>{((projectSummary.total_actual_cost / projectSummary.total_budget) * 100).toFixed(1)}%</span>
              </div>
              <Progress 
                value={(projectSummary.total_actual_cost / projectSummary.total_budget) * 100} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="expenses" className="w-full">
        <TabsList>
          <TabsTrigger value="expenses">
            Expenses ({pendingExpenses.length} pending)
          </TabsTrigger>
          <TabsTrigger value="timesheet">Time Entries</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="expenses" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Expense Management</h3>
            <Button onClick={() => setShowAddExpense(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </div>
          
          <div className="grid gap-4">
            {expenses.map((expense) => {
              const employee = employees.find(e => e.id === expense.employee_id);
              const project = projects.find(p => p.id === expense.project_id);
              
              return (
                <Card key={expense.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(expense.status)}
                        <div>
                          <div className="font-medium">{expense.description}</div>
                          <div className="text-sm text-muted-foreground">
                            {expense.category} • {expense.expense_type}
                            {project && ` • ${project.name}`}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-bold text-lg">${expense.amount.toFixed(2)}</div>
                          <div className="text-sm text-muted-foreground">
                            {employee?.first_name} {employee?.last_name}
                          </div>
                        </div>
                        
                        <Badge 
                          variant="outline" 
                          className={getStatusColor(expense.status)}
                        >
                          {expense.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(expense.expense_date).toLocaleDateString()}
                        </div>
                        {expense.vendor && (
                          <div>Vendor: {expense.vendor}</div>
                        )}
                      </div>
                      
                      {expense.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateExpenseStatus(expense.id, 'approved', 'admin')}
                          >
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateExpenseStatus(expense.id, 'rejected', 'admin')}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="timesheet" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Time Tracking</h3>
            <Button onClick={() => setShowAddTimeEntry(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Time Entry
            </Button>
          </div>
          
          <div className="grid gap-4">
            {timeEntries.map((entry) => {
              const employee = employees.find(e => e.id === entry.employee_id);
              const project = projects.find(p => p.id === entry.project_id);
              
              return (
                <Card key={entry.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="font-medium">
                            {employee?.first_name} {employee?.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {project?.name || 'No project assigned'}
                            {entry.description && ` • ${entry.description}`}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-bold text-lg">${entry.total_cost.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">
                          {entry.hours}h @ ${entry.hourly_rate}/hr
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(entry.work_date).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-4">
          <h3 className="text-lg font-semibold">Financial Reports</h3>
          
          {/* Expenses by Category */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Expenses by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(categoryExpenses).map(([category, amount]) => {
                  const percentage = (amount / totalExpenses) * 100;
                  return (
                    <div key={category}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{category}</span>
                        <span>${amount.toFixed(2)} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          
          {/* Project Budgets */}
          <Card>
            <CardHeader>
              <CardTitle>Project Budget Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects.map((project) => {
                  const summary = getProjectFinancialSummary(project.id);
                  const usagePercentage = summary.total_budget > 0 
                    ? (summary.total_actual_cost / summary.total_budget) * 100 
                    : 0;
                  
                  return (
                    <div key={project.id}>
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <div className="font-medium">{project.name}</div>
                          <div className="text-sm text-muted-foreground">
                            ${summary.total_actual_cost.toLocaleString()} / ${summary.total_budget.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold ${summary.budget_variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {summary.budget_variance >= 0 ? '+' : '-'}${Math.abs(summary.budget_variance).toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {usagePercentage.toFixed(1)}% used
                          </div>
                        </div>
                      </div>
                      <Progress 
                        value={Math.min(usagePercentage, 100)} 
                        className="h-2"
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Expense Modal */}
      {showAddExpense && (
        <Card className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add New Expense</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Employee *</Label>
                <Select 
                  value={newExpense.employee_id} 
                  onValueChange={(value) => setNewExpense(prev => ({ ...prev, employee_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.first_name} {employee.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Project</Label>
                <Select 
                  value={newExpense.project_id} 
                  onValueChange={(value) => setNewExpense(prev => ({ ...prev, project_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Expense Type *</Label>
                <Select 
                  value={newExpense.expense_type} 
                  onValueChange={(value) => setNewExpense(prev => ({ ...prev, expense_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Category *</Label>
                <Select 
                  value={newExpense.category} 
                  onValueChange={(value) => setNewExpense(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Amount *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={newExpense.expense_date}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, expense_date: e.target.value }))}
                />
              </div>

              <div>
                <Label>Vendor</Label>
                <Input
                  value={newExpense.vendor}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, vendor: e.target.value }))}
                  placeholder="Vendor name"
                />
              </div>

              <div className="md:col-span-2">
                <Label>Description *</Label>
                <Textarea
                  value={newExpense.description}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Expense description"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowAddExpense(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddExpense} 
                disabled={!newExpense.employee_id || !newExpense.expense_type || !newExpense.category || !newExpense.description}
              >
                Add Expense
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Add Time Entry Modal */}
      {showAddTimeEntry && (
        <Card className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">Add Time Entry</h3>
            
            <div className="space-y-4">
              <div>
                <Label>Employee *</Label>
                <Select 
                  value={newTimeEntry.employee_id} 
                  onValueChange={(value) => setNewTimeEntry(prev => ({ ...prev, employee_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.first_name} {employee.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Project</Label>
                <Select 
                  value={newTimeEntry.project_id} 
                  onValueChange={(value) => setNewTimeEntry(prev => ({ ...prev, project_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Hours *</Label>
                  <Input
                    type="number"
                    step="0.25"
                    value={newTimeEntry.hours}
                    onChange={(e) => setNewTimeEntry(prev => ({ ...prev, hours: parseFloat(e.target.value) || 0 }))}
                    placeholder="8.0"
                  />
                </div>

                <div>
                  <Label>Hourly Rate</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newTimeEntry.hourly_rate}
                    onChange={(e) => setNewTimeEntry(prev => ({ ...prev, hourly_rate: parseFloat(e.target.value) || 0 }))}
                    placeholder="75.00"
                  />
                </div>
              </div>

              <div>
                <Label>Work Date *</Label>
                <Input
                  type="date"
                  value={newTimeEntry.work_date}
                  onChange={(e) => setNewTimeEntry(prev => ({ ...prev, work_date: e.target.value }))}
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={newTimeEntry.description}
                  onChange={(e) => setNewTimeEntry(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Work description"
                  rows={2}
                />
              </div>

              <div className="text-sm bg-gray-50 p-3 rounded">
                <div className="font-medium">Total Cost: ${(newTimeEntry.hours * newTimeEntry.hourly_rate).toFixed(2)}</div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowAddTimeEntry(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddTimeEntry} 
                disabled={!newTimeEntry.employee_id || !newTimeEntry.hours}
              >
                Add Time Entry
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}