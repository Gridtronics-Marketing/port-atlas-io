import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, TrendingUp, Zap, Activity, Bell, Settings } from 'lucide-react';
import { useCapacityAlerts } from '@/hooks/useCapacityAlerts';
import { useBackboneCables } from '@/hooks/useBackboneCables';
import { useDistributionFrames } from '@/hooks/useDistributionFrames';
import { useSystemConfigurations } from '@/hooks/useSystemConfigurations';

interface CapacityTabProps {
  locationId: string;
}

export const CapacityTab: React.FC<CapacityTabProps> = ({ locationId }) => {
  const { alerts, loading: alertsLoading, addAlert, resolveAlert } = useCapacityAlerts(locationId);
  const { cables, loading: cablesLoading } = useBackboneCables(locationId);
  const { frames, loading: framesLoading } = useDistributionFrames(locationId);
  const { configurations } = useSystemConfigurations('capacity_management');
  const [viewMode, setViewMode] = useState<'overview' | 'alerts' | 'trends'>('overview');

  // Get configuration values
  const warningThreshold = parseInt(configurations.find(c => c.key === 'warning_threshold_percentage')?.value || '75');
  const criticalThreshold = parseInt(configurations.find(c => c.key === 'critical_threshold_percentage')?.value || '90');

  const getUtilizationLevel = (utilization: number) => {
    if (utilization >= criticalThreshold) return 'critical';
    if (utilization >= warningThreshold) return 'warning';
    return 'good';
  };

  const getUtilizationColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  };

  const getProgressColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  // Calculate cable utilization
  const cableUtilization = cables.map(cable => {
    const utilization = cable.capacity_total ? (cable.capacity_used / cable.capacity_total) * 100 : 0;
    const level = getUtilizationLevel(utilization);
    return { ...cable, utilization, level };
  });

  // Calculate frame utilization
  const frameUtilization = frames.map(frame => {
    const utilization = frame.capacity ? (frame.port_count / frame.capacity) * 100 : 0;
    const level = getUtilizationLevel(utilization);
    return { ...frame, utilization, level };
  });

  // Get summary statistics
  const totalCapacityIssues = [...cableUtilization, ...frameUtilization].filter(
    item => item.level === 'warning' || item.level === 'critical'
  ).length;

  const unresolvedAlerts = alerts.filter(alert => !alert.is_resolved);

  if (alertsLoading || cablesLoading || framesLoading) {
    return <div className="text-center">Loading capacity information...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Capacity Management</h3>
          <p className="text-sm text-muted-foreground">
            Monitor utilization and receive proactive capacity alerts
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="alerts">Alerts</SelectItem>
              <SelectItem value="trends">Trends</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configure Thresholds
          </Button>
        </div>
      </div>

      {/* Alert Summary */}
      {unresolvedAlerts.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have {unresolvedAlerts.length} unresolved capacity alert{unresolvedAlerts.length !== 1 ? 's' : ''} requiring attention.
          </AlertDescription>
        </Alert>
      )}

      {viewMode === 'overview' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  <div className="text-2xl font-bold">{totalCapacityIssues}</div>
                </div>
                <div className="text-sm text-muted-foreground">Capacity Issues</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <div className="text-2xl font-bold text-red-600">{unresolvedAlerts.length}</div>
                </div>
                <div className="text-sm text-muted-foreground">Active Alerts</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <div className="text-2xl font-bold text-yellow-600">
                    {cableUtilization.filter(c => c.level === 'warning').length}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">Warning Level</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-red-500" />
                  <div className="text-2xl font-bold text-red-600">
                    {cableUtilization.filter(c => c.level === 'critical').length}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">Critical Level</div>
              </CardContent>
            </Card>
          </div>

          {/* Cable Capacity */}
          <Card>
            <CardHeader>
              <CardTitle>Cable Capacity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cableUtilization.map((cable) => (
                  <div key={cable.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{cable.cable_label}</div>
                        <div className="text-sm text-muted-foreground">
                          {cable.capacity_used || 0} / {cable.capacity_total || 0} used
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getUtilizationColor(cable.level)}>
                          {cable.utilization.toFixed(1)}%
                        </Badge>
                        <Badge variant={cable.level === 'critical' ? 'destructive' : cable.level === 'warning' ? 'default' : 'secondary'}>
                          {cable.level.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <Progress 
                      value={cable.utilization} 
                      className="h-2"
                    />
                  </div>
                ))}
                {cableUtilization.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No cable capacity data available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Frame Capacity */}
          <Card>
            <CardHeader>
              <CardTitle>Distribution Frame Capacity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {frameUtilization.map((frame) => (
                  <div key={frame.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{frame.frame_type} - Floor {frame.floor}</div>
                        <div className="text-sm text-muted-foreground">
                          {frame.port_count || 0} / {frame.capacity || 0} ports used
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getUtilizationColor(frame.level)}>
                          {frame.utilization.toFixed(1)}%
                        </Badge>
                        <Badge variant={frame.level === 'critical' ? 'destructive' : frame.level === 'warning' ? 'default' : 'secondary'}>
                          {frame.level.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <Progress 
                      value={frame.utilization} 
                      className="h-2"
                    />
                  </div>
                ))}
                {frameUtilization.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No frame capacity data available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {viewMode === 'alerts' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Capacity Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className={`p-4 border rounded-lg ${alert.is_resolved ? 'bg-muted/30' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className={`h-4 w-4 ${
                          alert.severity === 'high' ? 'text-red-500' : 
                          alert.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                        }`} />
                        <span className="font-medium">{alert.alert_type}</span>
                        <Badge variant={
                          alert.severity === 'high' ? 'destructive' : 
                          alert.severity === 'medium' ? 'default' : 'secondary'
                        }>
                          {alert.severity?.toUpperCase()}
                        </Badge>
                        {alert.is_resolved && (
                          <Badge variant="outline">RESOLVED</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {alert.alert_message}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        Created: {new Date(alert.created_at).toLocaleString()}
                        {alert.resolved_at && (
                          <> • Resolved: {new Date(alert.resolved_at).toLocaleString()}</>
                        )}
                      </div>
                    </div>
                    {!alert.is_resolved && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => resolveAlert(alert.id, 'current-user')}
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {alerts.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No capacity alerts found
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {viewMode === 'trends' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Capacity Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Capacity trend analysis will be available once more historical data is collected.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};