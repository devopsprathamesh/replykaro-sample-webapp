import type {
  AutomationRule,
  AutomationLog,
  InstagramPost,
  InstagramAccount,
} from "@prisma/client";

export type { AutomationRule, AutomationLog, InstagramPost, InstagramAccount };

export interface MetaPost {
  id: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "REELS";
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  caption?: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
}

export interface MetaComment {
  id: string;
  text: string;
  timestamp: string;
  from?: {
    id: string;
    username: string;
  };
  media?: {
    id: string;
  };
}

export interface WebhookCommentEntry {
  id: string;
  time: number;
  changes: Array<{
    field: string;
    value: {
      id: string;
      text: string;
      from: { id: string; username: string };
      media: { id: string };
    };
  }>;
}

export interface AutomationRuleWithPost extends AutomationRule {
  instagramPost?: InstagramPost | null;
}

export interface AutomationLogWithRule extends AutomationLog {
  automationRule?: AutomationRule | null;
}

export interface DashboardStats {
  connectedAccount: boolean;
  activeAutomations: number;
  messagesSentToday: number;
  totalAutomations: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}
