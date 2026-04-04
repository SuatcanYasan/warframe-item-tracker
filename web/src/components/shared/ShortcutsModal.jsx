import { Modal } from "antd";
import { useTranslate } from "../../hooks/useTranslate";
import { useAppStore } from "../../stores/appStore";

const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
const CMD = isMac ? "⌘" : "Ctrl";

export default function ShortcutsModal() {
  const { t } = useTranslate();
  const open = useAppStore((s) => s.shortcutsOpen);
  const closeShortcuts = useAppStore((s) => s.closeShortcuts);

  const shortcuts = [
    { keys: [CMD, "K"], description: t("shortcutOpenSearch") },
    { keys: ["/"], description: t("shortcutOpenSearch") },
    { keys: ["1"], description: t("shortcutGoCraft") },
    { keys: ["2"], description: t("shortcutGoRelic") },
    { keys: ["3"], description: t("shortcutGoInventory") },
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
