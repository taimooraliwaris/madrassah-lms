import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useNotifications,
  useUnreadCount,
  useNotificationReads,
  useMarkAllNotificationsRead,
} from "@/hooks/queries";
import { formatDistanceToNow } from "date-fns";

export function NotificationBell() {
  const { data: notifs = [] } = useNotifications();
  const { data: unread = 0 } = useUnreadCount();
  const { data: reads = new Set<string>() } = useNotificationReads();
  const markAll = useMarkAllNotificationsRead();

  const unreadIds = notifs
    .filter((n) => !reads.has(n.id))
    .map((n) => n.id);

  return (
    <Popover
      onOpenChange={(open) => {
        if (open && unreadIds.length) markAll.mutate(unreadIds);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0"
      >
        <div className="flex items-center justify-between border-b px-3 py-2">
          <div className="text-sm font-semibold">Notifications</div>
          {unreadIds.length > 0 && (
            <button
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => markAll.mutate(unreadIds)}
            >
              <CheckCheck className="h-3 w-3" /> Mark all read
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifs.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <ul className="divide-y">
              {notifs.slice(0, 20).map((n) => {
                const isUnread = !reads.has(n.id);
                return (
                  <li
                    key={n.id}
                    className={
                      "px-3 py-2 text-sm " +
                      (isUnread ? "bg-accent/30" : "")
                    }
                  >
                    <div className="flex items-start gap-2">
                      {isUnread && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium leading-tight">
                          {n.title}
                        </div>
                        {n.body && (
                          <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {n.body}
                          </div>
                        )}
                        <div className="mt-0.5 text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(n.created_at), {
                            addSuffix: true,
                          })}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
