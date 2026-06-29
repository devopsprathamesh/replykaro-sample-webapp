"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, MessageCircle, Play, Zap, Grid3X3 } from "lucide-react";
import { AutomationModal } from "@/components/automation/AutomationModal";
import { format } from "date-fns";

interface Post {
  id: string;
  instagramMediaId: string;
  mediaType: string;
  mediaUrl?: string | null;
  thumbnailUrl?: string | null;
  permalink?: string | null;
  caption?: string | null;
  timestamp: string;
  likeCount: number;
  commentsCount: number;
  automationRules?: Array<{ id: string; triggerKeyword: string }>;
}

interface Props {
  posts: Post[];
  isLoading: boolean;
}

export function PostsGrid({ posts, isLoading }: Props) {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-xl bg-slate-800" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
          <Grid3X3 className="w-8 h-8 text-slate-600" />
        </div>
        <h3 className="text-white font-semibold text-lg mb-2">No posts yet</h3>
        <p className="text-slate-400 text-sm max-w-xs">
          Sync your Instagram posts to get started with automations.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onConfigure={() => setSelectedPost(post)}
          />
        ))}
      </div>

      {selectedPost && (
        <AutomationModal
          post={selectedPost}
          open={!!selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </>
  );
}

function PostCard({
  post,
  onConfigure,
}: {
  post: Post;
  onConfigure: () => void;
}) {
  const isReel = post.mediaType === "VIDEO" || post.mediaType === "REELS";
  const thumbnail = post.thumbnailUrl ?? post.mediaUrl;
  const hasAutomation = (post.automationRules?.length ?? 0) > 0;

  return (
    <Card className="group bg-slate-900 border-slate-800 overflow-hidden hover:border-purple-500/50 transition-all cursor-pointer p-0">
      <CardContent className="p-0">
        <div className="relative aspect-square bg-slate-800">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={post.caption?.slice(0, 40) ?? "Post"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Grid3X3 className="w-8 h-8 text-slate-600" />
            </div>
          )}

          {isReel && (
            <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1">
              <Play className="w-3 h-3 text-white fill-white" />
            </div>
          )}

          {hasAutomation && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-purple-600 text-white text-xs px-1.5 py-0.5 gap-1 border-0">
                <Zap className="w-2.5 h-2.5" />
                {post.automationRules!.length}
              </Badge>
            </div>
          )}

          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3">
            <div className="flex items-center gap-3 text-white text-xs mb-1">
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {post.likeCount}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                {post.commentsCount}
              </span>
            </div>
            <Button
              size="sm"
              onClick={onConfigure}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-7 px-3 w-full gap-1"
            >
              <Zap className="w-3 h-3" />
              Configure
            </Button>
          </div>
        </div>

        <div className="p-2.5">
          <p className="text-xs text-slate-400 truncate">
            {post.caption?.slice(0, 50) ?? "No caption"}
          </p>
          <p className="text-xs text-slate-600 mt-0.5">
            {format(new Date(post.timestamp), "MMM d, yyyy")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
