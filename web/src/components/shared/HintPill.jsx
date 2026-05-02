import { useState, useEffect } from "react";
import { Button } from "antd";
import { CloseOutlined, BulbFilled } from "@ant-design/icons";
import { useTranslate } from "../../hooks/useTranslate";

const STORAGE_KEY = "wf-hints-seen-v1";

function getSeen() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")); }
  catch { return new Set(); }
}

function markSeen(id) {
  const seen = getSeen();
  seen.add(id);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen])); }
  catch { /* storage full or blocked, ignore */ }
}

// One-shot dismissible hint shown above a feature on first encounter.
// Once dismissed (by close click OR action click), it won't show again
// for that key on this device.
//
// Props:
//   id            unique key — also the localStorage marker
//   title         short headline (e.g. "Did you know?")
//   description   the hint copy
//   icon          optional element (defaults to bulb)
export default function HintPill({ id, title, description, icon }) {
  const { t } = useTranslate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getSeen().has(id)) setVisible(true);
  }, [id]);

  if (!visible) return null;

  function dismiss() {
    markSeen(id);
    setVisible(false);
  }

  return (
    <div className="hint-pill" role="status">
      <div className="hint-pill-icon">{icon || <BulbFilled />}</div>
      <div className="hint-pill-body">
        {title && <div className="hint-pill-title">{title}</div>}
        <div className="hint-pill-desc">{description}</div>
      </div>
      <Button
        size="small"
        type="text"
        icon={<CloseOutlined />}
        onClick={dismiss}
        aria-label={t("hintDismiss")}
        className="hint-pill-close"
      />
    </div>
  );
}
