import { Dropdown, Modal, Button, Avatar } from "antd";
import { UserOutlined, GoogleOutlined, LogoutOutlined, SwapOutlined, SettingOutlined } from "@ant-design/icons";
import { useTranslate } from "../../hooks/useTranslate";
import { useAuthSession } from "../../hooks/useAuthSession";
import { useAppStore } from "../../stores/appStore";
import { signInWithGoogle, linkGoogleIdentity, signOut } from "../../lib/supabaseAuth";

// Header account element.
//
//  - Anonymous session → single "Google ile Giriş Yap" button.
//    Clicking it calls linkIdentity which preserves the current UID and all
//    synced data. Supabase treats a matching Google email as existing user
//    (auto-signin) vs. new (auto-register) transparently.
//
//  - Google-linked session → avatar + name, opens dropdown with:
//      * Hesap Değiştir (switch Google account)
//      * Ayarlar (open theme drawer / settings)
//      * Çıkış Yap (sign out → reload)

export default function AccountMenu() {
  const { t } = useTranslate();
  const { isAnonymous, isAuthenticated, email, name, avatar } = useAuthSession();
  const openThemeDrawer = useAppStore((s) => s.openThemeDrawer);

  // Not ready yet (auth still bootstrapping) → render nothing.
  if (!isAuthenticated) return null;

  // ---- Anonymous: Register (link) + Sign In (OAuth) -------------------------
  // Explicit intent for the user:
  //   - Register: link current anonymous UID to a new Google identity.
  //     Fails with a toast if that Google account is already registered.
  //   - Sign In: plain OAuth into the existing Google-linked account
  //     (creates a fresh one if never seen before).
  if (isAnonymous) {
    return (
      <div style={{ display: "flex", gap: 6 }}>
        <Button size="small" onClick={linkGoogleIdentity}>
          {t("accountRegister")}
        </Button>
        <Button
          type="primary"
          size="small"
          icon={<GoogleOutlined />}
          onClick={signInWithGoogle}
        >
          {t("accountSignIn")}
        </Button>
      </div>
    );
  }

  // ---- Authenticated: avatar + name + dropdown ------------------------------
  const handleSwitch = () => {
    Modal.confirm({
      title: t("accountSwitchTitle"),
      content: t("accountSwitchWarn"),
      okText: t("accountSwitchOk"),
      cancelText: t("accountSwitchCancel"),
      onOk: async () => {
        await signOut();
        await signInWithGoogle();  // prompt: select_account by default
      },
    });
  };

  const handleSignOut = () => {
    Modal.confirm({
      title: t("accountSignOutTitle"),
      content: t("accountSignOutWarn"),
      okText: t("accountSignOutOk"),
      cancelText: t("accountSignOutCancel"),
      onOk: async () => {
        await signOut();
        window.location.reload();
      },
    });
  };

  const avatarNode = avatar
    ? <Avatar size={26} src={avatar} />
    : <Avatar size={26} icon={<UserOutlined />} style={{ backgroundColor: "var(--wf-primary)" }} />;

  const displayName = name || email || t("accountLinkedTitle");

  const menu = {
    items: [
      {
        key: "header",
        label: (
          <div style={{ padding: "4px 0", lineHeight: 1.3 }}>
            <div style={{ fontWeight: 600 }}>{name || t("accountLinkedTitle")}</div>
            {email && <div style={{ fontSize: 11, opacity: 0.7 }}>{email}</div>}
          </div>
        ),
        disabled: true,
      },
      { type: "divider" },
      { key: "switch", label: t("accountSwitchAccount"), icon: <SwapOutlined />, onClick: handleSwitch },
      { key: "settings", label: t("accountSettings"), icon: <SettingOutlined />, onClick: openThemeDrawer },
      { type: "divider" },
      { key: "signout", label: t("accountSignOut"), icon: <LogoutOutlined />, onClick: handleSignOut, danger: true },
    ],
  };

  return (
    <Dropdown menu={menu} trigger={["click"]} placement="bottomRight">
      <button className="account-pill" title={displayName}>
        {avatarNode}
        <span className="account-pill-name">{displayName}</span>
      </button>
    </Dropdown>
  );
}
