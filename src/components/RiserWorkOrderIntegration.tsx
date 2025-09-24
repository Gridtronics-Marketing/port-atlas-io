import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, AlertTriangle, Cable, Network, Wrench } from 'lucide-react';
import { useWorkOrders } from '@/hooks/useWorkOrders';
import { useBackboneCables } from '@/hooks/useBackboneCables';
import { useDistributionFrames } from '@/hooks/useDistributionFrames';

interface RiserWorkOrderIntegrationProps {
  locationId: string;
  projectId?: string;
}

export const RiserWorkOrderIntegration: React.FC<RiserWorkOrderIntegrationProps> = ({
  locationId,
  projectId
}) => {
  const { workOrders } = useWorkOrders();
  const { cables } = useBackboneCables(locationId);
  const { frames } = useDistributionFrames(locationId);

  // Filter work orders related to this location and infrastructure
  const riserWorkOrders = workOrders.filter(wo => 
    wo.location_id === locationId && 
    (wo.work_type?.includes('Cable') || wo.work_type?.includes('Infrastructure') || wo.work_type?.includes('Network'))
  );

  const getWorkOrderStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'In Progress': return <Clock className="h-4 w-4 text-warning" />;
      case 'On Hold': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getInstallationProgress = () => {
    const totalComponents = cables.length + frames.length;
    const completedWorkOrders = riserWorkOrders.filter(wo => wo.status === 'Completed').length;
    const totalWorkOrders = riserWorkOrders.length;
    
    return totalWorkOrders > 0 ? Math.round((completedWorkOrders / totalWorkOrders) * 100) : 0;
  };

  const getPendingTasks = () => {
    return riserWorkOrders.filter(wo => wo.status !== 'Completed');
  };

  const getCompletedTasks = () => {
    return riserWorkOrders.filter(wo => wo.status === 'Completed');
  };

  return (
    <div className="space-y-4">
      {/* Installation Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Infrastructure Installation Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">{getInstallationProgress()}% Complete</span>
          </div>
          <Progress value={getInstallationProgress()} className="h-2" />
          
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{getCompletedTasks().length}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">{getPendingTasks().length}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{cables.length + frames.length}</div>
              <div className="text-sm text-muted-foreground">Components</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Work Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Infrastructure Work Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          {riserWorkOrders.length > 0 ? (
            <div className="space-y-3">
              {riserWorkOrders.map(workOrder => (
                <div key={workOrder.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getWorkOrderStatusIcon(workOrder.status)}
                      <div>
                        <div className="font-medium">{workOrder.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {workOrder.work_type} • Priority: {workOrder.priority}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={
                        workOrder.status === 'Completed' ? 'default' :
                        workOrder.status === 'In Progress' ? 'secondary' : 'outline'
                      }>
                        {workOrder.status}
                      </Badge>
                    </div>
                  </div>
                  
                  {workOrder.description && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      {workOrder.description}
                    </div>
                  )}
                  
                  <div className="mt-3 flex items-center gap-4 text-sm">
                    {workOrder.due_date && (
                      <span className="text-muted-foreground">
                        Due: {new Date(workOrder.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Infrastructure Work Orders</h3>
              <p>No active work orders found for infrastructure installation at this location.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Component Status */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Cable className="h-4 w-4" />
              Cable Installation Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cables.length > 0 ? (
                cables.slice(0, 3).map(cable => (
                  <div key={cable.id} className="flex items-center justify-between">
                    <div className="text-sm">
                      <div className="font-medium">{cable.cable_label}</div>
                      <div className="text-muted-foreground">
                        Floor {cable.origin_floor} → Floor {cable.destination_floor}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {cable.test_results && Object.keys(cable.test_results).length > 0 ? 'Tested' : 'Pending Test'}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No cables configured</div>
              )}
              
              {cables.length > 3 && (
                <div className="text-xs text-muted-foreground">
                  +{cables.length - 3} more cables
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Network className="h-4 w-4" />
              Equipment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {frames.length > 0 ? (
                frames.slice(0, 3).map(frame => (
                  <div key={frame.id} className="flex items-center justify-between">
                    <div className="text-sm">
                      <div className="font-medium">{frame.frame_type} - Floor {frame.floor}</div>
                      <div className="text-muted-foreground">
                        {frame.port_count} ports
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Installed
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No equipment configured</div>
              )}
              
              {frames.length > 3 && (
                <div className="text-xs text-muted-foreground">
                  +{frames.length - 3} more frames
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};