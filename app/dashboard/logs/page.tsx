"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollText, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface Log {
  id: string;
  commenterUsername: string;
  commentText: string;
  matchedKeyword?: string | null;
  status: "SUCCESS" | "FAILED" | "PENDING" | "SKIPPED";
  dmSent: boolean;
  errorMessage?: string | null;
  createdAt: string;
  automationRule?: { triggerKeyword: string } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

async function fetchLogs(page: number, status: string) {
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (status && status !== "all") params.set("status", status);
  const res = await fetch(`/api/logs?${params}`);
  if (!res.ok) throw new Error("Failed to load logs");
  return res.json() as Promise<{ data: Log[]; pagination: Pagination }>;
}

const statusConfig = {
  SUCCESS: { label: "Success", className: "border-green-500/40 text-green-400 bg-green-500/10" },
  FAILED: { label: "Failed", className: "border-red-500/40 text-red-400 bg-red-500/10" },
  PENDING: { label: "Pending", className: "border-yellow-500/40 text-yellow-400 bg-yellow-500/10" },
  SKIPPED: { label: "Skipped", className: "border-slate-600 text-slate-500" },
};

export default function LogsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["logs", page, statusFilter],
    queryFn: () => fetchLogs(page, statusFilter),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ScrollText className="w-6 h-6 text-purple-400" />
            Activity Logs
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Track every comment, keyword match, and DM sent.
          </p>
        </div>
        <Select value={statusFilter} onValueChange={(v) => { if (v) { setStatusFilter(v); setPage(1); } }}>
          <SelectTrigger className="w-40 bg-slate-900 border-slate-700 text-slate-300">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="SUCCESS">Success</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="SKIPPED">Skipped</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3">Time</th>
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Comment</th>
                <th className="text-left px-4 py-3">Keyword</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">DM Sent</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-800/50">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 bg-slate-800 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : !data?.data?.length ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-500">
                    No activity logs yet. Automations will appear here when triggered.
                  </td>
                </tr>
              ) : (
                data.data.map((log) => {
                  const sc = statusConfig[log.status];
                  return (
                    <tr key={log.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                        {format(new Date(log.createdAt), "MMM d, HH:mm")}
                      </td>
                      <td className="px-4 py-3 text-white font-medium">
                        @{log.commenterUsername}
                      </td>
                      <td className="px-4 py-3 text-slate-300 max-w-xs">
                        <span className="line-clamp-1" title={log.commentText}>
                          {log.commentText}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {log.matchedKeyword ? (
                          <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30 text-xs">
                            {log.matchedKeyword}
                          </Badge>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`text-xs ${sc.className}`}>
                          {sc.label}
                        </Badge>
                        {log.errorMessage && (
                          <p className="text-xs text-red-400 mt-0.5 max-w-xs truncate" title={log.errorMessage}>
                            {log.errorMessage}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={log.dmSent ? "text-green-400" : "text-slate-600"}>
                          {log.dmSent ? "✓ Sent" : "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {data?.pagination && data.pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
            <p className="text-xs text-slate-500">
              {data.pagination.total} total · page {data.pagination.page} of {data.pagination.pages}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="border-slate-700 text-slate-400 hover:bg-slate-800 h-7 w-7 p-0"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
                disabled={page === data.pagination.pages}
                className="border-slate-700 text-slate-400 hover:bg-slate-800 h-7 w-7 p-0"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
