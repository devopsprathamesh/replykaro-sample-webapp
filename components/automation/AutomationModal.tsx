"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Zap, X, Info } from "lucide-react";
import { toast } from "sonner";

const schema = z.object({
  triggerKeyword: z.string().min(1, "Keyword is required").max(100).trim(),
  replyMessage: z.string().min(1, "Reply message is required").max(1000).trim(),
});

type FormValues = z.infer<typeof schema>;

interface Post {
  id: string;
  instagramMediaId: string;
  mediaType: string;
  thumbnailUrl?: string | null;
  mediaUrl?: string | null;
  caption?: string | null;
}

interface Props {
  post: Post;
  open: boolean;
  onClose: () => void;
}

export function AutomationModal({ post, open, onClose }: Props) {
  const qc = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      triggerKeyword: "",
      replyMessage: "Hello 👋\n\nHere is your requested link:\n\nhttps://example.com",
    },
  });

  const { mutate: createRule, isPending } = useMutation({
    mutationFn: async (values: FormValues) => {
      const res = await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instagramPostId: post.id,
          triggerKeyword: values.triggerKeyword,
          replyMessage: values.replyMessage,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create automation");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Automation created and active!");
      qc.invalidateQueries({ queryKey: ["posts"] });
      qc.invalidateQueries({ queryKey: ["automations"] });
      reset();
      onClose();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const keyword = watch("triggerKeyword");
  const reply = watch("replyMessage");

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-400" />
            Configure Automation
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Set a keyword trigger and auto-DM reply for this post.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 mt-2">
          {/* Post preview */}
          <div className="w-20 h-20 rounded-lg bg-slate-800 flex-shrink-0 overflow-hidden">
            {post.thumbnailUrl || post.mediaUrl ? (
              <img
                src={post.thumbnailUrl ?? post.mediaUrl!}
                alt="Post"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
                No image
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-300 line-clamp-3">
              {post.caption ?? "No caption"}
            </p>
            <Badge variant="outline" className="mt-2 border-slate-600 text-slate-400 text-xs">
              {post.mediaType}
            </Badge>
          </div>
        </div>

        <form onSubmit={handleSubmit((v) => createRule(v))} className="space-y-5 mt-2">
          <div className="space-y-2">
            <Label htmlFor="keyword" className="text-slate-200 text-sm font-medium">
              Trigger Keyword
            </Label>
            <Input
              id="keyword"
              placeholder="e.g. LINK, FREE, INFO"
              {...register("triggerKeyword")}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500"
            />
            {errors.triggerKeyword && (
              <p className="text-red-400 text-xs">{errors.triggerKeyword.message}</p>
            )}
            <div className="flex items-start gap-2 bg-blue-900/20 border border-blue-500/20 rounded-lg p-2.5">
              <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-300">
                Case-insensitive. Matches if comment <em>contains</em> this keyword anywhere.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reply" className="text-slate-200 text-sm font-medium">
              Auto DM Message
            </Label>
            <Textarea
              id="reply"
              rows={6}
              placeholder="Hello 👋&#10;&#10;Here is your requested link:&#10;&#10;https://..."
              {...register("replyMessage")}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500 resize-none"
            />
            <p className="text-xs text-slate-500 text-right">{reply.length}/1000</p>
            {errors.replyMessage && (
              <p className="text-red-400 text-xs">{errors.replyMessage.message}</p>
            )}
          </div>

          {keyword && reply && (
            <div className="bg-slate-800 rounded-xl p-4 space-y-3 border border-slate-700">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Preview</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-600" />
                  <div className="bg-slate-700 rounded-full px-3 py-1.5 text-sm text-slate-200">
                    {keyword}
                  </div>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <div className="bg-purple-600 rounded-2xl px-3 py-2 text-sm text-white max-w-xs text-right whitespace-pre-line">
                    {reply}
                  </div>
                  <div className="w-6 h-6 rounded-full bg-purple-600 flex-shrink-0" />
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Saving…
                </span>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Save & Enable
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
