import { Flex, Typography } from "antd";
import { GithubOutlined, HeartFilled } from "@ant-design/icons";

const { Text, Link } = Typography;

export default function Footer() {
  return (
    <footer className="app-footer">
      <Flex align="center" justify="center" gap={6} wrap="wrap">
        <Text type="secondary" style={{ fontSize: 12 }}>
          Built with
        </Text>
        <HeartFilled style={{ color: "var(--accent-gold)", fontSize: 11 }} />
        <Text type="secondary" style={{ fontSize: 12 }}>
          by
        </Text>
        <Link
          href="https://github.com/SuatcanYasan"
          target="_blank"
          style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 4 }}
        >
          <GithubOutlined /> SuatcanYasan
        </Link>
        <Text type="secondary" style={{ fontSize: 12 }}>
          · Warframe Craft Tracker
        </Text>
      </Flex>
    </footer>
  );
}
