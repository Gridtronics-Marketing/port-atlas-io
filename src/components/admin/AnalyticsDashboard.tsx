import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, Eye, Clock, MousePointerClick, TrendingUp, TrendingDown,
  Globe, Monitor, Smartphone, Tablet, ArrowUpRight, ArrowDownRight,
  RefreshCw, Calendar, BarChart3, Activity, Layers
} from 'lucide-react';
import { useAnalyticsDashboard } from '@/hooks/useAnalyticsDashboard';
import { subDays, format } from 'date-fns';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const dateRangeOptions = [
  { value: '7', label: 'Last 7 days' },
  { value: '14', label: 'Last 14 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
];

const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export function AnalyticsDashboard() {
  const [daysBack, setDaysBack] = useState('30');
  const endDate = new Date();
  const startDate = subDays(endDate, parseInt(daysBack));

  const {
    realtimeMetrics,
    periodStats,
    dailyTrend,
    topPages,
    topReferrers,
    browserBreakdown,
    trafficSources,
    isLoading,
  } = useAnalyticsDashboard({ startDate, endDate });

  const deviceTotal = (periodStats?.deviceBreakdown?.desktop || 0) + 
                     (periodStats?.deviceBreakdown?.mobile || 0) + 
                     (periodStats?.deviceBreakdown?.tablet || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Analytics Dashboard
          </h2>
          <p className="text-muted-foreground">Track visitor behavior, engagement, and traffic sources</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={daysBack} onValueChange={setDaysBack}>
            <SelectTrigger className="w-[160px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dateRangeOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Realtime Stats */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary animate-pulse" />
            Realtime Overview
          </CardTitle>
          <CardDescription>Live data updated every 30 seconds</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-background/50">
              <div className="text-3xl font-bold text-primary">{realtimeMetrics?.activeVisitors || 0}</div>
              <div className="text-sm text-muted-foreground">Active Now</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-background/50">
              <div className="text-3xl font-bold">{realtimeMetrics?.todaySessions || 0}</div>
              <div className="text-sm text-muted-foreground">Sessions Today</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-background/50">
              <div className="text-3xl font-bold">{realtimeMetrics?.todayPageViews || 0}</div>
              <div className="text-sm text-muted-foreground">Page Views Today</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-background/50">
              <div className="text-3xl font-bold">{realtimeMetrics?.todayEvents || 0}</div>
              <div className="text-sm text-muted-foreground">Events Today</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Sessions"
          value={formatNumber(periodStats?.totalSessions || 0)}
          icon={Users}
          loading={isLoading}
        />
        <MetricCard
          title="Unique Visitors"
          value={formatNumber(periodStats?.uniqueVisitors || 0)}
          icon={Eye}
          loading={isLoading}
        />
        <MetricCard
          title="Avg. Session Duration"
          value={formatDuration(periodStats?.avgSessionDuration || 0)}
          icon={Clock}
          loading={isLoading}
        />
        <MetricCard
          title="Bounce Rate"
          value={`${(periodStats?.bounceRate || 0).toFixed(1)}%`}
          icon={MousePointerClick}
          loading={isLoading}
          trend={periodStats?.bounceRate && periodStats.bounceRate > 50 ? 'down' : 'up'}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Traffic Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Traffic Trend</CardTitle>
            <CardDescription>Sessions and page views over time</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dailyTrend || []}>
                  <defs>
                    <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPageViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(val) => format(new Date(val), 'MMM d')}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    labelFormatter={(val) => format(new Date(val), 'MMMM d, yyyy')}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="sessions" 
                    stroke="hsl(var(--primary))" 
                    fill="url(#colorSessions)" 
                    name="Sessions"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="pageViews" 
                    stroke="hsl(221, 83%, 53%)" 
                    fill="url(#colorPageViews)" 
                    name="Page Views"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Traffic Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
            <CardDescription>Where your visitors come from</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={250}>
                  <PieChart>
                    <Pie
                      data={trafficSources || []}
                      dataKey="count"
                      nameKey="source"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={50}
                    >
                      {trafficSources?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-3">
                  {trafficSources?.map((source, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: source.color }} 
                        />
                        <span className="text-sm">{source.source}</span>
                      </div>
                      <div className="text-sm font-medium">
                        {source.count} ({source.percentage.toFixed(1)}%)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Device & Browser */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Device Breakdown</CardTitle>
            <CardDescription>Sessions by device type</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <div className="space-y-4">
                <DeviceBar 
                  icon={Monitor} 
                  label="Desktop" 
                  value={periodStats?.deviceBreakdown?.desktop || 0}
                  total={deviceTotal}
                />
                <DeviceBar 
                  icon={Smartphone} 
                  label="Mobile" 
                  value={periodStats?.deviceBreakdown?.mobile || 0}
                  total={deviceTotal}
                />
                <DeviceBar 
                  icon={Tablet} 
                  label="Tablet" 
                  value={periodStats?.deviceBreakdown?.tablet || 0}
                  total={deviceTotal}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Browser Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Browser Breakdown</CardTitle>
            <CardDescription>Sessions by browser</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={browserBreakdown?.slice(0, 5) || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="browser" type="category" width={80} className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Pages & Referrers */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
            <CardDescription>Most visited pages</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {topPages?.slice(0, 10).map((page, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-6">{idx + 1}</span>
                      <span className="text-sm truncate max-w-[200px]" title={page.page_path}>
                        {page.page_path}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary">{page.views} views</Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(page.avg_time_seconds)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Referrers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Referrers</CardTitle>
            <CardDescription>Traffic sources</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : topReferrers && topReferrers.length > 0 ? (
              <div className="space-y-2">
                {topReferrers.map((ref, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{ref.referrer_domain}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary">{ref.sessions} sessions</Badge>
                      <span className="text-xs text-muted-foreground">
                        {ref.bounce_rate.toFixed(1)}% bounce
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No referral traffic recorded yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Engagement Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement Metrics</CardTitle>
          <CardDescription>User engagement over time</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[250px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyTrend || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => format(new Date(val), 'MMM d')}
                  className="text-xs"
                />
                <YAxis yAxisId="left" className="text-xs" />
                <YAxis yAxisId="right" orientation="right" className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="bounceRate" 
                  stroke="hsl(0, 84%, 60%)" 
                  name="Bounce Rate (%)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="avgDuration" 
                  stroke="hsl(142, 76%, 36%)" 
                  name="Avg Duration (s)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper Components
interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  loading?: boolean;
  trend?: 'up' | 'down';
  change?: number;
}

function MetricCard({ title, value, icon: Icon, loading, trend, change }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">{value}</div>
            {trend && (
              <div className={`flex items-center text-xs ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {change && `${change}%`}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DeviceBarProps {
  icon: React.ElementType;
  label: string;
  value: number;
  total: number;
}

function DeviceBar({ icon: Icon, label, value, total }: DeviceBarProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {value} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}

export default AnalyticsDashboard;
