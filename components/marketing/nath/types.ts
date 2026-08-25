export interface ContactInfo {
  instagram: string;
  name: string;
}

export interface ConversationMessage {
  id: string;
  role: "assistant" | "user";
  text: string;
  title?: string;
}
