import { useState, useEffect, type ReactNode } from "react";
import { Button } from "antd";
import { CloseOutlined, BulbFilled } from "@ant-design/icons";
import { useTranslate } from "../../hooks/useTranslate";

const STORAGE_KEY = "wf-hints-seen-v1";

function getSeen(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as string[]); }
  catch { return new Set<string>(); }
}

function markSeen(id: string): void {
  const seen = getSeen();
  seen.add(id);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen])); }
  catch { /* storage full or blocked, ignore */ }
}

interface Props {
  id: string;
  title?: ReactNode;
  description: ReactNode;
  icon?: ReactNode;
}

// One-shot dismissible hint shown above a feature on first encounter.
export default function HintPill({ id, title, description, icon }: Props) {
  const { t } = useTranslate();
  const [visible, setVisible] = useState<boolean>(false);

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
