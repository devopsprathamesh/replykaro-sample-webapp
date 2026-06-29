"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Settings,
  Camera,
  RefreshCw,
  Unlink,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Webhook,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface IgAccount {
  id: string;
  instagramUsername: string;
  facebookPageName?: string | null;
  profilePictureUrl?: string | null;
  followersCount: number;
  isConnected: boolean;
  webhookVerified: boolean;
  tokenExpiresAt?: string | null;
  updatedAt: string;
}

async function fetchAccount(): Promise<IgAccount | null> {
  const res = await fetch("/api/user/instagram");
  if (!res.ok) return null;
  const json = await res.json();
  return json.data;
}

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data: account, isLoading } = useQuery({
    queryKey: ["ig-account"],
    queryFn: fetchAccount,
  });

  const { mutate: disconnect, isPending: disconnecting } = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/user/instagram", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to disconnect");
    },
    onSuccess: () => {
      toast.success("Instagram account disconnected");
      qc.invalidateQueries({ queryKey: ["ig-account"] });
    },
    onError: () => toast.error("Failed to disconnect"),
  });

  const isTokenExpired =
    account?.tokenExpiresAt && new Date(account.tokenExpiresAt) < new Date();
  const tokenExpiresInDays = account?.tokenExpiresAt
    ? Math.ceil(
        (new Date(account.tokenExpiresAt).getTime() - Date.now()) / 86400000
      )
    : null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-purple-400" />
          Settings
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Manage your connected accounts and integration status.
        </p>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2 text-base">
            <Camera className="w-4 h-4 text-pink-400" />
            Connected Instagram Account
          </CardTitle>
          <CardDescription className="text-slate-400">
            Your Instagram Business or Creator account linked via Facebook Login.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 bg-slate-800 rounded-lg" />
              <Skeleton className="h-10 bg-slate-800 rounded-lg" />
            </div>
          ) : account?.isConnected ? (
            <>
              <div className="flex items-center gap-4">
                {account.profilePictureUrl ? (
                  <img
                    src={account.profilePictureUrl}
                    alt={account.instagramUsername}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Camera className="w-7 h-7 text-white" />
                  </div>
                )}
                <div>
                  <p className="text-white font-semibold text-lg">
                    @{account.instagramUsername}
                  </p>
                  {account.facebookPageName && (
                    <p className="text-slate-400 text-sm">{account.facebookPageName}</p>
                  )}
                  <p className="text-slate-500 text-xs">
                    {account.followersCount.toLocaleString()} followers
                  </p>
                </div>
              </div>

              <Separator className="bg-slate-800" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <StatusItem
                  icon={CheckCircle2}
                  label="Account Status"
                  value="Connected"
                  ok
                />
                <StatusItem
                  icon={Webhook}
                  label="Webhook Status"
                  value={account.webhookVerified ? "Verified" : "Not verified"}
                  ok={account.webhookVerified}
                />
                <StatusItem
                  icon={Clock}
                  label="Token Expires"
                  value={
                    account.tokenExpiresAt
                      ? isTokenExpired
                        ? "Expired!"
                        : `In ${tokenExpiresInDays} days`
                      : "Unknown"
                  }
                  ok={!isTokenExpired}
                />
                <StatusItem
                  icon={RefreshCw}
                  label="Last Updated"
                  value={format(new Date(account.updatedAt), "MMM d, yyyy HH:mm")}
                  ok
                />
              </div>

              {isTokenExpired && (
                <div className="flex items-center gap-2 bg-red-900/20 border border-red-500/20 rounded-lg p-3">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <p className="text-sm text-red-300">
                    Your access token has expired. Please reconnect your account.
                  </p>
                </div>
              )}

              {tokenExpiresInDays !== null && tokenExpiresInDays <= 7 && !isTokenExpired && (
                <div className="flex items-center gap-2 bg-amber-900/20 border border-amber-500/20 rounded-lg p-3">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <p className="text-sm text-amber-300">
                    Token expires in {tokenExpiresInDays} days. Reconnect soon to avoid interruption.
                  </p>
                </div>
              )}

              <Separator className="bg-slate-800" />

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 gap-2"
                  onClick={() => {
                    // Trigger re-auth flow
                    window.location.href = "/api/auth/signin/facebook?callbackUrl=/dashboard/settings";
                  }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Reconnect
                </Button>
                <Button
                  variant="outline"
                  className="border-red-800 text-red-400 hover:bg-red-900/20 gap-2"
                  disabled={disconnecting}
                  onClick={() => {
                    if (confirm("Disconnect your Instagram account? All automations will stop.")) {
                      disconnect();
                    }
                  }}
                >
                  <Unlink className="w-4 h-4" />
                  {disconnecting ? "Disconnecting…" : "Disconnect"}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
                <Camera className="w-7 h-7 text-slate-600" />
              </div>
              <p className="text-slate-400 text-sm mb-4">
                No Instagram account connected. Login with Facebook to connect.
              </p>
              <Button
                className="bg-[#1877F2] hover:bg-[#0d6ae0] text-white gap-2"
                onClick={() => {
                  window.location.href = "/api/auth/signin/facebook?callbackUrl=/dashboard/settings";
                }}
              >
                Connect Instagram via Facebook
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusItem({
  icon: Icon,
  label,
  value,
  ok,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-800/60 rounded-lg">
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          ok ? "bg-green-500/10" : "bg-red-500/10"
        }`}
      >
        <Icon className={`w-4 h-4 ${ok ? "text-green-400" : "text-red-400"}`} />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm text-white font-medium">{value}</p>
      </div>
    </div>
  );
}
