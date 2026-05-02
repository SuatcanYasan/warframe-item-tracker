import { Typography } from "antd";

const { Title, Paragraph, Text } = Typography;

// Standalone legal page. Reachable at /privacy without auth gating.
// Required by Google OAuth verification + general user transparency.

export default function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "24px 16px 80px", color: "var(--wf-text)" }}>
      <Title level={1} style={{ color: "var(--wf-text)" }}>Privacy Policy</Title>
      <Paragraph style={{ color: "var(--wf-text-muted)" }}>
        <Text strong>Warframe Item Tracker (WIT)</Text> &middot; Last updated: April 2026
      </Paragraph>

      <Title level={2} style={{ color: "var(--wf-text)" }}>1. What is WIT?</Title>
      <Paragraph>
        WIT is a fan-made, non-commercial progress tracker for the game
        Warframe. It lets players record which items they are crafting,
        which Void relics and prime components they own, their Mastery Rank
        progress, operator Amp builds, daily checklists, and farming
        targets. WIT is not affiliated with Digital Extremes Ltd.
      </Paragraph>

      <Title level={2} style={{ color: "var(--wf-text)" }}>2. Data We Collect</Title>
      <Paragraph>We store only what you put into the tracker yourself:</Paragraph>
      <ul>
        <li><Text strong>Tracker state</Text>: selected craft items, completion progress, relic watch list, inventory counts, mastery statuses, amp builds, checklist items, farm targets.</li>
        <li><Text strong>Preferences</Text>: UI language, selected theme, saved theme profiles.</li>
        <li><Text strong>Account identifier</Text>: a randomly generated anonymous UID on first visit. If you choose to link a Google account, we receive your Google email address, name, and profile picture URL (nothing else — no contacts, no calendar, no drive access).</li>
      </ul>
      <Paragraph>
        We do not collect analytics, behavioral tracking, IP addresses,
        advertising identifiers, or device fingerprints. We do not read
        game files or connect to your Warframe account in any way.
      </Paragraph>

      <Title level={2} style={{ color: "var(--wf-text)" }}>3. Where the Data Is Stored</Title>
      <ul>
        <li><Text strong>localStorage</Text> in your browser — for offline-first operation.</li>
        <li><Text strong>Supabase</Text> (PostgreSQL, EU-hosted) — for cross-device sync. Each row is scoped to your UID via row-level security; other users cannot read your data.</li>
      </ul>

      <Title level={2} style={{ color: "var(--wf-text)" }}>4. Third-Party Services</Title>
      <ul>
        <li><Text strong>Supabase</Text> — database, authentication, and realtime sync. Subject to Supabase's privacy policy.</li>
        <li><Text strong>Google OAuth</Text> — optional sign-in provider. Only used if you choose to link a Google account. Subject to Google's privacy policy.</li>
        <li><Text strong>warframestat.us / content.warframe.com</Text> — read-only public APIs for in-game world state (fissures, invasions, timers). No user data is sent.</li>
        <li><Text strong>WFCD (warframe-items)</Text> and <Text strong>wiki.warframe.com</Text> — public item images and metadata. No user data is sent.</li>
      </ul>

      <Title level={2} style={{ color: "var(--wf-text)" }}>5. Cookies &amp; Local Storage</Title>
      <Paragraph>
        WIT uses browser localStorage to store your tracker state and, when
        signed in, a Supabase session token. No third-party advertising or
        analytics cookies are set.
      </Paragraph>

      <Title level={2} style={{ color: "var(--wf-text)" }}>6. Your Rights &amp; Data Deletion</Title>
      <ul>
        <li><Text strong>Export</Text>: in-app URL Share or JSON export gives you a copy of your state.</li>
        <li><Text strong>Sign out</Text>: clears the local session; cloud data remains accessible on next sign-in.</li>
        <li><Text strong>Delete</Text>: request account deletion by emailing the address below. Supabase cascades the delete across all tables tied to your UID.</li>
      </ul>

      <Title level={2} style={{ color: "var(--wf-text)" }}>7. Children</Title>
      <Paragraph>
        WIT is not directed at children under 13 and does not knowingly
        collect data from them.
      </Paragraph>

      <Title level={2} style={{ color: "var(--wf-text)" }}>8. Changes to This Policy</Title>
      <Paragraph>
        Material changes will be announced in the app's Update Notes modal.
        The "Last updated" date above indicates the current version.
      </Paragraph>

      <Title level={2} style={{ color: "var(--wf-text)" }}>9. Contact</Title>
      <Paragraph>
        Questions or data requests: email the maintainer at{" "}
        <a href="mailto:suatcanysn@gmail.com" style={{ color: "var(--wf-primary)" }}>suatcanysn@gmail.com</a>.
      </Paragraph>

      <Title level={2} style={{ color: "var(--wf-text)" }}>10. Trademark Notice</Title>
      <Paragraph style={{ color: "var(--wf-text-muted)", fontSize: 13 }}>
        Warframe and all related trademarks belong to Digital Extremes Ltd.
        WIT is a fan-made tool and is not affiliated with, endorsed by, or
        sponsored by Digital Extremes.
      </Paragraph>
    </div>
  );
}
