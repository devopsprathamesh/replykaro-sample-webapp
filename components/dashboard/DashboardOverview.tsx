import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  Zap,
  MessageCircle,
  Activity,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import type { DashboardStats } from "@/types";
import type { InstagramAccount } from "@prisma/client";

interface Props {
  stats: DashboardStats & { instagramAccount: InstagramAccount | null };
}

export function DashboardOverview({ stats }: Props) {
  const cards = [
    {
      title: "Connected Account",
      value: stats.connectedAccount
        ? `@${stats.instagramAccount?.instagramUsername ?? "connected"}`
        : "Not connected",
      icon: Camera,
      color: "from-purple-500 to-pink-500",
      badge: stats.connectedAccount ? "Connected" : "Disconnected",
      badgeVariant: stats.connectedAccount ? "success" : "destructive",
      href: "/dashboard/settings",
    },
    {
      title: "Active Automations",
      value: stats.activeAutomations,
      icon: Zap,
      color: "from-blue-500 to-cyan-500",
      badge: "Running",
      badgeVariant: "blue",
      href: "/dashboard/automations",
    },
    {
      title: "Messages Sent Today",
      value: stats.messagesSentToday,
      icon: MessageCircle,
      color: "from-green-500 to-emerald-500",
      badge: "Today",
      badgeVariant: "green",
      href: "/dashboard/logs",
    },
    {
      title: "Total Automations",
      value: stats.totalAutomations,
      icon: Activity,
      color: "from-orange-500 to-amber-500",
      badge: "All time",
      badgeVariant: "orange",
      href: "/dashboard/automations",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">Welcome back! Here's what's happening.</p>
      </div>

      {!stats.connectedAccount && (
        <div className="flex items-center gap-3 bg-amber-900/30 border border-amber-500/30 rounded-xl p-4 text-amber-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">
            Connect your Instagram account to start automating.{" "}
            <Link href="/dashboard/settings" className="underline font-medium hover:text-amber-100">
              Go to Settings →
            </Link>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link key={card.title} href={card.href}>
            <Card className="bg-slate-900 border-slate-800 hover:border-slate-600 transition-all cursor-pointer group">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}
                  >
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white mb-1">{card.value}</p>
                <p className="text-sm text-slate-400">{card.title}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              Quick Start Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { step: "1", text: "Connect your Instagram Business account", href: "/dashboard/settings" },
              { step: "2", text: "Sync your posts from Instagram", href: "/dashboard/posts" },
              { step: "3", text: "Create an automation rule with a keyword", href: "/dashboard/automations" },
              { step: "4", text: "Test by commenting on your post", href: "/dashboard/logs" },
            ].map((item) => (
              <Link
                key={item.step}
                href={item.href}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors group"
              >
                <div className="w-6 h-6 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-xs font-bold text-purple-400">
                  {item.step}
                </div>
                <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{item.text}</span>
                <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-slate-400 ml-auto transition-colors" />
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              Account Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatusRow label="Instagram Connected" ok={stats.connectedAccount} />
            <StatusRow label="Webhook Active" ok={stats.instagramAccount?.webhookVerified ?? false} />
            <StatusRow
              label="Token Valid"
              ok={
                !!stats.instagramAccount?.tokenExpiresAt &&
                new Date(stats.instagramAccount.tokenExpiresAt) > new Date()
              }
            />
            <StatusRow label="Automation Rules" ok={stats.totalAutomations > 0} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <Badge
        variant="outline"
        className={
          ok
            ? "border-green-500/40 text-green-400 bg-green-500/10"
            : "border-slate-600 text-slate-500"
        }
      >
        {ok ? "✓ Active" : "✗ Inactive"}
      </Badge>
    </div>
  );
}
