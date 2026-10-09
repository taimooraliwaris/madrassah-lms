import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSelectedChild } from "@/contexts/SelectedChildContext";
import { useChildFeePayments, useSettings } from "@/hooks/queries";

export const Route = createFileRoute("/parent/fees")({
  component: ParentFees,
});

function fmtMoney(n: number) {
  return `₨${n.toLocaleString()}`;
}

function ParentFees() {
  const { selectedChild } = useSelectedChild();
  const { data: payments, isLoading } = useChildFeePayments(
    selectedChild?.id ?? null,
  );
  const { data: settings } = useSettings();

  const now = new Date();
  const currentMonth = now.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  const currentMonthKey = now.toISOString().slice(0, 7); // YYYY-MM
  const currentMonthName = now
    .toLocaleDateString("en-US", { month: "long" })
    .toLowerCase();

  const currentPaid = useMemo(
    () =>
      (payments ?? []).find((p) => {
        const m = (p.month ?? "").toLowerCase();
        if (m === currentMonthKey) return true;
        if (m.includes(currentMonthKey)) return true;
        // legacy formats: "May" or "May 2026"
        if (m === currentMonthName) {
          const paidYear = new Date(p.paid_on).getFullYear();
          return paidYear === now.getFullYear();
        }
        if (m.includes(currentMonthName) && m.includes(String(now.getFullYear())))
          return true;
        return false;
      }),
    [payments, currentMonthKey, currentMonthName, now],
  );

  if (!selectedChild) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        Select a child to view fees.
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Fee Status</h1>
        <p className="text-sm text-muted-foreground">
          Verified payments only. Contact the office for any discrepancies.
        </p>
      </div>

      <Card
        className={`p-5 ${
          currentPaid
            ? "border-[color:var(--color-success)]/30 bg-[color:var(--color-success)]/5"
            : "border-amber-400/40 bg-amber-50/40 dark:bg-amber-950/20"
        }`}
      >
        <div className="text-sm text-muted-foreground">{currentMonth}</div>
        <div className="mt-1 text-2xl font-bold">
          {currentPaid ? "PAID ✓" : "Status: Pending"}
        </div>
        {currentPaid ? (
          <div className="mt-1 text-sm text-muted-foreground">
            Paid {fmtMoney(Number(currentPaid.amount))} on{" "}
            {new Date(currentPaid.paid_on).toLocaleDateString()}
          </div>
        ) : (
          <div className="mt-1 text-sm text-muted-foreground">
            No payment recorded for this month yet. Please visit the office to
            pay.
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold">Payment history</h2>
        {isLoading ? (
          <div className="flex h-24 items-center">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          </div>
        ) : !payments || payments.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No payments recorded yet.
          </p>
        ) : (
          <Table className="mt-3">
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.month}</TableCell>
                  <TableCell>
                    {new Date(p.paid_on).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="capitalize">{p.method}</TableCell>
                  <TableCell className="text-right">
                    {fmtMoney(Number(p.amount))}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge className="bg-[color:var(--color-success)]/15 text-[color:var(--color-success)] hover:bg-[color:var(--color-success)]/15">
                      Paid
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        For fee queries, contact{" "}
        {settings?.contact_phone || settings?.contact_email || "the administration"}.
      </p>
    </div>
  );
}
