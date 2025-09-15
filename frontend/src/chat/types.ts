export type ChatRole = "system" | "user" | "assistant";
export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface InitChatOptions {
  apiBase?: string;
  business?: string;
  siteName?: string;
  debug?: boolean;
}
