"use client";

import { useQuery } from "@tanstack/react-query";
import { PostsGrid } from "@/components/posts/PostsGrid";
import { Button } from "@/components/ui/button";
import { RefreshCw, Images } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

async function fetchPosts(sync = false) {
  const res = await fetch(`/api/posts${sync ? "?sync=true" : ""}`);
  if (!res.ok) throw new Error("Failed to load posts");
  const json = await res.json();
  return json.data;
}

export default function PostsPage() {
  const [syncing, setSyncing] = useState(false);
  const { data: posts, isLoading, refetch } = useQuery({
    queryKey: ["posts"],
    queryFn: () => fetchPosts(false),
  });

  async function handleSync() {
    setSyncing(true);
    try {
      await fetchPosts(true);
      await refetch();
      toast.success("Posts synced from Instagram");
    } catch (err) {
      toast.error("Failed to sync posts");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Images className="w-6 h-6 text-purple-400" />
            Your Posts
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Select a post to configure keyword automations.
          </p>
        </div>
        <Button
          onClick={handleSync}
          disabled={syncing}
          variant="outline"
          className="border-slate-700 text-slate-300 hover:bg-slate-800 gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing…" : "Sync Posts"}
        </Button>
      </div>

      <PostsGrid posts={posts ?? []} isLoading={isLoading} />
    </div>
  );
}
