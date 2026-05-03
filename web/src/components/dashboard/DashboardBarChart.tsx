import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

// Lazy chunk for the dashboard's progress bar chart so recharts isn't
// pulled into the entry bundle. Renders inside a Suspense boundary.
interface BarDatum {
  name: string;
  pct: number;
  fill: string;
}

interface Props {
  data: BarDatum[];
  primaryColor: string;
  tooltipLabel: string;
}

export default function DashboardBarChart({ data, primaryColor, tooltipLabel }: Props) {
  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} margin={{ left: 0, right: 16, top: 8, bottom: 4 }}>
        <XAxis dataKey="name" tick={{ fill: "#94A3B8", fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
        <YAxis type="number" domain={[0, 100]} hide />
        <Tooltip
          formatter={(v) => [`%${v}`, tooltipLabel]}
          contentStyle={{
            background: "#1A1A28",
            border: `1px solid ${primaryColor}33`,
            borderRadius: 8,
            fontSize: 12,
            color: "#E2E8F0",
            boxShadow: `0 4px 16px ${primaryColor}15`,
          }}
          labelStyle={{ color: primaryColor, fontWeight: 600 }}
          itemStyle={{ color: "#E2E8F0" }}
          cursor={{ fill: "rgba(255,255,255,0.06)", radius: 4 }}
        />
        <Bar dataKey="pct" radius={[6, 6, 0, 0]} barSize={32} isAnimationActive animationDuration={800}>
          {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
