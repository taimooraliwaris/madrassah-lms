import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { Bell, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  useNotifications,
  useNotificationReads,
  useMarkAllNotificationsRead,
} from "@/hooks/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/parent/notifications")({
  component: ParentNotifications,
});

function ParentNotifications() {
  const { data: items, isLoading } = useNotifications();
  const { data: reads } = useNotificationReads();
  const markAll = useMarkAllNotificationsRead();

  const unread = useMemo(
    () => (items ?? []).filter((n) => !reads?.has(n.id)).map((n) => n.id),
    [items, reads],
  );

  useEffect(() => {
    if (unread.length > 0) markAll.mutate(unread);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unread.join(",")]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground">
          Updates about attendance, performance, fees and PTM.
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : !items || items.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Bell className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="mt-4 font-semibold">You're all caught up!</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            No notifications right now.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((n) => {
            const isUnread = !reads?.has(n.id);
            return (
              <Card
                key={n.id}
                className={cn(
                  "p-4 transition-colors",
                  isUnread && "border-primary/30 bg-primary/5",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase text-muted-foreground">
                        {n.type}
                      </span>
                      {isUnread && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <h3 className="mt-1 font-semibold">{n.title}</h3>
                    {n.body && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {n.body}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(n.created_at).toLocaleDateString()}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
