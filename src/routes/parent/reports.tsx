import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSelectedChild } from "@/contexts/SelectedChildContext";
import { usePtmReports, useSettings } from "@/hooks/queries";
import { generatePdfFromElement } from "@/lib/pdf";

export const Route = createFileRoute("/parent/reports")({
  component: ParentReports,
});

function ParentReports() {
  const { selectedChild } = useSelectedChild();
  const { data: reports, isLoading } = usePtmReports(selectedChild?.id);
  const { data: settings } = useSettings();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const refs = useRef<Record<string, HTMLDivElement | null>>({});

  const list = useMemo(() => reports ?? [], [reports]);

  const download = async (id: string, period: string) => {
    const el = refs.current[id];
    if (!el) return;
    setDownloadingId(id);
    try {
      el.classList.remove("hidden");
      await generatePdfFromElement(
        el,
        `PTM-${selectedChild?.full_name ?? "report"}-${period}.pdf`,
      );
      toast.success("Report downloaded");
    } catch (e) {
      toast.error("Could not generate PDF");
      console.error(e);
    } finally {
      el.classList.add("hidden");
      setDownloadingId(null);
    }
  };

  if (!selectedChild) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        Select a child to view PTM reports.
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">
          PTM Reports &amp; Summaries
        </h1>
        <p className="text-sm text-muted-foreground">
          Download a printable copy of each Parent-Teacher Meeting summary.
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : list.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="mt-4 font-semibold">No reports available yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            PTM reports appear here after each session.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{r.period}</h3>
                  {r.meeting_date && (
                    <p className="text-xs text-muted-foreground">
                      Meeting on{" "}
                      {new Date(r.meeting_date).toLocaleDateString()}
                    </p>
                  )}
                  {r.summary && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                      {r.summary}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => download(r.id, r.period)}
                  disabled={downloadingId === r.id}
                >
                  {downloadingId === r.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  PDF
                </Button>
              </div>

              {/* Hidden printable template */}
              <div
                ref={(el) => {
                  refs.current[r.id] = el;
                }}
                className="hidden"
                style={{
                  position: "absolute",
                  left: "-9999px",
                  top: 0,
                  width: "720px",
                  background: "#ffffff",
                  color: "#0d0d0d",
                  padding: "32px",
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                <div
                  style={{
                    borderBottom: "2px solid #0D5C63",
                    paddingBottom: 12,
                    marginBottom: 16,
                  }}
                >
                  <h1
                    style={{ fontSize: 22, fontWeight: 700, color: "#0D5C63" }}
                  >
                    {settings?.institution_name ?? "Madrassah"}
                  </h1>
                  <p style={{ fontSize: 12, color: "#666" }}>
                    {settings?.tagline ?? ""}
                  </p>
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
                  Parent-Teacher Meeting Report — {r.period}
                </h2>
                <table
                  style={{
                    width: "100%",
                    fontSize: 13,
                    borderCollapse: "collapse",
                    marginBottom: 16,
                  }}
                >
                  <tbody>
                    <tr>
                      <td style={{ padding: 4, color: "#666" }}>Student</td>
                      <td style={{ padding: 4, fontWeight: 600 }}>
                        {selectedChild?.full_name}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: 4, color: "#666" }}>Code</td>
                      <td style={{ padding: 4 }}>
                        {selectedChild?.student_code}
                      </td>
                    </tr>
                    {r.meeting_date && (
                      <tr>
                        <td style={{ padding: 4, color: "#666" }}>
                          Meeting date
                        </td>
                        <td style={{ padding: 4 }}>
                          {new Date(r.meeting_date).toLocaleDateString()}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {r.summary && (
                  <Section title="Summary" body={r.summary} />
                )}
                {r.strengths && (
                  <Section title="Strengths" body={r.strengths} />
                )}
                {r.improvements && (
                  <Section title="Areas for improvement" body={r.improvements} />
                )}
                {r.action_items && (
                  <Section title="Action items" body={r.action_items} />
                )}

                <p
                  style={{
                    marginTop: 40,
                    fontSize: 11,
                    color: "#999",
                    textAlign: "center",
                  }}
                >
                  Generated on {new Date().toLocaleString()} ·{" "}
                  {settings?.institution_name ?? "Madrassah LMS"}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
        {title}
      </h3>
      <p style={{ fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
        {body}
      </p>
    </div>
  );
}
