import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

// Recharts is ~80 KB gzip. By isolating every chart in its own module
// and consuming via `lazy(() => import('./ProgressDonut'))`, recharts
// gets pulled into a separate chunk that's only fetched when a chart
// actually renders — keeping it out of the initial critical path.
interface Props {
  percent: number;
  size?: number;
  innerRadius?: number;
  outerRadius?: number;
  primaryColor?: string;
  showLabel?: boolean;
}

export default function ProgressDonut({
  percent,
  size = 72,
  innerRadius = 24,
  outerRadius = 34,
  primaryColor = "var(--wf-primary)",
  showLabel = true,
}: Props) {
  const safe = Math.max(0, Math.min(100, percent));
  const data = [
    { name: "done", value: safe },
    { name: "remaining", value: 100 - safe },
  ];
  return (
    <div style={{ width: size, height: size, position: "relative" }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
            isAnimationActive
          >
            <Cell fill={primaryColor} />
            <Cell fill="color-mix(in srgb, var(--wf-text) 10%, transparent)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {showLabel && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: size > 60 ? 14 : 11,
            fontWeight: 700,
            color: primaryColor,
            fontFamily: "var(--font-mono, monospace)",
          }}
        >
          %{percent}
        </div>
      )}
    </div>
  );
}
