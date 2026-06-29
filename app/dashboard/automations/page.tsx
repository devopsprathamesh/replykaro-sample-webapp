"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Zap,
  MoreVertical,
  Trash2,
  MessageSquare,
  Hash,
  BarChart3,
  PlusCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import Link from "next/link";

interface Rule {
  id: string;
  triggerKeyword: string;
  replyMessage: string;
  status: "ACTIVE" | "INACTIVE";
  matchCount: number;
  dmSentCount: number;
  createdAt: string;
  instagramPost?: { caption?: string; mediaType: string } | null;
}

async function fetchRules(): Promise<Rule[]> {
  const res = await fetch("/api/automations");
  if (!res.ok) throw new Error("Failed to load automations");
  const json = await res.json();
  return json.data;
}

export default function AutomationsPage() {
  const qc = useQueryClient();
  const { data: rules, isLoading } = useQuery({ queryKey: ["automations"], queryFn: fetchRules });

  const { mutate: toggleStatus } = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "ACTIVE" | "INACTIVE" }) => {
      const res = await fetch(`/api/automations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automations"] }),
    onError: () => toast.error("Failed to update automation"),
  });

  const { mutate: deleteRule } = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/automations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      toast.success("Automation deleted");
      qc.invalidateQueries({ queryKey: ["automations"] });
    },
    onError: () => toast.error("Failed to delete"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-purple-400" />
            Automations
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Manage your keyword triggers and DM replies.
          </p>
        </div>
        <Link href="/dashboard/posts">
          <Button className="bg-purple-600 hover:bg-purple-700 gap-2">
            <PlusCircle className="w-4 h-4" />
            New Automation
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl bg-slate-800" />
          ))}
        </div>
      ) : !rules?.length ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
            <Zap className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">No automations yet</h3>
          <p className="text-slate-400 text-sm mb-6 max-w-xs">
            Go to Posts, select a post, and click "Configure" to add your first automation.
          </p>
          <Link href="/dashboard/posts">
            <Button className="bg-purple-600 hover:bg-purple-700 gap-2">
              <PlusCircle className="w-4 h-4" />
              Create First Automation
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <Card key={rule.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30 gap-1">
                        <Hash className="w-3 h-3" />
                        {rule.triggerKeyword}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          rule.status === "ACTIVE"
                            ? "border-green-500/40 text-green-400"
                            : "border-slate-600 text-slate-500"
                        }
                      >
                        {rule.status === "ACTIVE" ? "● Active" : "○ Inactive"}
                      </Badge>
                      {rule.instagramPost && (
                        <Badge variant="outline" className="border-slate-700 text-slate-500 text-xs">
                          {rule.instagramPost.mediaType}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-300 line-clamp-2">{rule.replyMessage}</p>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" />
                        {rule.matchCount} matches
                      </span>
                      <span>{rule.dmSentCount} DMs sent</span>
                      <span>Created {format(new Date(rule.createdAt), "MMM d, yyyy")}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Switch
                      checked={rule.status === "ACTIVE"}
                      onCheckedChange={(checked) =>
                        toggleStatus({ id: rule.id, status: checked ? "ACTIVE" : "INACTIVE" })
                      }
                      className="data-[state=checked]:bg-purple-600"
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors outline-none">
                        <MoreVertical className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700 text-slate-100">
                        <DropdownMenuItem
                          className="text-red-400 hover:bg-red-900/30 cursor-pointer gap-2"
                          onClick={() => {
                            if (confirm("Delete this automation?")) deleteRule(rule.id);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
