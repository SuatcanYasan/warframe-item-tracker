import { useEffect, useState } from "react";
import { Modal, Input, Button, Segmented, Alert } from "antd";
import { CopyOutlined, CheckOutlined, LinkOutlined, ImportOutlined, ShareAltOutlined } from "@ant-design/icons";
import toast from "react-hot-toast";
import { useTranslate } from "../../hooks/useTranslate";
import { useAppStore } from "../../stores/appStore";
import { useCraftStore } from "../../stores/craftStore";
import { useRelicStore } from "../../stores/relicStore";
import { useInventoryStore } from "../../stores/inventoryStore";
import { useMasteryStore } from "../../stores/masteryStore";
import { useAmpStore } from "../../stores/ampStore";
import { useChecklistStore } from "../../stores/checklistStore";
import {
  encodeShareState,
  decodeShareState,
  buildSharePayload,
  countSharePayload,
  type SharePayload,
} from "../../utils/shareLink";
import type { PersistedState } from "../../types";

type ShareMode = "export" | "import";

function collectCurrentPersisted(): SharePayload {
  return buildSharePayload({
    selectedItems: useCraftStore.getState().selectedItems,
    completedMap: useCraftStore.getState().completedMap,
    completionView: useCraftStore.getState().completionView,
    relicFoundComponents: useRelicStore.getState().foundComponents,
    inventoryParts: useInventoryStore.getState().inventoryParts,
    masteredItems: useMasteryStore.getState().masteredItems,
    trackedSets: useAmpStore.getState().trackedSets,
    masteryParts: useAmpStore.getState().masteryParts,
    completedMaterials: useAmpStore.getState().completedMaterials,
    checklistItems: useChecklistStore.getState().items,
  } as unknown as PersistedState);
}

function applyImportedPayload(payload: SharePayload | null): void {
  if (!payload || typeof payload !== "object") return;
  // Re-use each store's hydrate() so we get validation + normalisation for free.
  useCraftStore.getState().hydrate({
    selectedItems: payload.selectedItems,
    completedMap: payload.completedMap,
    completionView: payload.completionView,
  } as unknown as Pick<PersistedState, "selectedItems" | "completedMap" | "completionView">);
  useRelicStore.getState().hydrate({
    relicFoundComponents: payload.relicFoundComponents,
  } as never);
  useInventoryStore.getState().hydrate({
    inventoryParts: payload.inventoryParts,
  } as never);
  useMasteryStore.getState().hydrate({
    masteredItems: payload.masteredItems,
  } as never);
  useAmpStore.getState().hydrate({
    trackedSets: payload.trackedSets,
    masteryParts: payload.masteryParts,
    completedMaterials: payload.completedMaterials,
  } as never);
  useChecklistStore.getState().hydrate({
    checklistItems: payload.checklistItems,
  } as never);
}

export default function ShareModal() {
  const { t } = useTranslate();
  const open = useAppStore((s) => s.shareModalOpen);
  const close = useAppStore((s) => s.closeShareModal);
  const pendingImportEncoded = useAppStore((s) => s.pendingImportEncoded);
  const clearPendingImport = useAppStore((s) => s.clearPendingImport);

  const [mode, setMode] = useState<ShareMode>("export");
  const [shareUrl, setShareUrl] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [importText, setImportText] = useState<string>("");
  const [importPreview, setImportPreview] = useState<SharePayload | null>(null);
  const [importing, setImporting] = useState<boolean>(false);

  // When the app auto-opens the modal with a pending share link, jump to import mode.
  useEffect(() => {
    if (open && pendingImportEncoded) {
      setMode("import");
      setImportText(pendingImportEncoded);
    }
  }, [open, pendingImportEncoded]);

  // Auto-preview when import text changes and looks valid.
  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!importText.trim()) {
        setImportPreview(null);
        return;
      }
      // Accept either full URL or raw encoded payload
      const m = importText.match(/#share=([^&\s]+)/);
      const encoded = m ? m[1] : importText.trim();
      try {
        const payload = await decodeShareState(encoded);
        if (!cancel) setImportPreview(payload);
      } catch {
        if (!cancel) setImportPreview(null);
      }
    })();
    return () => { cancel = true; };
  }, [importText]);

  async function handleGenerate() {
    const payload = collectCurrentPersisted();
    try {
      const encoded = await encodeShareState(payload);
      const url = `${window.location.origin}/#share=${encoded}`;
      setShareUrl(url);
    } catch (e) {
      const err = e as { message?: string };
      toast.error(String(err?.message || e));
    }
  }

  // Auto-generate when user opens the modal in export mode.
  useEffect(() => {
    if (open && mode === "export") handleGenerate();

  }, [open, mode]);

  function handleCopy() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success(t("shareCopied"));
  }

  async function handleImport() {
    if (!importPreview) return;
    setImporting(true);
    try {
      applyImportedPayload(importPreview);
      toast.success(t("shareImported"));
      clearPendingImport();
      close();
      window.history.replaceState(null, "", window.location.pathname);
    } finally {
      setImporting(false);
    }
  }

  function handleClose() {
    clearPendingImport();
    setImportText("");
    setImportPreview(null);
    setShareUrl("");
    close();
  }

  const counts = importPreview ? countSharePayload(importPreview) : null;

  return (
    <Modal
      title={
        <span>
          <ShareAltOutlined style={{ marginRight: 8, color: "var(--wf-primary)" }} />
          {t("shareModalTitle")}
        </span>
      }
      open={open}
      onCancel={handleClose}
      footer={null}
      width={560}
      destroyOnHidden
    >
      <Segmented
        block
        value={mode}
        onChange={(value) => setMode(value as ShareMode)}
        options={[
          { value: "export", label: <span><LinkOutlined /> {t("shareCreate")}</span> },
          { value: "import", label: <span><ImportOutlined /> {t("shareImport")}</span> },
        ]}
        style={{ marginBottom: 16 }}
      />

      {mode === "export" && (
        <div className="share-panel">
          <Alert type="info" showIcon message={t("shareExportHint")} style={{ marginBottom: 12 }} />
          <Input.TextArea
            value={shareUrl}
            readOnly
            autoSize={{ minRows: 3, maxRows: 6 }}
            onFocus={(e) => e.target.select()}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <Button
              type="primary"
              icon={copied ? <CheckOutlined /> : <CopyOutlined />}
              onClick={handleCopy}
              disabled={!shareUrl}
            >
              {copied ? t("shareCopied") : t("shareCopyLink")}
            </Button>
            <Button onClick={handleGenerate}>{t("shareRegenerate")}</Button>
          </div>
        </div>
      )}

      {mode === "import" && (
        <div className="share-panel">
          <Alert type="warning" showIcon message={t("shareImportHint")} style={{ marginBottom: 12 }} />
          <Input.TextArea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={t("shareImportPlaceholder")}
            autoSize={{ minRows: 3, maxRows: 6 }}
          />
          {counts && (
            <div className="share-preview">
              <div className="share-preview-title">{t("sharePreviewTitle")}</div>
              <div className="share-preview-grid">
                <div><b>{counts.selectedItems}</b> {t("shareCraftItems")}</div>
                <div><b>{counts.inventoryParts}</b> {t("shareVaultParts")}</div>
                <div><b>{counts.masteredItems}</b> {t("shareMasteryItems")}</div>
                <div><b>{counts.trackedSets}</b> {t("shareAmpSets")}</div>
                <div><b>{counts.checklistItems}</b> {t("shareChecklistItems")}</div>
                <div><b>{counts.relicFoundComponents}</b> {t("shareRelicProgress")}</div>
              </div>
            </div>
          )}
          {importText.trim() && !importPreview && (
            <Alert type="error" showIcon message={t("shareInvalidLink")} style={{ marginTop: 10 }} />
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <Button
              type="primary"
              danger
              icon={<ImportOutlined />}
              onClick={handleImport}
              loading={importing}
              disabled={!importPreview}
            >
              {t("shareReplace")}
            </Button>
            <Button onClick={handleClose}>{t("confirmRemoveCancel")}</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
