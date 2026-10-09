import { ChevronDown, Check, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSelectedChild } from "@/contexts/SelectedChildContext";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export function ChildSwitcher() {
  const { children, selectedChild, setSelectedChildId, loading } = useSelectedChild();

  if (loading) {
    return (
      <div className="h-9 w-32 animate-pulse rounded-md bg-muted" />
    );
  }

  if (children.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-dashed px-2 py-1 text-xs text-muted-foreground">
        <User className="h-3.5 w-3.5" /> No students linked
      </div>
    );
  }

  if (children.length === 1 && selectedChild) {
    return (
      <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-2 py-1">
        <Avatar className="h-7 w-7">
          <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
            {initials(selectedChild.full_name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium leading-tight">
            {selectedChild.full_name}
          </div>
          <div className="truncate text-[10px] text-muted-foreground">
            {selectedChild.class?.name ?? "Unassigned"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-auto gap-2 px-2 py-1">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
              {selectedChild ? initials(selectedChild.full_name) : "?"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 text-left">
            <div className="truncate text-sm font-medium leading-tight">
              {selectedChild?.full_name ?? "Select child"}
            </div>
            <div className="truncate text-[10px] text-muted-foreground">
              {selectedChild?.class?.name ?? "Unassigned"}
            </div>
          </div>
          <ChevronDown className="h-4 w-4 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Your children</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {children.map((c) => {
          const active = c.id === selectedChild?.id;
          return (
            <DropdownMenuItem
              key={c.id}
              onClick={() => setSelectedChildId(c.id)}
              className={cn("gap-2", active && "bg-primary/5")}
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
                  {initials(c.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{c.full_name}</div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Badge variant="secondary" className="px-1 py-0 text-[9px] capitalize">
                    {c.program}
                  </Badge>
                  <span className="truncate">{c.class?.name ?? "Unassigned"}</span>
                </div>
              </div>
              {active && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
