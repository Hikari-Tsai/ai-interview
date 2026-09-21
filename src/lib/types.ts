export const locales = ['zh-TW', 'en', 'ja'] as const;
export type Locale = typeof locales[number];
export type Link = { title: string; url: string };
export interface Question {
  id: string; number: number; original: string; topic: string; group: string;
  companies: string[]; tags: string[]; originalAnswer: string; links: Link[];
  source: { repo: string; commit: string; path: string; lineStart: number; lineEnd: number; url: string };
  contentHash: string; active: boolean;
}
export interface AnswerText {
  title: string; intent: string; hint: string[];
  principle: string; tradeoff: string; implementation: string; production: string;
  supplementNote: string;
}
export interface Answer {
  questionId: string; inputHash: string; status: 'ready' | 'stale'; generatedAt: string;
  model: string; promptVersion: string; sourceUrls: string[];
  locales: Partial<Record<Locale, AnswerText>>;
}
export interface CommunityAnswer extends AnswerText {
 questionId:string;locale:Locale;authors:string[];updatedAt:string;reviewedAgainst:string;
 sourceUrls:string[];advanced?:string;needsReview:boolean;
}
export interface Card extends Question { answer?: Answer;community?:Partial<Record<Locale,CommunityAnswer>>;communityHash?:string;aiGeneratedAt?:string }
export interface SourceRecord {
  url: string; title: string; status: 'ok' | 'failed' | 'unsupported';
  contentHash?: string; checkedAt: string; etag?: string; lastModified?: string; error?: string;
}
