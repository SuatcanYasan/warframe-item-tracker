import { Typography } from "antd";

const { Title, Paragraph, Text } = Typography;

// Standalone legal page. Reachable at /terms without auth gating.

export default function TermsOfService() {
  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "24px 16px 80px", color: "var(--wf-text)" }}>
      <Title level={1} style={{ color: "var(--wf-text)" }}>Terms of Service</Title>
      <Paragraph style={{ color: "var(--wf-text-muted)" }}>
        <Text strong>Warframe Item Tracker (WIT)</Text> &middot; Last updated: April 2026
      </Paragraph>

      <Title level={2} style={{ color: "var(--wf-text)" }}>1. Acceptance</Title>
      <Paragraph>
        By using WIT you agree to these terms. If you disagree, please don't
        use the app.
      </Paragraph>

      <Title level={2} style={{ color: "var(--wf-text)" }}>2. The Service</Title>
      <Paragraph>
        WIT is a free, fan-made, non-commercial companion app for the game
        Warframe. It tracks user-entered progress (craft items, relics,
        mastery, amps, etc.). It is provided <Text strong>"as is"</Text>,
        without warranties of any kind, with no guarantee of uptime, data
        retention, or feature continuity.
      </Paragraph>

      <Title level={2} style={{ color: "var(--wf-text)" }}>3. User Accounts</Title>
      <ul>
        <li>Account creation is optional — anonymous use is supported.</li>
        <li>If you link a Google account, you represent that it belongs to you.</li>
        <li>We may terminate accounts that abuse the service (e.g., automated spam, circumvention of rate protections, or exploitation of other users' data through attempted RLS bypass).</li>
      </ul>

      <Title level={2} style={{ color: "var(--wf-text)" }}>4. Your Content</Title>
      <Paragraph>
        You retain ownership of the tracker state you create. By using WIT
        you grant us a limited license to store and display that data back
        to you and to sync it between your devices via Supabase.
      </Paragraph>

      <Title level={2} style={{ color: "var(--wf-text)" }}>5. Acceptable Use</Title>
      <Paragraph>You agree not to:</Paragraph>
      <ul>
        <li>Attempt to access other users' data or bypass row-level security.</li>
        <li>Reverse engineer, scrape, or automate the app in ways that degrade service for others.</li>
        <li>Upload illegal, abusive, or infringing content into shareable fields (e.g., checklist item text).</li>
        <li>Use the app for commercial resale or repackaging.</li>
      </ul>

      <Title level={2} style={{ color: "var(--wf-text)" }}>6. Third-Party Content</Title>
      <Paragraph>
        Warframe item data comes from public community sources (WFCD) and
        public APIs (warframestat.us, content.warframe.com,
        wiki.warframe.com). We don't own this data. Trademarks belong to
        their owners, including Digital Extremes Ltd.
      </Paragraph>

      <Title level={2} style={{ color: "var(--wf-text)" }}>7. Disclaimer of Warranties</Title>
      <Paragraph>
        WIT is provided without any express or implied warranty. Drop rates,
        timers, and item data may be inaccurate. Use at your own risk. We
        are not responsible for in-game time lost following WIT's
        suggestions.
      </Paragraph>

      <Title level={2} style={{ color: "var(--wf-text)" }}>8. Limitation of Liability</Title>
      <Paragraph>
        To the maximum extent permitted by law, WIT and its maintainer are
        not liable for any indirect, incidental, or consequential damages
        arising from use of the app.
      </Paragraph>

      <Title level={2} style={{ color: "var(--wf-text)" }}>9. Changes</Title>
      <Paragraph>
        These terms may change over time. Material changes will be
        announced in the app's Update Notes modal.
      </Paragraph>

      <Title level={2} style={{ color: "var(--wf-text)" }}>10. Contact</Title>
      <Paragraph>
        Questions: <a href="mailto:suatcanysn@gmail.com" style={{ color: "var(--wf-primary)" }}>suatcanysn@gmail.com</a>.
      </Paragraph>
    </div>
  );
}
