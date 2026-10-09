import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { EntityHeader } from "@/components/EntityHeader";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminFeePayments, useLatestFeeMonth } from "@/hooks/queries";
import { QuranicVerseCard } from "@/components/QuranicVerseCard";

function currentMonthYM() {
  return new Date().toISOString().slice(0, 7);
}

function normalizeYM(v: string | null | undefined): string | null {
  if (!v) return null;
  const m = String(v).match(/^(\d{4})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}` : null;
}

export const Route = createFileRoute("/admin/fees")({
  component: AdminFees,
});

function AdminFees() {
  const initial = currentMonthYM();
  const { data: latest, isLoading: isLoadingLatest } = useLatestFeeMonth();
  const [override, setOverride] = useState<string | null>(null);
  const month = override ?? (isLoadingLatest ? null : normalizeYM(latest) ?? initial);
  const monthInputValue = month ?? normalizeYM(latest) ?? initial;
  const { data, isLoading } = useAdminFeePayments(month);
  const isPageLoading = (isLoadingLatest && !override) || isLoading;

  const totals = useMemo(() => {
    const t = { cash: 0, bank: 0, other: 0, total: 0, count: 0 };
    (data ?? []).forEach((p: any) => {
      const amt = Number(p.amount);
      t.total += amt;
      t.count += 1;
      (t as any)[p.method] = ((t as any)[p.method] ?? 0) + amt;
    });
    return t;
  }, [data]);

  return (
    <div className="space-y-5">
      <EntityHeader title="Fee Management" subtitle="Approved payments only." />
      <QuranicVerseCard context="fee" variant="inline" />
      <Card className="flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground">Month</label>
          <input
            type="month"
            value={monthInputValue}
            onChange={(e) => setOverride(e.target.value)}
            className="mt-1 h-9 w-48 rounded-md border bg-background px-3 text-sm"
          />
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="Total collected" value={`₨${totals.total.toLocaleString()}`} />
        <StatCard label="Payments" value={totals.count} />
        <StatCard label="Cash" value={`₨${totals.cash.toLocaleString()}`} />
        <StatCard label="Bank" value={`₨${totals.bank.toLocaleString()}`} />
      </div>

      <Card className="p-0">
        {isPageLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : !data || data.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No approved payments for this month.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell>{new Date(p.paid_on).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">
                    {p.students?.full_name ?? "—"}{" "}
                    <span className="text-xs text-muted-foreground">{p.students?.student_code ?? ""}</span>
                  </TableCell>
                  <TableCell>{p.month}</TableCell>
                  <TableCell className="capitalize">{p.method}</TableCell>
                  <TableCell className="text-xs">{p.reference_no ?? "—"}</TableCell>
                  <TableCell className="text-right font-semibold">₨{Number(p.amount).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </Card>
  );
}
