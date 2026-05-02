import { useState, useEffect, useMemo, useRef } from "react";
import { Modal, Input } from "antd";
import {
  SearchOutlined,
  AppstoreOutlined,
  TrophyOutlined,
  InboxOutlined,
  ClockCircleOutlined,
  ExperimentOutlined,
  CompassOutlined,
  ThunderboltOutlined,
  HomeOutlined,
  GoldOutlined,
  CrownOutlined,
  BgColorsOutlined,
  ShareAltOutlined,
  QuestionCircleOutlined,
  PlusCircleOutlined,
  EnterOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useTranslate } from "../../hooks/useTranslate";
import { useAppStore } from "../../stores/appStore";
import { useCraftStore } from "../../stores/craftStore";

// Cmd/Ctrl+K palette — fuzzy filter over pages + actions.
// Item search (mastery items) added later if needed; pages+actions
// already cover the bulk of "where do I go" use cases.

function fuzzyMatch(label, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  const l = label.toLowerCase();
  // simple subsequence match
  let i = 0;
  for (const ch of l) {
    if (ch === q[i]) i++;
    if (i === q.length) return true;
  }
  return l.includes(q);
}

export default function CommandPalette() {
  const { t } = useTranslate();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const openThemeDrawer = useAppStore((s) => s.openThemeDrawer);
  const openShortcuts = useAppStore((s) => s.openShortcuts);
  const openShareModal = useAppStore((s) => s.openShareModal);
  const openSearchDrawer = useCraftStore((s) => s.openSearchDrawer);

  // Cmd/Ctrl+K toggle
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      // focus input after modal mounts
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  function close() { setOpen(false); }

  const items = useMemo(() => {
    const pageGroup = [
      { id: "page-craft", group: t("cmdPages"), label: t("cmdPageCraft"), icon: <AppstoreOutlined />, run: () => navigate("/craft") },
      { id: "page-relic", group: t("cmdPages"), label: t("cmdPageRelic"), icon: <GoldOutlined />, run: () => navigate("/relic") },
      { id: "page-inventory", group: t("cmdPages"), label: t("cmdPageInventory"), icon: <InboxOutlined />, run: () => navigate("/inventory") },
      { id: "page-mastery", group: t("cmdPages"), label: t("cmdPageMastery"), icon: <TrophyOutlined />, run: () => navigate("/mastery") },
      { id: "page-timers", group: t("cmdPages"), label: t("cmdPageTimers"), icon: <ClockCircleOutlined />, run: () => navigate("/timers") },
      { id: "page-amps", group: t("cmdPages"), label: t("cmdPageAmps"), icon: <ExperimentOutlined />, run: () => navigate("/amps") },
      { id: "page-activities", group: t("cmdPages"), label: t("cmdPageActivities"), icon: <CompassOutlined />, run: () => navigate("/activities") },
      { id: "page-checklist", group: t("cmdPages"), label: t("cmdPageChecklist"), icon: <ThunderboltOutlined />, run: () => navigate("/checklist") },
      { id: "page-farm", group: t("cmdPages"), label: t("cmdPageFarm"), icon: <CompassOutlined />, run: () => navigate("/farm") },
      { id: "page-dashboard", group: t("cmdPages"), label: t("cmdPageDashboard"), icon: <HomeOutlined />, run: () => navigate("/") },
    ];
    const actionGroup = [
      { id: "action-add-item", group: t("cmdActions"), label: t("cmdActionAddItem"), icon: <PlusCircleOutlined />, run: () => { navigate("/craft"); openSearchDrawer(); } },
      { id: "action-theme", group: t("cmdActions"), label: t("cmdActionThemeDrawer"), icon: <BgColorsOutlined />, run: openThemeDrawer },
      { id: "action-share", group: t("cmdActions"), label: t("cmdActionShare"), icon: <ShareAltOutlined />, run: openShareModal },
      { id: "action-shortcuts", group: t("cmdActions"), label: t("cmdActionShortcuts"), icon: <QuestionCircleOutlined />, run: openShortcuts },
    ];
    return [...pageGroup, ...actionGroup];
  }, [t, navigate, openThemeDrawer, openShortcuts, openShareModal, openSearchDrawer]);

  const filtered = useMemo(
    () => items.filter((item) => fuzzyMatch(item.label, query)),
    [items, query],
  );

  // Group by `group` field, preserving order
  const grouped = useMemo(() => {
    const map = new Map();
    filtered.forEach((item) => {
      if (!map.has(item.group)) map.set(item.group, []);
      map.get(item.group).push(item);
    });
    return [...map.entries()];
  }, [filtered]);

  // Reset active when filtered list changes length
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function runItem(item) {
    item.run();
    close();
  }

  function onKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[activeIndex];
      if (item) runItem(item);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  }

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-cmd-idx="${activeIndex}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return (
    <Modal
      open={open}
      onCancel={close}
      footer={null}
      closable={false}
      width={580}
      styles={{ body: { padding: 0 } }}
      classNames={{ content: "command-palette-modal" }}
      destroyOnClose
    >
      <div className="command-palette">
        <Input
          ref={inputRef}
          prefix={<SearchOutlined />}
          placeholder={t("cmdPlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          variant="borderless"
          size="large"
          className="command-palette-input"
        />
        <div className="command-palette-list" ref={listRef}>
          {filtered.length === 0 ? (
            <div className="command-palette-empty">{t("cmdNoResults")}</div>
          ) : (
            grouped.map(([groupName, groupItems]) => (
              <div key={groupName} className="command-palette-group">
                <div className="command-palette-group-label">{groupName}</div>
                {groupItems.map((item) => {
                  const idx = filtered.indexOf(item);
                  const active = idx === activeIndex;
                  return (
                    <button
                      key={item.id}
                      data-cmd-idx={idx}
                      className={`command-palette-item ${active ? "active" : ""}`}
                      onClick={() => runItem(item)}
                      onMouseEnter={() => setActiveIndex(idx)}
                    >
                      <span className="command-palette-item-icon">{item.icon}</span>
                      <span className="command-palette-item-label">{item.label}</span>
                      {active && <EnterOutlined className="command-palette-item-enter" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
        <div className="command-palette-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> {t("cmdNavigate")}</span>
          <span><kbd>↵</kbd> {t("cmdSelect")}</span>
          <span><kbd>esc</kbd> {t("cmdClose")}</span>
        </div>
      </div>
    </Modal>
  );
}
