import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  User, 
  MapPin, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  Circle,
  Pause
} from 'lucide-react';
import { useWorkOrders, WorkOrder } from '@/hooks/useWorkOrders';
import { WorkOrderDetailsModal } from './WorkOrderDetailsModal';

const statusIcons = {
  Open: <Circle className="h-4 w-4" />,
  'In Progress': <Clock className="h-4 w-4" />,
  'On Hold': <Pause className="h-4 w-4" />,
  Completed: <CheckCircle className="h-4 w-4" />,
};

const priorityColors = {
  Low: 'bg-blue-100 text-blue-800 border-blue-200',
  Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  High: 'bg-orange-100 text-orange-800 border-orange-200',
  Critical: 'bg-red-100 text-red-800 border-red-200',
};

const statusColors = {
  Open: 'bg-gray-100 text-gray-800 border-gray-200',
  'In Progress': 'bg-blue-100 text-blue-800 border-blue-200',
  'On Hold': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Completed: 'bg-green-100 text-green-800 border-green-200',
};

interface WorkOrderListProps {
  filter?: 'all' | 'open' | 'in-progress' | 'completed';
  limit?: number;
}

export function WorkOrderList({ filter = 'all', limit }: WorkOrderListProps) {
  const { workOrders, loading } = useWorkOrders();
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);

  const filteredWorkOrders = workOrders.filter(wo => {
    if (filter === 'all') return true;
    if (filter === 'open') return wo.status === 'Open';
    if (filter === 'in-progress') return wo.status === 'In Progress';
    if (filter === 'completed') return wo.status === 'Completed';
    return true;
  }).slice(0, limit);

  if (loading) {
    return <div className="text-center py-4">Loading work orders...</div>;
  }

  if (filteredWorkOrders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No work orders found
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {filteredWorkOrders.map((workOrder) => (
          <Card key={workOrder.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {statusIcons[workOrder.status as keyof typeof statusIcons] || statusIcons.Open}
                  {workOrder.title}
                </CardTitle>
                <div className="flex gap-2">
                  <Badge 
                    variant="outline" 
                    className={priorityColors[workOrder.priority as keyof typeof priorityColors] || priorityColors.Medium}
                  >
                    {workOrder.priority}
                  </Badge>
                  <Badge 
                    variant="outline"
                    className={statusColors[workOrder.status as keyof typeof statusColors] || statusColors.Open}
                  >
                    {workOrder.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              {workOrder.description && (
                <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                  {workOrder.description}
                </p>
              )}
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {workOrder.work_type && (
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {workOrder.work_type}
                  </div>
                )}
                
                {workOrder.estimated_hours && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {workOrder.estimated_hours}h est.
                  </div>
                )}
                
                {workOrder.due_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(workOrder.due_date).toLocaleDateString()}
                  </div>
                )}
              </div>
              
              <Separator className="my-3" />
              
              <div className="flex justify-between items-center">
                <div className="text-xs text-muted-foreground">
                  Created {new Date(workOrder.created_at).toLocaleDateString()}
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedWorkOrder(workOrder)}
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedWorkOrder && (
        <WorkOrderDetailsModal
          workOrder={selectedWorkOrder}
          open={!!selectedWorkOrder}
          onOpenChange={(open) => !open && setSelectedWorkOrder(null)}
        />
      )}
    </>
  );
}