import { useState } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  User,
  FileText,
  Wrench,
} from 'lucide-react';
import { ServiceRequest } from '@/hooks/useServiceRequests';

interface ServiceRequestHistoryCardProps {
  request: ServiceRequest;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  under_review: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  in_progress: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  completed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const priorityColors: Record<string, string> = {
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

const formatStatus = (status: string) => {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const ServiceRequestHistoryCard = ({
  request,
}: ServiceRequestHistoryCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const hasResolutionDetails =
    request.reviewed_by ||
    request.review_notes ||
    request.work_order_id;

  return (
    <Card className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <h3 className="font-semibold text-lg truncate">
                    {request.title}
                  </h3>
                  <Badge
                    variant="secondary"
                    className={statusColors[request.status] || ''}
                  >
                    {formatStatus(request.status)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={priorityColors[request.priority] || ''}
                  >
                    {request.priority.charAt(0).toUpperCase() +
                      request.priority.slice(1)}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(request.created_at), 'PP')}
                  </span>
                  {request.location?.name && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {request.location.name}
                    </span>
                  )}
                  <span className="capitalize">{request.request_type}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <Separator className="mb-4" />

            {/* Description */}
            {request.description && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-1 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Description
                </h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {request.description}
                </p>
              </div>
            )}

            {/* Resolution Details */}
            {hasResolutionDetails && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-sm">Resolution Details</h4>

                {request.reviewed_at && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Reviewed on:</span>
                    <span>
                      {format(new Date(request.reviewed_at), 'PPp')}
                    </span>
                  </div>
                )}

                {request.review_notes && (
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Response:
                    </span>
                    <p className="text-sm mt-1 bg-background p-3 rounded border">
                      {request.review_notes}
                    </p>
                  </div>
                )}

                {request.work_order_id && (
                  <div className="flex items-center gap-2 text-sm">
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Work Order Created
                    </span>
                    <Badge variant="outline">#{request.work_order_id.slice(0, 8)}</Badge>
                  </div>
                )}
              </div>
            )}

            {/* Timestamps */}
            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                Created: {format(new Date(request.created_at), 'PPp')}
              </span>
              {request.updated_at !== request.created_at && (
                <span>
                  Updated: {format(new Date(request.updated_at), 'PPp')}
                </span>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
