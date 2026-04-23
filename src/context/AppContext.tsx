import { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from "react";
import { storage, Session, generateInviteCode, uid } from "@/lib/storage";
import { Group, Member, Transaction } from "@/lib/types";
import { Lang, Currency, dictionaries, DictKey, CURRENCY_SYMBOL, LOCALE_MAP } from "@/lib/i18n";

interface AppContextValue {
  lang: Lang;
  currency: Currency;
  setLang: (l: Lang) => void;
  setCurrency: (c: Currency) => void;
  t: (k: DictKey) => string;
  formatMoney: (n: number) => string;
  formatDate: (iso: string) => string;
  currencySymbol: string;

  session: Session | null;
  group: Group | null;
  me: Member | null;
  isAdmin: boolean;

  createGroup: (familyName: string, name: string, emoji: string) => Group;
  joinGroup: (code: string, name: string, emoji: string) => Group | null;
  leaveSession: () => void;

  addTransaction: (tx: Omit<Transaction, "id" | "createdAt" | "memberId">) => void;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  promoteMember: (memberId: string) => void;
  addMember: (name: string, emoji: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => storage.loadLang());
  const [currency, setCurrencyState] = useState<Currency>(() => storage.loadCurrency());
  const [session, setSession] = useState<Session | null>(() => storage.loadSession());
  const [group, setGroup] = useState<Group | null>(() =>
    session ? storage.getGroup(session.groupId) : null
  );

  // Sync helpers
  const setLang = (l: Lang) => { storage.saveLang(l); setLangState(l); };
  const setCurrency = (c: Currency) => { storage.saveCurrency(c); setCurrencyState(c); };

  useEffect(() => {
    if (session) {
      const g = storage.getGroup(session.groupId);
      setGroup(g);
    } else {
      setGroup(null);
    }
  }, [session]);

  const persistGroup = useCallback((g: Group) => {
    storage.upsertGroup(g);
    setGroup({ ...g });
  }, []);

  const t = useCallback((k: DictKey) => dictionaries[lang][k] ?? k, [lang]);

  const currencySymbol = CURRENCY_SYMBOL[currency];

  const formatMoney = useCallback(
    (n: number) => {
      const formatted = new Intl.NumberFormat(LOCALE_MAP[lang], {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(n);
      return currency === "PLN" ? `${formatted} ${currencySymbol}` : `${currencySymbol}${formatted}`;
    },
    [lang, currency, currencySymbol]
  );

  const formatDate = useCallback(
    (iso: string) =>
      new Intl.DateTimeFormat(LOCALE_MAP[lang], {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(iso)),
    [lang]
  );

  const me = useMemo(
    () => (group && session ? group.members.find((m) => m.id === session.memberId) ?? null : null),
    [group, session]
  );
  const isAdmin = me?.role === "admin";

  const createGroup = (familyName: string, name: string, emoji: string): Group => {
    const memberId = uid();
    const g: Group = {
      id: generateInviteCode(),
      name: familyName.trim() || "Family",
      members: [{ id: memberId, name: name.trim() || "Me", emoji, role: "admin" }],
      transactions: [],
      createdAt: new Date().toISOString(),
    };
    storage.upsertGroup(g);
    const s = { groupId: g.id, memberId };
    storage.saveSession(s);
    setSession(s);
    setGroup(g);
    return g;
  };

  const joinGroup = (code: string, name: string, emoji: string): Group | null => {
    const id = code.trim().toUpperCase();
    const g = storage.getGroup(id);
    if (!g) return null;
    const memberId = uid();
    g.members.push({ id: memberId, name: name.trim() || "Me", emoji, role: "member" });
    storage.upsertGroup(g);
    const s = { groupId: g.id, memberId };
    storage.saveSession(s);
    setSession(s);
    setGroup({ ...g });
    return g;
  };

  const leaveSession = () => {
    storage.clearSession();
    setSession(null);
    setGroup(null);
  };

  const addTransaction: AppContextValue["addTransaction"] = (tx) => {
    if (!group || !session) return;
    const newTx: Transaction = {
      ...tx,
      id: uid(),
      memberId: session.memberId,
      createdAt: new Date().toISOString(),
    };
    persistGroup({ ...group, transactions: [newTx, ...group.transactions] });
  };

  const updateTransaction: AppContextValue["updateTransaction"] = (id, patch) => {
    if (!group || !session || !me) return;
    const tx = group.transactions.find((x) => x.id === id);
    if (!tx) return;
    if (!isAdmin && tx.memberId !== me.id) return;
    persistGroup({
      ...group,
      transactions: group.transactions.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    });
  };

  const deleteTransaction: AppContextValue["deleteTransaction"] = (id) => {
    if (!group || !me) return;
    const tx = group.transactions.find((x) => x.id === id);
    if (!tx) return;
    if (!isAdmin && tx.memberId !== me.id) return;
    persistGroup({ ...group, transactions: group.transactions.filter((x) => x.id !== id) });
  };

  const promoteMember = (memberId: string) => {
    if (!group || !isAdmin) return;
    persistGroup({
      ...group,
      members: group.members.map((m) => (m.id === memberId ? { ...m, role: "admin" } : m)),
    });
  };

  const addMember: AppContextValue["addMember"] = (name, emoji) => {
    if (!group || !isAdmin) return;
    const newMember: Member = {
      id: uid(),
      name: name.trim() || "Member",
      emoji,
      role: "member",
    };
    persistGroup({ ...group, members: [...group.members, newMember] });
  };

  const value: AppContextValue = {
    lang, currency, setLang, setCurrency, t, formatMoney, formatDate, currencySymbol,
    session, group, me, isAdmin,
    createGroup, joinGroup, leaveSession,
    addTransaction, updateTransaction, deleteTransaction,
    promoteMember, addMember,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
};
