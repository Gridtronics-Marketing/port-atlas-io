import { useState } from 'react';
import { Calendar, Download, FileText, TrendingUp, Users, DollarSign, Clock, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useReporting } from '@/hooks/useReporting';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export const ReportingDashboard = () => {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  
  const {
    projectReports,
    timeReports,
    financialReports,
    isLoading,
    generateProjectReport,
    generateTimeReport,
    generateFinancialReport,
    exportToCSV,
    exportToPDF,
  } = useReporting();

  // Mock chart data
  const performanceData = [
    { name: 'Week 1', completion: 92, budget: 95, safety: 100 },
    { name: 'Week 2', completion: 87, budget: 88, safety: 98 },
    { name: 'Week 3', completion: 94, budget: 92, safety: 100 },
    { name: 'Week 4', completion: 89, budget: 85, safety: 96 },
  ];

  const projectStatusData = [
    { name: 'Completed', value: 42, color: COLORS[0] },
    { name: 'In Progress', value: 18, color: COLORS[1] },
    { name: 'On Hold', value: 3, color: COLORS[2] },
    { name: 'Planning', value: 7, color: COLORS[3] },
  ];

  const handleGenerateReport = (type: string) => {
    switch (type) {
      case 'project':
        generateProjectReport(dateRange.start, dateRange.end);
        break;
      case 'time':
        generateTimeReport(dateRange.start, dateRange.end);
        break;
      case 'financial':
        generateFinancialReport('current_quarter');
        break;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Analytics & Reporting</h2>
          <p className="text-muted-foreground">
            Generate comprehensive reports and track performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Custom Period
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Report Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
            <Button onClick={() => handleGenerateReport('project')} disabled={isLoading}>
              Generate Reports
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="time">Time Tracking</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                    <p className="text-2xl font-bold">18</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">+2 from last month</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                    <p className="text-2xl font-bold">94.2%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">+3.1% from last month</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
                    <p className="text-2xl font-bold">1,248</p>
                  </div>
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">This month</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                    <p className="text-2xl font-bold">$142k</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">+12.5% from last month</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Weekly completion, budget, and safety metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="completion" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="budget" stroke="hsl(var(--secondary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="safety" stroke="hsl(var(--accent))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Status Distribution</CardTitle>
                <CardDescription>Current project status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={projectStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {projectStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Project Reports</h3>
            <div className="flex gap-2">
              <Button onClick={() => handleGenerateReport('project')} disabled={isLoading}>
                Generate Report
              </Button>
              <Button 
                variant="outline" 
                onClick={() => exportToCSV(projectReports, 'project-report')}
                disabled={projectReports.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {projectReports.map((report) => (
              <Card key={report.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-lg">{report.project_name}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Completion Rate</p>
                          <p className="text-lg font-semibold">{report.completion_rate.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Hours</p>
                          <p className="text-lg font-semibold">{report.total_hours}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Budget Variance</p>
                          <p className={`text-lg font-semibold ${report.budget_variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {report.budget_variance > 0 ? '+' : ''}{report.budget_variance.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Test Pass Rate</p>
                          <p className="text-lg font-semibold">{report.test_pass_rate.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={report.safety_incidents === 0 ? "default" : "destructive"}>
                        {report.safety_incidents === 0 ? 'No Incidents' : `${report.safety_incidents} Incidents`}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="time" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Time Reports</h3>
            <div className="flex gap-2">
              <Button onClick={() => handleGenerateReport('time')} disabled={isLoading}>
                Generate Report
              </Button>
              <Button 
                variant="outline" 
                onClick={() => exportToCSV(timeReports, 'time-report')}
                disabled={timeReports.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {timeReports.map((report, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">{report.employee_name}</h4>
                      <div className="grid grid-cols-4 gap-4 mt-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Hours</p>
                          <p className="text-lg font-semibold">{report.total_hours}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Billable Hours</p>
                          <p className="text-lg font-semibold">{report.billable_hours}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Overtime Hours</p>
                          <p className="text-lg font-semibold">{report.overtime_hours}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Projects</p>
                          <p className="text-lg font-semibold">{report.projects_worked}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Utilization</p>
                      <p className="text-lg font-semibold">
                        {((report.billable_hours / report.total_hours) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Financial Reports</h3>
            <div className="flex gap-2">
              <Button onClick={() => handleGenerateReport('financial')} disabled={isLoading}>
                Generate Report
              </Button>
              <Button 
                variant="outline" 
                onClick={() => exportToCSV(financialReports, 'financial-report')}
                disabled={financialReports.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {financialReports.map((report, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-lg">{report.period}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Revenue</p>
                          <p className="text-lg font-semibold">${report.total_revenue.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Expenses</p>
                          <p className="text-lg font-semibold">${report.total_expenses.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Profit Margin</p>
                          <p className="text-lg font-semibold text-green-600">{report.profit_margin.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Budget Utilization</p>
                          <p className="text-lg font-semibold">{report.budget_utilization.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Cost/Hour</p>
                          <p className="text-lg font-semibold">${report.cost_per_hour.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};