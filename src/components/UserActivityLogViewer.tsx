import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUserActivityLog } from '@/hooks/useUserActivityLog';
import { Activity, Shield, UserPlus, UserMinus, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UserActivityLogViewerProps {
  userId?: string;
  maxHeight?: string;
}

export const UserActivityLogViewer = ({ userId, maxHeight = "600px" }: UserActivityLogViewerProps) => {
  const { activities, loading } = useUserActivityLog(userId);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'role_assigned':
        return <UserPlus className="h-4 w-4 text-green-600" />;
      case 'role_removed':
        return <UserMinus className="h-4 w-4 text-red-600" />;
      case 'login':
        return <Shield className="h-4 w-4 text-blue-600" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'role_assigned':
        return 'default';
      case 'role_removed':
        return 'destructive';
      case 'login':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Activity className="h-5 w-5 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Loading activity log...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity Log
        </CardTitle>
        <CardDescription>
          {userId ? 'User activity history' : 'Recent system activity'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea style={{ maxHeight }}>
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No activity recorded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="mt-1">{getActivityIcon(activity.activity_type)}</div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-medium leading-tight">
                        {activity.activity_description}
                      </p>
                      <Badge variant={getActivityColor(activity.activity_type)} className="text-xs shrink-0">
                        {activity.activity_type.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {activity.user_email && (
                        <span className="flex items-center gap-1">
                          User: <code className="text-xs bg-muted px-1 rounded">{activity.user_email}</code>
                        </span>
                      )}
                      {activity.actor_email && activity.actor_email !== activity.user_email && (
                        <span className="flex items-center gap-1">
                          By: <code className="text-xs bg-muted px-1 rounded">{activity.actor_email}</code>
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    
                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <div className="mt-2 text-xs">
                        <details className="cursor-pointer">
                          <summary className="text-muted-foreground hover:text-foreground">
                            View details
                          </summary>
                          <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                            {JSON.stringify(activity.metadata, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
