import { useState } from "react";
import { Segmented, Input, Button, Tooltip, Tag } from "antd";
import {
  EditOutlined,
  CloudSyncOutlined,
  ReloadOutlined,
  DisconnectOutlined,
  SyncOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";
import { useTranslate } from "../../hooks/useTranslate";
import { useRelativeTime } from "../../hooks/useRelativeTime";
import { useMasteryStore } from "../../stores/masteryStore";

interface Props {
  isSyncing: boolean;
  onRefresh: () => void;
  syncError: string | null;
}

// The two-mode header: Manual / Sync. In Sync mode shows either the
// player-ID entry form or the connected status row (last sync, refresh,
// disconnect). Stored player ID makes this a one-time setup; the actual
// polling lives in useSyncedMastery hook.
export default function MasteryModeBar({ isSyncing, onRefresh, syncError }: Props) {
  const { t } = useTranslate();
  const mode = useMasteryStore((s) => s.mode);
  const playerId = useMasteryStore((s) => s.syncPlayerId);
  const lastImportAt = useMasteryStore((s) => s.lastImportAt);
  const setMode = useMasteryStore((s) => s.setMode);
  const setSyncPlayerId = useMasteryStore((s) => s.setSyncPlayerId);

  const [draftId, setDraftId] = useState("");
  const lastSyncRel = useRelativeTime(lastImportAt);

  const handleConnect = () => {
    const id = draftId.trim();
    if (id.length !== 24) return;
    setSyncPlayerId(id);
    setDraftId("");
    // Trigger an immediate sync so the user gets feedback right away.
    setTimeout(onRefresh, 50);
  };

  const handleDisconnect = () => {
    setSyncPlayerId(null);
  };

  return (
    <div className="mastery-mode-bar">
      <Segmented
        value={mode}
        onChange={(v) => setMode(v as "manual" | "sync")}
        options={[
          { value: "manual", icon: <EditOutlined />, label: t("masteryModeManual") },
          { value: "sync", icon: <CloudSyncOutlined />, label: t("masteryModeSync") },
        ]}
      />

      {mode === "sync" && (
        <div className="mastery-sync-panel">
          {!playerId ? (
            <>
              <Input
                size="small"
                placeholder={t("profileImportIdPlaceholder")}
                value={draftId}
                onChange={(e) => setDraftId(e.target.value)}
                maxLength={24}
                style={{ maxWidth: 320 }}
                onPressEnter={handleConnect}
              />
              <Button
                size="small"
                type="primary"
                icon={<CloudSyncOutlined />}
                disabled={draftId.trim().length !== 24}
                onClick={handleConnect}
              >
                {t("masterySyncConnect")}
              </Button>
              <Tooltip title={t("masterySyncHelp")}>
                <span className="mastery-sync-help">?</span>
              </Tooltip>
            </>
          ) : (
            <>
              <Tag icon={<CheckCircleFilled />} color="success" style={{ margin: 0 }}>
                {t("masterySyncConnected")}
              </Tag>
              <span className="mastery-sync-last">
                {isSyncing ? (
                  <>
                    <SyncOutlined spin /> {t("masterySyncSyncing")}
                  </>
                ) : lastSyncRel ? (
                  t("masterySyncLast", { time: lastSyncRel })
                ) : (
                  ""
                )}
              </span>
              <Button
                size="small"
                icon={<ReloadOutlined />}
                onClick={onRefresh}
                loading={isSyncing}
              >
                {t("masterySyncRefresh")}
              </Button>
              <Tooltip title={t("masterySyncDisconnectHint")}>
                <Button
                  size="small"
                  icon={<DisconnectOutlined />}
                  onClick={handleDisconnect}
                  danger
                />
              </Tooltip>
            </>
          )}
        </div>
      )}

      {mode === "sync" && syncError && (
        <div className="mastery-sync-error">
          {t("masterySyncError")}: {syncError}
        </div>
      )}
    </div>
  );
}
