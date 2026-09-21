import zh from '../../lang/zh-TW.json';
import en from '../../lang/en.json';
import ja from '../../lang/ja.json';
import type { Locale } from './types';
export type Messages = typeof en;
export const messages: Record<Locale, Messages> = {'zh-TW': zh, en, ja};
export function tagLabel(t: Messages, tag: string) { return t.tagLabels[tag as keyof typeof t.tagLabels] || tag; }
export function pathFor(locale: string, id?: string) {
 const base = import.meta.env.BASE_URL.replace(/\/$/, '');
 return `${base}/${locale}/${id ? `questions/${id}/` : ''}`;
}
