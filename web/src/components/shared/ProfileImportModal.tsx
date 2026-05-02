import { useState } from "react";
import { Modal, Button, Input, Tabs, Statistic, Space, Alert, Collapse } from "antd";
import {
  CloudDownloadOutlined,
  ImportOutlined,
  TrophyOutlined,
  AppstoreOutlined,
  UserOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useTranslate } from "../../hooks/useTranslate";
import { useMasteryStore } from "../../stores/masteryStore";
import { requestJson } from "../../utils/helpers";
import type { MasteryStatus } from "../../types";

interface ProfileSummary {
  accountId: string;
  displayName: string;
  platformNames: string[];
  masteryRank: number;
  itemCount: number;
  realTotalMasteryXp: number;
  breakdown: {
    items: number;
    intrinsics: number;
    starChart: number;
    junctions: number;
    intrinsicRankTotal: number;
    missionCount: number;
  };
  // xpItems shape changed: each item now carries derived rank/maxRank/masteryXp.
  xpItems: { uniqueName: string; affinity: number; rank: number; maxRank: number; masteryXp: number }[];
}

// Per-item mastered/owned derivation now happens server-side (the
// /api/profile/import endpoint converts affinity → rank → MR XP using
// the WFCD-correct thresholds). We just read `rank` and `maxRank` off
// each xpItem — no client-side guesswork needed anymore.

function deriveStatusMap(xpItems: ProfileSummary["xpItems"]): Record<string, MasteryStatus> {
  const out: Record<string, MasteryStatus> = {};
  for (const it of xpItems) {
    // Backend now sends derived rank already. rank == maxRank → fully mastered.
    out[it.uniqueName] = it.rank >= it.maxRank ? "mastered" : "owned";
  }
  return out;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ProfileImportModal({ open, onClose }: Props) {
  const { t } = useTranslate();
  const setMasteredItems = useMasteryStore((s) => s.setMasteredItems);
  const setRealProfile = useMasteryStore((s) => s.setRealProfile);

  const [tab, setTab] = useState<"id" | "file">("id");
  const [playerId, setPlayerId] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<ProfileSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setPlayerId("");
    setSummary(null);
    setError(null);
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  async function fetchById() {
    setLoading(true);
    setError(null);
    try {
      const data = await requestJson<ProfileSummary>("/api/profile/import", {
        method: "POST",
        body: JSON.stringify({ playerId: playerId.trim() }),
      });
      setSummary(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);
    try {
      const text = await file.text();
      const rawProfileJson = JSON.parse(text);
      const data = await requestJson<ProfileSummary>("/api/profile/import", {
        method: "POST",
        body: JSON.stringify({ rawProfileJson }),
      });
      setSummary(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function applyToMastery() {
    if (!summary) return;
    const statusMap = deriveStatusMap(summary.xpItems);
    setMasteredItems(statusMap);
    // Save real MR + the per-source XP breakdown the backend computed.
    // realTotalMasteryXp already accounts for items + intrinsics + star
    // chart + junctions, so the calculator can show actual progress
    // through the current rank instead of guessing.
    setRealProfile(summary.masteryRank, summary.realTotalMasteryXp, summary.breakdown, Date.now(), summary.displayName);
    toast.success(t("profileImportSuccess", { count: summary.itemCount, mr: summary.masteryRank }));
    handleClose();
  }

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      width={620}
      title={
        <Space>
          <CloudDownloadOutlined style={{ color: "var(--wf-primary)" }} />
          <span>{t("profileImportTitle")}</span>
        </Space>
      }
    >
      <p style={{ color: "var(--wf-text-muted)", marginTop: 0, marginBottom: 16 }}>
        {t("profileImportSubtitle")}
      </p>

      <AnimatePresence mode="wait">
        {!summary ? (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Tabs
              activeKey={tab}
              onChange={(k) => setTab(k as "id" | "file")}
              items={[
                {
                  key: "id",
                  label: t("profileImportTabId"),
                  children: (
                    <div style={{ paddingTop: 8 }}>
                      <label style={{ display: "block", fontSize: 12, color: "var(--wf-text-muted)", marginBottom: 6 }}>
                        {t("profileImportIdLabel")}
                      </label>
                      <Input
                        value={playerId}
                        onChange={(e) => setPlayerId(e.target.value)}
                        placeholder={t("profileImportIdPlaceholder")}
                        size="large"
                        maxLength={24}
                        autoFocus
                      />
                      <Collapse
                        ghost
                        size="small"
                        style={{ marginTop: 8 }}
                        items={[{
                          key: "help",
                          label: <Space size={6}><QuestionCircleOutlined />{t("profileImportIdHelp")}</Space>,
                          children: (
                            <p style={{ fontSize: 12, color: "var(--wf-text-muted)", margin: 0, lineHeight: 1.6 }}>
                              {t("profileImportIdHelpBody")}
                            </p>
                          ),
                        }]}
                      />
                      <Button
                        type="primary"
                        size="large"
                        icon={<CloudDownloadOutlined />}
                        loading={loading}
                        disabled={playerId.trim().length !== 24}
                        onClick={fetchById}
                        block
                        style={{ marginTop: 14 }}
                      >
                        {loading ? t("profileImportFetching") : t("profileImportFetch")}
                      </Button>
                    </div>
                  ),
                },
                {
                  key: "file",
                  label: t("profileImportTabFile"),
                  children: (
                    <div style={{ paddingTop: 8 }}>
                      <label style={{ display: "block", fontSize: 12, color: "var(--wf-text-muted)", marginBottom: 6 }}>
                        {t("profileImportFileLabel")}
                      </label>
                      <input
                        type="file"
                        accept="application/json,.json"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFile(f);
                        }}
                        style={{
                          width: "100%",
                          padding: 10,
                          border: "1px dashed var(--wf-border)",
                          borderRadius: 8,
                          background: "var(--wf-bg-base)",
                          color: "var(--wf-text)",
                          cursor: "pointer",
                        }}
                      />
                      <p style={{ fontSize: 12, color: "var(--wf-text-muted)", marginTop: 8, lineHeight: 1.5 }}>
                        {t("profileImportFileHelp")}
                      </p>
                    </div>
                  ),
                },
              ]}
            />

            {error && (
              <Alert
                type="error"
                message={t("profileImportError")}
                description={error}
                showIcon
                style={{ marginTop: 12 }}
              />
            )}
          </motion.div>
        ) : (
          <motion.div key="preview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>{t("profileImportPreviewTitle")}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
              <Statistic
                title={t("profileImportPreviewName")}
                value={summary.displayName}
                prefix={<UserOutlined />}
                valueStyle={{ fontSize: 16, color: "var(--wf-text)" }}
              />
              <Statistic
                title={t("profileImportPreviewMR")}
                value={summary.masteryRank}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: "var(--wf-primary)" }}
              />
              <Statistic
                title={t("profileImportPreviewItems")}
                value={summary.itemCount}
                prefix={<AppstoreOutlined />}
              />
            </div>

            {/* Per-source XP breakdown — gives the user confidence the
                number isn't pulled out of thin air. */}
            <div style={{
              background: "var(--wf-bg-base)",
              border: "1px solid var(--wf-border)",
              borderRadius: 8,
              padding: 12,
              marginBottom: 14,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              fontSize: 12,
            }}>
              <div style={{ gridColumn: "1 / -1", color: "var(--wf-text-muted)", textTransform: "uppercase", letterSpacing: 0.5, fontSize: 10, marginBottom: 4 }}>
                {t("mrCalcBreakdownTitle")} — {summary.realTotalMasteryXp.toLocaleString()} XP
              </div>
              <div>{t("mrCalcBreakdownItems")}: <strong>{summary.breakdown.items.toLocaleString()}</strong></div>
              <div>{t("mrCalcBreakdownIntrinsics")}: <strong>{summary.breakdown.intrinsics.toLocaleString()}</strong></div>
              <div>{t("mrCalcBreakdownStarChart")}: <strong>{summary.breakdown.starChart.toLocaleString()}</strong></div>
              <div>{t("mrCalcBreakdownJunctions")}: <strong>{summary.breakdown.junctions.toLocaleString()}</strong></div>
            </div>

            <Alert
              type="warning"
              message={t("profileImportConfirmHint")}
              showIcon
              style={{ marginBottom: 14 }}
            />

            <Space style={{ width: "100%", justifyContent: "space-between" }}>
              <Button onClick={reset}>← Back</Button>
              <Button
                type="primary"
                size="large"
                icon={<ImportOutlined />}
                onClick={applyToMastery}
              >
                {t("profileImportConfirm")}
              </Button>
            </Space>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
