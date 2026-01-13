import { formatDistanceToNow } from "date-fns";
import { Bell, Check, CheckCheck, MessageSquare, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import type { Notification } from "@/hooks/useNotifications";

interface NotificationDropdownProps {
  notifications: Notification[];
  loading: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export const NotificationDropdown = ({
  notifications,
  loading,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationDropdownProps) => {
  const navigate = useNavigate();
  const unreadNotifications = notifications.filter(n => !n.is_read);

  const getNotificationIcon = (notificationType: string) => {
    switch (notificationType) {
      case "service_request":
      case "service_request_update":
        return <MessageSquare className="h-4 w-4 text-primary" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.type === "service_request" || 
        notification.type === "service_request_update") {
      navigate("/service-requests");
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <div className="animate-pulse">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between p-3 border-b">
        <h4 className="font-semibold text-sm">Notifications</h4>
        {unreadNotifications.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={onMarkAllAsRead}
          >
            <CheckCheck className="h-3 w-3 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      <ScrollArea className="h-[300px]">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Bell className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.slice(0, 20).map((notification) => (
              <div
                key={notification.id}
                className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                  !notification.is_read ? "bg-primary/5" : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notification.is_read ? "font-medium" : ""}`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {notifications.length > 0 && (
        <>
          <Separator />
          <div className="p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => navigate("/service-requests")}
            >
              View all notifications
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
