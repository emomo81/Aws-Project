"use client";
import React, { useMemo, useState } from "react";
import { Box, Icon } from "./ui";
import { SEED, band, money, themeVars } from "@/lib/seed";
import type { Txn, Layout, TxnStatus } from "@/lib/types";

const HOVER_CIRCLE = "background:rgba(60,64,67,.08)";

// ---- icon path constants ----
const P = {
  menu: "M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z",
  search: "M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z",
  filter: "M3 5h18v2l-7 8v5l-4-2v-3L3 7V5z",
  layout: "M3 5h8v14H3V5zm10 0h8v6h-8V5zm0 8h8v6h-8v-6z",
  help: "M11 18h2v-2h-2v2zm1-16A10 10 0 1 0 22 12 10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zM12 6a4 4 0 0 0-4 4h2a2 2 0 1 1 4 0c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5a4 4 0 0 0-4-4z",
  compose: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
  back: "M19 13H5v-2h14v2z",
  refresh: "M17.65 6.35A8 8 0 1 0 19.73 14h-2.08A6 6 0 1 1 12 6a5.9 5.9 0 0 1 4.2 1.8L13 11h7V4l-2.35 2.35z",
  warning: "M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z",
  check: "M9 16.2l-3.5-3.5L4 14.2 9 19l11-11-1.4-1.4z",
  arrowBack: "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z",
  escalate: "M12 4l-1.4 1.4L16.2 11H4v2h12.2l-5.6 5.6L12 20l8-8z",
  close: "M19 6.4L17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12z",
  send: "M2 21l21-9L2 3v7l15 2-15 2z",
};

const FOLDERS: [string, string, string][] = [
  ["queue", "Alert queue", "M4 4h16v2H4V4zm0 5h16v2H4V9zm0 5h10v2H4v-2z"],
  ["high", "High risk", "M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"],
  ["review", "In review", "M11 7h2v6h-2zm0 8h2v2h-2zm1-13a10 10 0 100 20 10 10 0 000-20z"],
  ["cleared", "Cleared", "M9 16.2l-3.5-3.5L4 14.2 9 19l11-11-1.4-1.4z"],
  ["fraud", "Confirmed fraud", "M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"],
];

const WORKSPACE: [string, string, string | null][] = [
  ["Executive dashboard", "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z", null],
  ["Model health", "M3 12h3l2 6 4-14 2 8h7", "drift"],
  ["Batch reports", "M6 2h9l5 5v15H6V2zm8 1.5V8h4.5", "3"],
  ["Settings", "M19.4 13a7.8 7.8 0 000-2l2-1.6-2-3.5-2.4 1a7.6 7.6 0 00-1.7-1l-.4-2.6h-4l-.4 2.6a7.6 7.6 0 00-1.7 1l-2.4-1-2 3.5L4.6 11a7.8 7.8 0 000 2l-2 1.6 2 3.5 2.4-1a7.6 7.6 0 001.7 1l.4 2.6h4l.4-2.6a7.6 7.6 0 001.7-1l2.4 1 2-3.5L19.4 13zM12 15.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z", null],
];

const TABS: [string, string, string][] = [
  ["all", "All", "M4 8h16M4 12h16M4 16h10"],
  ["high", "High", "M12 2L1 21h22L12 2zm1 16h-2v-2h2v2zm0-4h-2V9h2v5z"],
  ["med", "Watch", "M12 1L3 5v6c0 5 3.8 9.7 9 11 5.2-1.3 9-6 9-11V5l-9-4z"],
  ["low", "Cleared", "M9 16.2l-3.5-3.5L4 14.2 9 19l11-11-1.4-1.4z"],
];
const TAB_COLORS: Record<string, string> = { all: "#1a73e8", high: "#d93025", med: "#b06000", low: "#188038" };

function inFolder(t: Txn, folder: string) {
  if (folder === "queue") return t.status === "new" || t.status === "review";
  if (folder === "high") return t.starred;
  if (folder === "review") return t.status === "review";
  if (folder === "cleared") return t.status === "cleared";
  if (folder === "fraud") return t.status === "fraud";
  return true;
}

function BoxIcon({ on }: { on: boolean }) {
  return on ? (
    <Icon size={18} d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-9 14l-5-5 1.4-1.42L10 14.17l7.59-7.59L19 8l-9 9z" />
  ) : (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><rect x={4} y={4} width={16} height={16} rx={2.5} /></svg>
  );
}
function StarIcon({ on }: { on: boolean }) {
  const d = "M12 17.27l6.18 3.73-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z";
  return on ? <Icon size={18} d={d} /> : <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}><path d={d} /></svg>;
}

interface Snack { msg: string; prev: Txn[] | null; }
interface Compose { to: string; subject: string; body: string; txnId: string | null; }

export default function InboxApp() {
  const [layout, setLayout] = useState<Layout>("modern");
  const [navOpen, setNavOpen] = useState(true);
  const [folder, setFolder] = useState("queue");
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [snack, setSnack] = useState<Snack | null>(null);
  const [compose, setCompose] = useState<Compose | null>(null);
  const [txns, setTxns] = useState<Txn[]>(SEED);

  const collapsed = !navOpen;

  // ---- derived data ----
  const folderList = useMemo(() => txns.filter((t) => inFolder(t, folder)), [txns, folder]);
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return txns.filter((t) => {
      if (!inFolder(t, folder)) return false;
      if (tab === "high" && t.score < 0.8) return false;
      if (tab === "med" && (t.score < 0.4 || t.score >= 0.8)) return false;
      if (tab === "low" && t.score >= 0.4) return false;
      if (q) {
        const hay = (t.id + " " + t.merchant + " " + t.cat + " " + t.city).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [txns, folder, tab, search]);

  // ---- actions ----
  const goFolder = (f: string) => { setFolder(f); setTab("all"); setOpenId(null); setSelected([]); };
  const openRow = (id: string) => { setOpenId(id); setTxns((p) => p.map((t) => (t.id === id ? { ...t, read: true } : t))); };
  const toggleStar = (id: string, e?: React.MouseEvent) => { e?.stopPropagation(); setTxns((p) => p.map((t) => (t.id === id ? { ...t, starred: !t.starred } : t))); };
  const toggleSelect = (id: string, e?: React.MouseEvent) => { e?.stopPropagation(); setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])); };

  const applyStatus = (ids: string[], status: TxnStatus, msg: string) => {
    setTxns((prev) => {
      const next = prev.map((t) => (ids.includes(t.id) ? { ...t, status, read: true } : t));
      setSnack({ msg, prev });
      return next;
    });
    setOpenId(null); setSelected([]);
  };
  const confirmFraud = (id: string | null) => { const ids = id ? [id] : selected; if (!ids.length) return; applyStatus(ids, "fraud", ids.length > 1 ? ids.length + " marked confirmed fraud" : "Marked as confirmed fraud"); };
  const markSafe = (id: string | null) => { const ids = id ? [id] : selected; if (!ids.length) return; applyStatus(ids, "cleared", ids.length > 1 ? ids.length + " marked safe" : "Transaction marked safe"); };
  const undoSnack = () => { setSnack((s) => { if (s?.prev) setTxns(s.prev); return null; }); };

  const openCompose = (id: string | null) => {
    const t = id ? txns.find((x) => x.id === id) : null;
    setCompose({
      to: "grace.okafor@sentinel.ai",
      subject: t ? "Escalation: " + t.id + " · " + money(t.amount) : "Escalate fraud case",
      body: t ? "Flagging " + t.id + " (" + t.merchant + ", " + money(t.amount) + ", risk " + t.score.toFixed(2) + ") for senior review.\n\n" : "",
      txnId: t ? t.id : null,
    });
  };
  const sendEscalate = () => {
    const id = compose?.txnId;
    if (id) setTxns((p) => p.map((x) => (x.id === id ? { ...x, status: "review", starred: true, read: true } : x)));
    setCompose(null); setOpenId(null); setSnack({ msg: "Escalation sent to Risk Manager", prev: null });
  };

  // ---- nav styling ----
  const navStyle = (active: boolean) => {
    const ink = active ? "var(--sel-ink,#001d35)" : "var(--ink-soft,#444746)";
    const bg = active ? "var(--sel,#d3e3fd)" : "transparent";
    if (collapsed) return `display:flex;align-items:center;justify-content:center;width:48px;height:40px;margin:0 auto;border-radius:20px;cursor:pointer;color:${ink};background:${bg};transition:background .12s;`;
    return `display:flex;align-items:center;gap:18px;height:36px;padding:0 12px 0 18px;border-radius:0 18px 18px 0;cursor:pointer;font-family:'Roboto Flex','Roboto',Arial;font-size:14px;font-weight:${active ? "700" : "400"};color:${ink};background:${bg};transition:background .12s;`;
  };

  const unreadQueue = txns.filter((t) => inFolder(t, "queue") && !t.read).length;
  const tabCount: Record<string, number> = {
    all: folderList.length,
    high: folderList.filter((t) => t.score >= 0.8).length,
    med: folderList.filter((t) => t.score >= 0.4 && t.score < 0.8).length,
    low: folderList.filter((t) => t.score < 0.4).length,
  };
  const allSelected = visible.length > 0 && visible.every((t) => selected.includes(t.id));
  const open = txns.find((t) => t.id === openId) || null;

  const labelStyle = collapsed ? "display:none" : "flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";

  return (
    <div style={{ ...themeVars(layout), background: "var(--bg,#f8fafd)", height: "100vh", display: "flex", flexDirection: "column", color: "var(--ink,#1f1f1f)", overflow: "hidden" }}>
      {/* ===== HEADER ===== */}
      <header style={{ display: "flex", alignItems: "center", gap: 8, height: 64, padding: "0 16px", flex: "none", background: "var(--bg,#f8fafd)" }}>
        <Box as="button" onClick={() => setNavOpen((v) => !v)} aria-label="Menu" s="width:48px;height:48px;border:none;background:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--ink-soft,#444746);" hover={HOVER_CIRCLE}><Icon size={22} d={P.menu} /></Box>
        <div style={{ display: "flex", alignItems: "center", gap: 10, width: 200, flex: "none" }}>
          <div style={{ width: 34, height: 38, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={30} height={34} viewBox="0 0 30 34" fill="none"><path d="M15 1.5L27 6.2v9.1c0 7.6-5.1 14.7-12 16.9C8.1 30 3 22.9 3 15.3V6.2L15 1.5z" fill="#ea4335" /><path d="M15 1.5L27 6.2v9.1c0 7.6-5.1 14.7-12 16.9V1.5z" fill="#c5221f" /><path d="M9.6 16.2l3.4 3.4 6.8-6.8" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <span style={{ fontFamily: "'Roboto Flex','Roboto',Arial", fontSize: 22, color: "var(--ink-soft,#444746)", letterSpacing: "-.2px" }}>Sentinel<span style={{ fontWeight: 500, color: "var(--ink,#1f1f1f)" }}>AI</span></span>
        </div>
        <div style={{ flex: 1, maxWidth: 720, margin: "0 8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, height: 48, padding: "0 8px 0 6px", background: "var(--search-bg,#eaf1fb)", border: "1px solid var(--search-bd,transparent)", borderRadius: "var(--search-radius,26px)" as any, transition: "background .15s" }}>
            <Box as="button" aria-label="Search" s="width:40px;height:40px;border:none;background:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--ink-soft,#444746);" hover={HOVER_CIRCLE}><Icon size={22} d={P.search} /></Box>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search transactions, merchants, TXN id" style={{ flex: 1, border: "none", background: "none", outline: "none", fontSize: 16, color: "var(--ink,#1f1f1f)", fontFamily: "'Roboto',Arial" }} />
            <Box as="button" onClick={() => setSearch("")} aria-label="Filters" s="width:40px;height:40px;border:none;background:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--ink-soft,#444746);" hover={HOVER_CIRCLE}><Icon size={22} d={P.filter} /></Box>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <Box as="button" onClick={() => setLayout((l) => (l === "modern" ? "classic" : "modern"))} s="display:flex;align-items:center;gap:8px;height:36px;padding:0 14px;border:1px solid var(--border,#dadce0);background:var(--surface,#fff);border-radius:18px;cursor:pointer;font-family:'Roboto',Arial;font-size:13px;font-weight:500;color:var(--ink-soft,#444746);" hover="background:var(--hover,#f0f4f9)">
          <Icon size={16} d={P.layout} /><span>{layout === "modern" ? "Modern" : "Classic"}</span>
        </Box>
        <Box as="button" aria-label="Help" s="width:48px;height:48px;border:none;background:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--ink-soft,#444746);" hover={HOVER_CIRCLE}><Icon size={22} d={P.help} /></Box>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#1a73e8,#174ea6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 500, fontSize: 15, marginLeft: 6, cursor: "pointer", flex: "none", boxShadow: "0 1px 2px rgba(0,0,0,.2)" }}>A</div>
      </header>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* ===== SIDEBAR ===== */}
        <aside style={{ width: collapsed ? 72 : 256, flex: "none", padding: "0 8px 12px 8px", display: "flex", flexDirection: "column", overflowY: "auto", overflowX: "hidden", transition: "width .18s ease" }}>
          <div style={{ padding: "0 8px 16px 4px" }}>
            <Box as="button" onClick={() => openCompose(null)} s={collapsed
              ? "display:flex;align-items:center;justify-content:center;width:48px;height:48px;padding:0;border:none;background:var(--accent,#c2e7ff);color:var(--accent-ink,#001d35);border-radius:16px;cursor:pointer;box-shadow:0 1px 3px rgba(60,64,67,.25);"
              : "display:flex;align-items:center;gap:14px;height:56px;padding:0 24px 0 18px;border:none;background:var(--accent,#c2e7ff);color:var(--accent-ink,#001d35);border-radius:16px;cursor:pointer;font-family:'Roboto Flex','Roboto',Arial;font-size:15px;font-weight:500;box-shadow:0 1px 3px rgba(60,64,67,.25);"}
              hover="box-shadow:0 1px 3px rgba(60,64,67,.35),0 4px 8px rgba(60,64,67,.18)">
              <Icon size={22} d={P.compose} /><span style={{ display: collapsed ? "none" : undefined }}>Triage</span>
            </Box>
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {FOLDERS.map(([k, label, path]) => {
              const active = folder === k;
              const c = k === "queue" ? unreadQueue : txns.filter((t) => inFolder(t, k)).length;
              return (
                <Box key={k} onClick={() => goFolder(k)} s={navStyle(active)}>
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, flex: "none" }}><Icon d={path} /></span>
                  <span style={{ ...({} as any), ...cssInline(labelStyle) }}>{label}</span>
                  <span style={{ display: collapsed ? "none" : undefined, fontSize: 12, fontWeight: active ? 700 : 500, color: k === "fraud" ? "#d93025" : active ? "var(--sel-ink,#001d35)" : "var(--ink-soft,#444746)" }}>{c > 0 ? c : ""}</span>
                </Box>
              );
            })}
          </nav>
          <div style={{ height: 1, background: "var(--border,#eef0f3)", margin: "12px 12px" }} />
          <div style={{ display: collapsed ? "none" : undefined, padding: "4px 16px 8px", fontSize: 13, fontWeight: 500, color: "var(--ink-soft,#444746)", fontFamily: "'Roboto Flex','Roboto',Arial" }}>Workspace</div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {WORKSPACE.map(([label, path, badge]) => {
              const isDrift = badge === "drift";
              const bdg = isDrift ? "!" : badge;
              return (
                <Box key={label} s={navStyle(false)}>
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, flex: "none" }}><Icon d={path} /></span>
                  <span style={cssInline(labelStyle)}>{label}</span>
                  {!collapsed && bdg ? (
                    <span style={{ minWidth: 18, height: 18, padding: "0 5px", borderRadius: 9, background: isDrift ? "#fce8e6" : "var(--hover,#f0f4f9)", color: isDrift ? "#d93025" : "var(--ink-soft,#444746)", fontSize: 11, fontWeight: isDrift ? 700 : 500, display: "flex", alignItems: "center", justifyContent: "center" }}>{bdg}</span>
                  ) : null}
                </Box>
              );
            })}
          </nav>
          <div style={{ flex: 1 }} />
          <div style={{ display: collapsed ? "none" : undefined, padding: "14px 16px 4px", fontSize: 11, color: "var(--ink-soft,#444746)", opacity: 0.7, lineHeight: 1.5 }}>Model v4.2 · AUC-PR 0.87<br />Last retrain 2 days ago</div>
        </aside>

        {/* ===== MAIN ===== */}
        <main style={{ flex: 1, minWidth: 0, background: "var(--surface,#fff)", borderRadius: "16px 16px 0 0", marginRight: 8, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 0 0 1px var(--border,#eef0f3)" }}>
          {!openId ? <ListView /> : <DetailView />}
        </main>
      </div>

      {/* ===== SNACKBAR ===== */}
      {snack ? (
        <div style={{ position: "fixed", left: 24, bottom: 24, zIndex: 60, display: "flex", alignItems: "center", gap: 18, minWidth: 300, maxWidth: 560, height: 48, padding: "0 8px 0 20px", background: "#323539", color: "#e8eaed", borderRadius: 6, boxShadow: "0 3px 8px rgba(0,0,0,.35)", fontSize: 14, animation: "snackUp .22s ease-out" }}>
          <span style={{ flex: 1 }}>{snack.msg}</span>
          {snack.prev ? <button onClick={undoSnack} style={{ background: "none", border: "none", color: "#8ab4f8", fontFamily: "'Roboto',Arial", fontSize: 14, fontWeight: 500, cursor: "pointer", padding: "8px 10px" }}>Undo</button> : null}
          <Box as="button" onClick={() => setSnack(null)} aria-label="Dismiss" s="width:34px;height:34px;border:none;background:none;color:#9aa0a6;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;" hover="background:rgba(255,255,255,.08)"><Icon size={18} d={P.close} /></Box>
        </div>
      ) : null}

      {/* ===== COMPOSE / ESCALATE ===== */}
      {compose ? (
        <div style={{ position: "fixed", right: 24, bottom: 0, zIndex: 70, width: 540, maxWidth: "calc(100vw - 48px)", background: "#fff", borderRadius: "12px 12px 0 0", boxShadow: "0 -2px 6px rgba(0,0,0,.12),0 12px 28px rgba(0,0,0,.28)", display: "flex", flexDirection: "column", overflow: "hidden", animation: "popIn .2s ease-out", color: "#202124" }}>
          <div style={{ display: "flex", alignItems: "center", height: 42, padding: "0 8px 0 16px", background: "#404347", color: "#e8eaed" }}>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>Escalate fraud case</span>
            <Box as="button" onClick={() => setCompose(null)} aria-label="Close" s="width:32px;height:32px;border:none;background:none;color:#e8eaed;border-radius:4px;cursor:pointer;display:flex;align-items:center;justify-content:center;" hover="background:rgba(255,255,255,.12)"><Icon size={18} d={P.close} /></Box>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 16px", borderBottom: "1px solid #f1f3f4" }}>
            <span style={{ fontSize: 13, color: "#5f6368", width: 28 }}>To</span>
            <input value={compose.to} onChange={(e) => setCompose({ ...compose, to: e.target.value })} style={{ flex: 1, border: "none", outline: "none", fontSize: 14, fontFamily: "'Roboto',Arial", color: "#202124" }} />
            <span style={{ fontSize: 12, color: "#5f6368", background: "#f1f3f4", padding: "3px 10px", borderRadius: 12 }}>Risk Manager</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", padding: "6px 16px", borderBottom: "1px solid #f1f3f4" }}>
            <input value={compose.subject} onChange={(e) => setCompose({ ...compose, subject: e.target.value })} placeholder="Subject" style={{ flex: 1, border: "none", outline: "none", fontSize: 14, fontWeight: 500, fontFamily: "'Roboto',Arial", color: "#202124" }} />
          </div>
          <textarea value={compose.body} onChange={(e) => setCompose({ ...compose, body: e.target.value })} placeholder="Add a note for the risk manager…" style={{ border: "none", outline: "none", resize: "none", height: 200, padding: "14px 16px", fontSize: 14, lineHeight: 1.6, fontFamily: "'Roboto',Arial", color: "#202124" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px" }}>
            <Box as="button" onClick={sendEscalate} s="display:flex;align-items:center;gap:10px;height:40px;padding:0 14px 0 24px;border:none;background:#0b57d0;color:#fff;border-radius:20px;cursor:pointer;font-family:'Roboto Flex','Roboto',Arial;font-size:14px;font-weight:500;" hover="background:#0847b0">Send<Icon size={18} d={P.send} /></Box>
            <span style={{ fontSize: 12, color: "#5f6368" }}>Marks case <b>In review</b> &amp; stars it</span>
          </div>
        </div>
      ) : null}
    </div>
  );

  // ===================== sub-views (closures over state) =====================
  function ListView() {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {selected.length > 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 4, height: 48, padding: "0 16px", flex: "none", borderBottom: "1px solid var(--border,#eef0f3)" }}>
            <Box onClick={() => setSelected([])} s="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#1a73e8;" hover="background:var(--hover,#f0f4f9)"><Icon size={20} d={P.back} /></Box>
            <span style={{ fontSize: 13, color: "var(--ink-soft,#444746)", margin: "0 12px 0 6px", fontWeight: 500 }}>{selected.length} selected</span>
            <Box as="button" onClick={() => confirmFraud(null)} s="display:flex;align-items:center;gap:8px;height:34px;padding:0 14px;border:1px solid #f6aea9;background:#fce8e6;color:#c5221f;border-radius:18px;cursor:pointer;font-family:'Roboto',Arial;font-size:13px;font-weight:500;" hover="background:#fadad7"><Icon size={16} d={P.warning} />Confirm fraud</Box>
            <Box as="button" onClick={() => markSafe(null)} s="display:flex;align-items:center;gap:8px;height:34px;padding:0 14px;border:1px solid #a8dab5;background:#e6f4ea;color:#188038;border-radius:18px;cursor:pointer;font-family:'Roboto',Arial;font-size:13px;font-weight:500;margin-left:8px;" hover="background:#d6ecdc"><Icon size={16} d={P.check} />Mark safe</Box>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 2, height: 48, padding: "0 16px", flex: "none" }}>
            <Box onClick={() => (allSelected ? setSelected([]) : setSelected(visible.map((t) => t.id)))} s="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--ink-soft,#5f6368);" hover="background:var(--hover,#f0f4f9)"><BoxIcon on={allSelected} /></Box>
            <Box onClick={() => setTxns((p) => [...p])} s="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--ink-soft,#5f6368);margin-left:6px;" hover="background:var(--hover,#f0f4f9)"><Icon size={20} d={P.refresh} /></Box>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 13, color: "var(--ink-soft,#444746)", marginRight: 8 }}>{visible.length ? `1–${visible.length} of ${folderList.length}` : `0 of ${folderList.length}`}</span>
          </div>
        )}

        {/* tabs */}
        <div style={{ display: "flex", gap: 0, padding: "0 16px", flex: "none", borderBottom: "1px solid var(--border,#eef0f3)" }}>
          {TABS.map(([k, label, path]) => {
            const active = tab === k; const c = TAB_COLORS[k];
            return (
              <Box key={k} onClick={() => { setTab(k); setSelected([]); }} s={`display:flex;align-items:center;gap:9px;height:46px;padding:0 22px;cursor:pointer;font-family:'Roboto',Arial;font-size:14px;font-weight:${active ? "700" : "500"};color:${active ? c : "var(--ink-soft,#5f6368)"};box-shadow:${active ? "inset 0 -3px 0 " + c : "none"};transition:color .12s;`}>
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width={18} height={18} viewBox="0 0 24 24" fill={k === "all" ? "none" : c} stroke={k === "all" ? c : "none"} strokeWidth={2} strokeLinecap="round"><path d={path} /></svg>
                </span>
                <span>{label}</span>
                {tabCount[k] > 0 ? <span style={{ minWidth: 18, height: 18, padding: "0 6px", borderRadius: 9, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", background: active ? c : "var(--hover,#eef0f3)", color: active ? "#fff" : "var(--ink-soft,#5f6368)" }}>{tabCount[k]}</span> : null}
              </Box>
            );
          })}
        </div>

        {/* rows */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {visible.map((t) => {
            const b = band(t.score); const sel = selected.includes(t.id); const bold = !t.read;
            return (
              <Box key={t.id} onClick={() => openRow(t.id)} hover="background:var(--hover,#f0f4f9);box-shadow:inset 0 -1px 0 var(--border,#eef0f3),0 1px 3px rgba(60,64,67,.22);z-index:1;"
                s={`display:flex;align-items:center;gap:6px;height:50px;padding:0 14px 0 8px;cursor:pointer;border-bottom:1px solid var(--border,#f1f3f4);background:${sel ? "var(--rowsel,#fdf0ef)" : t.read ? "rgba(0,0,0,.018)" : "var(--surface,#fff)"};transition:box-shadow .1s;`}>
                <Box onClick={(e: any) => toggleSelect(t.id, e)} s={`width:34px;height:34px;flex:none;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;color:${sel ? "#1a73e8" : "var(--ink-soft,#9aa0a6)"};`} hover={HOVER_CIRCLE}><BoxIcon on={sel} /></Box>
                <Box onClick={(e: any) => toggleStar(t.id, e)} s={`width:34px;height:34px;flex:none;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;color:${t.starred ? "#f4b400" : "var(--ink-soft,#bdc1c6)"};`} hover={HOVER_CIRCLE}><StarIcon on={t.starred} /></Box>
                <div style={{ width: 32, height: 32, flex: "none", borderRadius: "50%", background: b.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 500, fontFamily: "'Roboto',Arial" }}>{t.merchant[0]}</div>
                <div style={{ width: 180, flex: "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: 14, fontWeight: bold ? 700 : 400, color: "var(--ink,#202124)" }}>{t.merchant}</div>
                <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
                  <span style={{ flex: "none", fontSize: 14, fontWeight: bold ? 700 : 500, color: "var(--ink,#202124)" }}>{money(t.amount)}</span>
                  <span style={{ flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: 14, color: "var(--ink-soft,#5f6368)" }}>{t.cat} · {t.city}, {t.country} · ••{t.last4}</span>
                </div>
                <span style={{ flex: "none", fontSize: 11, fontWeight: 700, letterSpacing: ".3px", padding: "3px 9px", borderRadius: "var(--pill,12px)" as any, background: b.bg, color: b.color, textTransform: "uppercase" }}>{b.label}</span>
                <div style={{ width: 54, flex: "none", height: 6, borderRadius: 3, background: "var(--hover,#eef0f3)", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 3, width: Math.round(t.score * 100) + "%", background: b.color }} />
                </div>
                <span style={{ width: 62, flex: "none", textAlign: "right", fontSize: 12, color: bold ? "var(--ink,#202124)" : "var(--ink-soft,#5f6368)", fontWeight: bold ? 700 : 400 }}>{t.time}</span>
              </Box>
            );
          })}
          {visible.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "90px 20px", color: "var(--ink-soft,#80868b)", textAlign: "center" }}>
              <svg width={120} height={120} viewBox="0 0 24 24" fill="none" stroke="#dadce0" strokeWidth={1}><circle cx={12} cy={12} r={9} /><path d="M8 13l2.5 2.5L16 10" stroke="#a8dab5" /></svg>
              <div style={{ fontSize: 18, color: "var(--ink-soft,#5f6368)", marginTop: 18, fontFamily: "'Roboto Flex','Roboto',Arial" }}>All clear in this view</div>
              <div style={{ fontSize: 13, marginTop: 6, opacity: 0.8 }}>No transactions match the current filters.</div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  function DetailView() {
    if (!open) return null;
    const b = band(open.score);
    const statusMap: Record<string, string> = { new: "New alert", review: "In review", cleared: "Cleared safe", fraud: "Confirmed fraud" };
    const maxw = Math.max(...open.feats.map((f) => Math.abs(f[1])));
    const fields: [string, string][] = [
      ["Transaction ID", open.id], ["Amount", money(open.amount)], ["Merchant", open.merchant], ["Category", open.cat],
      ["Card on file", "•••• " + open.last4], ["Channel", open.channel], ["Device", open.device], ["Location", open.city + ", " + open.country],
    ];
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 2, height: 48, padding: "0 12px", flex: "none", borderBottom: "1px solid var(--border,#eef0f3)" }}>
          <Box onClick={() => setOpenId(null)} s="width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--ink-soft,#5f6368);" hover="background:var(--hover,#f0f4f9)"><Icon size={20} d={P.arrowBack} /></Box>
          <div style={{ width: 1, height: 24, background: "var(--border,#eef0f3)", margin: "0 8px" }} />
          <Box onClick={() => markSafe(open.id)} title="Mark safe" s="width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--ink-soft,#5f6368);" hover="background:var(--hover,#f0f4f9)"><Icon size={20} d={P.check} /></Box>
          <Box onClick={() => confirmFraud(open.id)} title="Confirm fraud" s="width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--ink-soft,#5f6368);" hover="background:#fce8e6;color:#d93025"><Icon size={20} d={P.warning} /></Box>
          <Box onClick={() => openCompose(open.id)} title="Escalate" s="width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--ink-soft,#5f6368);" hover="background:var(--hover,#f0f4f9)"><Icon size={20} d={P.escalate} /></Box>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 13, color: "var(--ink-soft,#5f6368)", marginRight: 8 }}>Case detail</span>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          <div style={{ maxWidth: 820, margin: "0 auto", padding: "18px 36px 56px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 4 }}>
              <span style={{ fontFamily: "'Roboto Flex','Roboto',Arial", fontSize: 24, fontWeight: 400, color: "var(--ink,#202124)" }}>{money(open.amount)}</span>
              <span style={{ flex: "none", fontSize: 11, fontWeight: 700, letterSpacing: ".4px", padding: "4px 11px", borderRadius: "var(--pill,12px)" as any, background: b.bg, color: b.color, textTransform: "uppercase" }}>{b.label}</span>
              <Box onClick={(e: any) => toggleStar(open.id, e)} s={`width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;color:${open.starred ? "#f4b400" : "var(--ink-soft,#bdc1c6)"};`} hover="background:var(--hover,#f0f4f9)"><StarIcon on={open.starred} /></Box>
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-soft,#5f6368)", marginBottom: 20 }}>{statusMap[open.status]}</div>

            <div style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 18, borderBottom: "1px solid var(--border,#eef0f3)" }}>
              <div style={{ width: 42, height: 42, flex: "none", borderRadius: "50%", background: b.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, fontWeight: 500 }}>{open.merchant[0]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink,#202124)" }}>{open.merchant}</div>
                <div style={{ fontSize: 13, color: "var(--ink-soft,#5f6368)" }}>{open.id}  ·  {open.channel}</div>
              </div>
              <div style={{ fontSize: 13, color: "var(--ink-soft,#5f6368)", textAlign: "right" }}>{open.time} today  ·  {open.ago} ago</div>
            </div>

            <div style={{ display: "flex", gap: 24, alignItems: "center", padding: "24px 0", borderBottom: "1px solid var(--border,#eef0f3)" }}>
              <div style={{ width: 96, height: 96, borderRadius: "50%", flex: "none", background: `conic-gradient(${b.color} ${Math.round(open.score * 360)}deg,var(--hover,#eef0f3) 0)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 74, height: 74, borderRadius: "50%", background: "var(--surface,#fff)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 22, fontWeight: 700, color: b.color, lineHeight: 1 }}>{open.score.toFixed(2)}</span>
                  <span style={{ fontSize: 10, color: "var(--ink-soft,#80868b)", marginTop: 2, letterSpacing: ".5px" }}>RISK</span>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Roboto Flex','Roboto',Arial", fontSize: 16, fontWeight: 500, color: "var(--ink,#202124)", marginBottom: 6 }}>Fraud probability {open.score.toFixed(2)}</div>
                <div style={{ fontSize: 13, color: "var(--ink-soft,#5f6368)", lineHeight: 1.55 }}>Scored in 142 ms by model v4.2 (XGBoost + DL ensemble). Explanation generated with SageMaker Clarify / SHAP — the factors below show what pushed this score up or down.</div>
              </div>
            </div>

            <div style={{ padding: "22px 0", borderBottom: "1px solid var(--border,#eef0f3)" }}>
              <div style={{ fontFamily: "'Roboto Flex','Roboto',Arial", fontSize: 14, fontWeight: 500, color: "var(--ink,#202124)", marginBottom: 16 }}>Why this was flagged</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {open.feats.map((f, i) => {
                  const up = f[2] === "up"; const c = up ? "#d93025" : "#188038"; const w = Math.round((Math.abs(f[1]) / maxw) * 100);
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <span style={{ width: 230, flex: "none", fontSize: 13, color: "var(--ink,#3c4043)" }}>{f[0]}</span>
                      <div style={{ flex: 1, height: 8, borderRadius: 4, background: "var(--hover,#eef0f3)", overflow: "hidden" }}><div style={{ height: 8, borderRadius: 4, width: Math.max(w, 6) + "%", background: c, transition: "width .4s" }} /></div>
                      <span style={{ flex: "none", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 6, background: up ? "#fce8e6" : "#e6f4ea", color: c }}>{up ? "RISK +" : "SAFE −"}{(up ? "+" : "−") + Math.abs(f[1])}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ padding: "22px 0" }}>
              <div style={{ fontFamily: "'Roboto Flex','Roboto',Arial", fontSize: 14, fontWeight: 500, color: "var(--ink,#202124)", marginBottom: 16 }}>Transaction details</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--border,#eef0f3)", border: "1px solid var(--border,#eef0f3)", borderRadius: 10, overflow: "hidden" }}>
                {fields.map(([label, value]) => (
                  <div key={label} style={{ background: "var(--surface,#fff)", padding: "12px 16px" }}>
                    <div style={{ fontSize: 11, color: "var(--ink-soft,#80868b)", textTransform: "uppercase", letterSpacing: ".4px", marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 14, color: "var(--ink,#202124)" }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
              <Box as="button" onClick={() => confirmFraud(open.id)} s="display:flex;align-items:center;gap:9px;height:42px;padding:0 22px;border:none;background:#d93025;color:#fff;border-radius:21px;cursor:pointer;font-family:'Roboto Flex','Roboto',Arial;font-size:14px;font-weight:500;box-shadow:0 1px 2px rgba(217,48,37,.4);" hover="background:#c5221f"><Icon size={18} d={P.warning} />Confirm fraud</Box>
              <Box as="button" onClick={() => markSafe(open.id)} s="display:flex;align-items:center;gap:9px;height:42px;padding:0 22px;border:1px solid #a8dab5;background:#e6f4ea;color:#188038;border-radius:21px;cursor:pointer;font-family:'Roboto Flex','Roboto',Arial;font-size:14px;font-weight:500;" hover="background:#d6ecdc"><Icon size={18} d={P.check} />Mark safe</Box>
              <Box as="button" onClick={() => openCompose(open.id)} s="display:flex;align-items:center;gap:9px;height:42px;padding:0 22px;border:1px solid var(--border,#dadce0);background:var(--surface,#fff);color:var(--ink,#3c4043);border-radius:21px;cursor:pointer;font-family:'Roboto Flex','Roboto',Arial;font-size:14px;font-weight:500;" hover="background:var(--hover,#f0f4f9)"><Icon size={18} d={P.escalate} />Escalate to risk manager</Box>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// helper: parse a CSS string to a style object (for the few inline label styles)
function cssInline(str: string): React.CSSProperties {
  const o: any = {};
  str.split(";").forEach((d) => {
    const i = d.indexOf(":"); if (i < 0) return;
    const k = d.slice(0, i).trim(); if (!k) return;
    o[k.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = d.slice(i + 1).trim();
  });
  return o;
}
