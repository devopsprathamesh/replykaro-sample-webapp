"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

export function LoginCard() {
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    await signIn("facebook", { callbackUrl: "/dashboard" });
  }

  return (
    <Card className="w-full max-w-md mx-4 bg-white/5 backdrop-blur-xl border-white/10 text-white shadow-2xl">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
          <MessageCircle className="w-7 h-7 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold text-white">ReplyKaro</CardTitle>
        <CardDescription className="text-slate-300 text-base">
          Instagram Comment-to-DM Automation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-center text-slate-400 text-sm">
          Connect your Instagram Business account and start automating DMs when followers comment keywords on your posts.
        </p>
        <Button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-[#1877F2] hover:bg-[#0d6ae0] text-white font-semibold py-6 text-base rounded-xl transition-all"
          size="lg"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Connecting…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Continue with Facebook
            </span>
          )}
        </Button>
        <p className="text-center text-xs text-slate-500">
          Requires Instagram Business or Creator account connected to a Facebook Page.
        </p>
      </CardContent>
    </Card>
  );
}
