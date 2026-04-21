import { useState } from "react";
import { Modal, Input, Button, Checkbox, Alert } from "antd";
import { CheckOutlined, DisconnectOutlined, LinkOutlined, SendOutlined } from "@ant-design/icons";
import toast from "react-hot-toast";
import { useTranslate } from "../../hooks/useTranslate";
import { useAppStore } from "../../stores/appStore";
import { sendWebhook, buildTestMessage } from "../../utils/discordWebhook";

export default function DiscordWebhookModal() {
  const { t } = useTranslate();
  const open = useAppStore((s) => s.discordModalOpen);
  const close = useAppStore((s) => s.closeDiscordModal);
  const url = useAppStore((s) => s.discordWebhookUrl);
  const username = useAppStore((s) => s.discordWebhookUsername);
  const events = useAppStore((s) => s.discordWebhookEvents);
  const setUrl = useAppStore((s) => s.setDiscordWebhookUrl);
  const setUsername = useAppStore((s) => s.setDiscordWebhookUsername);
  const setEvents = useAppStore((s) => s.setDiscordWebhookEvents);

  const [testing, setTesting] = useState(false);

  const urlValid = !url || /^https:\/\/(discord\.com|discordapp\.com|ptb\.discord\.com|canary\.discord\.com)\/api\/webhooks\//.test(url);

  async function handleTest() {
    if (!url) {
      toast.error(t("discordNoUrl"));
      return;
    }
    setTesting(true);
    const result = await sendWebhook(url, buildTestMessage(username));
    setTesting(false);
    if (result.ok) {
      toast.success(t("discordTestSent"));
    } else {
      toast.error(`${t("discordTestFailed")}: ${result.reason}`);
    }
  }

  return (
    <Modal
      open={open}
      onCancel={close}
      footer={null}
      title={
        <span>
          <LinkOutlined style={{ marginRight: 8, color: "#5865F2" }} />
          {t("discordModalTitle")}
        </span>
      }
      width={560}
      destroyOnHidden
    >
      <Alert
        type="info"
        showIcon
        message={t("discordInfoTitle")}
        description={t("discordInfoBody")}
        style={{ marginBottom: 16 }}
      />

      <div className="discord-field">
        <label>{t("discordUrlLabel")}</label>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value.trim())}
          placeholder="https://discord.com/api/webhooks/..."
          allowClear
          suffix={url ? (urlValid ? <CheckOutlined style={{ color: "#22C55E" }} /> : <DisconnectOutlined style={{ color: "#EF4444" }} />) : null}
        />
        {url && !urlValid && (
          <div className="discord-field-error">{t("discordUrlInvalid")}</div>
        )}
      </div>

      <div className="discord-field">
        <label>{t("discordUsernameLabel")}</label>
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={t("discordUsernamePlaceholder")}
          maxLength={32}
          allowClear
        />
      </div>

      <div className="discord-field">
        <label>{t("discordEventsLabel")}</label>
        <div className="discord-events-list">
          <Checkbox
            checked={!!events?.ampSetComplete}
            onChange={(e) => setEvents({ ampSetComplete: e.target.checked })}
          >
            🎯 {t("discordEventAmpSet")}
          </Checkbox>
          <Checkbox
            checked={!!events?.craftComplete}
            onChange={(e) => setEvents({ craftComplete: e.target.checked })}
          >
            🔨 {t("discordEventCraftComplete")}
          </Checkbox>
          <Checkbox
            checked={!!events?.relicComplete}
            onChange={(e) => setEvents({ relicComplete: e.target.checked })}
          >
            👑 {t("discordEventRelicComplete")}
          </Checkbox>
          <Checkbox
            checked={!!events?.masteryComplete}
            onChange={(e) => setEvents({ masteryComplete: e.target.checked })}
          >
            ⭐ {t("discordEventMasteryComplete")}
          </Checkbox>
        </div>
      </div>

      <div className="discord-actions">
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleTest}
          loading={testing}
          disabled={!url || !urlValid}
        >
          {t("discordSendTest")}
        </Button>
        <Button onClick={close}>{t("confirmRemoveCancel")}</Button>
      </div>
    </Modal>
  );
}
