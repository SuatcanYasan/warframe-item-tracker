import { Modal } from "antd";
import { useTranslate } from "../../hooks/useTranslate";
import { useAppStore } from "../../stores/appStore";

const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent || navigator.platform);
const MOD = isMac ? "⌘" : "Ctrl";

export default function ShortcutsModal() {
  const { t } = useTranslate();
  const open = useAppStore((s) => s.shortcutsOpen);
  const closeShortcuts = useAppStore((s) => s.closeShortcuts);

  const shortcuts = [
    { keys: [MOD, "Space"], description: t("shortcutOpenSearch") },
    { keys: ["/"], description: t("shortcutOpenSearch") },
    { keys: [MOD, "K"], description: t("shortcutShowHelp") },
    { keys: ["0"], description: t("dashboard") },
    { keys: ["1"], description: t("shortcutGoCraft") },
    { keys: ["2"], description: t("shortcutGoRelic") },
    { keys: ["3"], description: t("shortcutGoInventory") },
    { keys: ["4"], description: t("shortcutGoMastery") },
    { keys: ["5"], description: t("timersTracker") },
    { keys: ["?"], description: t("shortcutShowHelp") },
    { keys: ["Esc"], description: t("shortcutCloseModal") },
  ];

  return (
    <Modal
      title={t("shortcutsTitle")}
      open={open}
      onCancel={closeShortcuts}
      footer={null}
      width={440}
      centered
    >
      <div className="shortcuts-list">
        {shortcuts.map((s, i) => (
          <div key={i} className="shortcut-row">
            <span className="shortcut-desc">{s.description}</span>
            <span className="shortcut-keys">
              {s.keys.map((k, j) => (
                <kbd key={j} className="shortcut-key">{k}</kbd>
              ))}
            </span>
          </div>
        ))}
      </div>
    </Modal>
  );
}
