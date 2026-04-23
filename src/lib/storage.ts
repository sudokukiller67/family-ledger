import type { Group } from "./types";
import type { Lang, Currency } from "./i18n";

const KEY_GROUPS = "fb.groups";
const KEY_SESSION = "fb.session"; // {groupId, memberId}
const KEY_LANG = "fb.lang";
const KEY_CURRENCY = "fb.currency";

export interface Session {
  groupId: string;
  memberId: string;
}

export const storage = {
  loadGroups(): Record<string, Group> {
    try {
      return JSON.parse(localStorage.getItem(KEY_GROUPS) || "{}");
    } catch {
      return {};
    }
  },
  saveGroups(groups: Record<string, Group>) {
    localStorage.setItem(KEY_GROUPS, JSON.stringify(groups));
  },
  getGroup(id: string): Group | null {
    return this.loadGroups()[id] || null;
  },
  upsertGroup(group: Group) {
    const groups = this.loadGroups();
    groups[group.id] = group;
    this.saveGroups(groups);
  },
  loadSession(): Session | null {
    try {
      const raw = localStorage.getItem(KEY_SESSION);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  saveSession(s: Session) {
    localStorage.setItem(KEY_SESSION, JSON.stringify(s));
  },
  clearSession() {
    localStorage.removeItem(KEY_SESSION);
  },
  loadLang(): Lang {
    return (localStorage.getItem(KEY_LANG) as Lang) || "ru";
  },
  saveLang(l: Lang) {
    localStorage.setItem(KEY_LANG, l);
  },
  loadCurrency(): Currency {
    return (localStorage.getItem(KEY_CURRENCY) as Currency) || "EUR";
  },
  saveCurrency(c: Currency) {
    localStorage.setItem(KEY_CURRENCY, c);
  },
};

export function generateInviteCode(): string {
  // 6-character readable code
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
