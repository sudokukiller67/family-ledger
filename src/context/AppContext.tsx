import { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from "react";
import { storage, Session, generateInviteCode, uid } from "@/lib/storage";
import { Group, Member, Transaction, TRANSFER_CATEGORY } from "@/lib/types";
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
  me: Member | null;            // session owner (creator/joiner of this device)
  activeMember: Member | null;  // currently selected actor (defaults to me)
  setActiveMemberId: (id: string) => void;
  isAdmin: boolean;             // admin rights of session owner

  createGroup: (familyName: string, name: string, emoji: string) => Group;
  joinGroup: (code: string, name: string, emoji: string) => Group | null;
  leaveSession: () => void;

  addTransaction: (tx: Omit<Transaction, "id" | "createdAt" | "memberId">) => void;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  promoteMember: (memberId: string) => void;
  addMember: (name: string, emoji: string) => void;

  rememberRecipient: (name: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// One-time migration: convert legacy "transfer" type into expense with cat_transfer
function migrateGroup(g: Group): Group {
  let changed = false;
  const txs = g.transactions.map((tx: any) => {
    if (tx.type === "transfer") {
      changed = true;
      return {
        ...tx,
        type: "expense",
        category: TRANSFER_CATEGORY,
        recipient: tx.recipient ?? tx.comment ?? undefined,
      };
    }
    return tx;
  });
  if (!changed && g.recipients) return g;
  return { ...g, transactions: txs, recipients: g.recipients ?? [] };
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => storage.loadLang());
  const [currency, setCurrencyState] = useState<Currency>(() => storage.loadCurrency());
  const [session, setSession] = useState<Session | null>(() => storage.loadSession());
  const [group, setGroup] = useState<Group | null>(() => {
    if (!session) return null;
    const g = storage.getGroup(session.groupId);
    if (!g) return null;
    const migrated = migrateGroup(g);
    if (migrated !== g) storage.upsertGroup(migrated);
    return migrated;
  });
  const [activeMemberId, setActiveMemberIdState] = useState<string | null>(
    () => session?.memberId ?? null
  );

  const setLang = (l: Lang) => { storage.saveLang(l); setLangState(l); };
  const setCurrency = (c: Currency) => { storage.saveCurrency(c); setCurrencyState(c); };

  useEffect(() => {
    if (session) {
      const g = storage.getGroup(session.groupId);
      if (g) {
        const migrated = migrateGroup(g);
        if (migrated !== g) storage.upsertGroup(migrated);
        setGroup(migrated);
        setActiveMemberIdState((cur) =>
          cur && migrated.members.some((m) => m.id === cur) ? cur : session.memberId
        );
      }
    } else {
      setGroup(null);
      setActiveMemberIdState(null);
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
  const activeMember = useMemo(
    () =>
      group
        ? group.members.find((m) => m.id === activeMemberId) ?? me ?? null
        : null,
    [group, activeMemberId, me]
  );
  const isAdmin = me?.role === "admin";

  const setActiveMemberId = (id: string) => setActiveMemberIdState(id);

  const createGroup = (familyName: string, name: string, emoji: string): Group => {
    const memberId = uid();
    const g: Group = {
      id: generateInviteCode(),
      name: familyName.trim() || "Family",
      members: [{ id: memberId, name: name.trim() || "Me", emoji, role: "admin" }],
      transactions: [],
      recipients: [],
      createdAt: new Date().toISOString(),
    };
    storage.upsertGroup(g);
    const s = { groupId: g.id, memberId };
    storage.saveSession(s);
    setSession(s);
    setGroup(g);
    setActiveMemberIdState(memberId);
    return g;
  };

  const joinGroup = (code: string, name: string, emoji: string): Group | null => {
    const id = code.trim().toUpperCase();
    const g = storage.getGroup(id);
    if (!g) return null;
    const memberId = uid();
    const next = migrateGroup({
      ...g,
      members: [...g.members, { id: memberId, name: name.trim() || "Me", emoji, role: "member" }],
    });
    storage.upsertGroup(next);
    const s = { groupId: next.id, memberId };
    storage.saveSession(s);
    setSession(s);
    setGroup(next);
    setActiveMemberIdState(memberId);
    return next;
  };

  const leaveSession = () => {
    storage.clearSession();
    setSession(null);
    setGroup(null);
    setActiveMemberIdState(null);
  };

  const addTransaction: AppContextValue["addTransaction"] = (tx) => {
    if (!group || !activeMember) return;
    const newTx: Transaction = {
      ...tx,
      id: uid(),
      memberId: activeMember.id,
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

  const rememberRecipient = (name: string) => {
    if (!group) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const existing = group.recipients ?? [];
    if (existing.some((r) => r.toLowerCase() === trimmed.toLowerCase())) return;
    persistGroup({ ...group, recipients: [trimmed, ...existing].slice(0, 30) });
  };

  const value: AppContextValue = {
    lang, currency, setLang, setCurrency, t, formatMoney, formatDate, currencySymbol,
    session, group, me, activeMember, setActiveMemberId, isAdmin,
    createGroup, joinGroup, leaveSession,
    addTransaction, updateTransaction, deleteTransaction,
    promoteMember, addMember, rememberRecipient,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
};
