import { Empty, Typography } from "antd";
import { SearchOutlined, PlusCircleOutlined, CheckCircleOutlined } from "@ant-design/icons";

const { Text } = Typography;

const icons = {
  search: <SearchOutlined style={{ fontSize: 32, opacity: 0.35 }} />,
  add: <PlusCircleOutlined style={{ fontSize: 32, opacity: 0.35 }} />,
  done: <CheckCircleOutlined style={{ fontSize: 32, opacity: 0.35 }} />,
};

export default function EmptyState({ type = "search", title, description }) {
  return (
    <Empty
      image={icons[type] || Empty.PRESENTED_IMAGE_SIMPLE}
      imageStyle={{ height: 40 }}
      description={
        <div>
          {title && <Text strong style={{ display: "block", marginBottom: 4 }}>{title}</Text>}
          <Text type="secondary">{description}</Text>
        </div>
      }
      style={{ padding: "32px 16px" }}
    />
  );
}
