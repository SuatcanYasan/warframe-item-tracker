// Skeleton screens replace generic spinners during initial fetch.
// Two variants — `card` for item grids and `row` for table-style lists.

const CARD_PULSE_DELAY = 60;

interface SkeletonItemProps {
  delay?: number;
}

function SkeletonCard({ delay = 0 }: SkeletonItemProps) {
  return (
    <div className="skeleton-card" style={{ animationDelay: `${delay}ms` }}>
      <div className="skeleton-card-img skeleton-shimmer" />
      <div className="skeleton-card-line skeleton-shimmer" style={{ width: "85%" }} />
      <div className="skeleton-card-line skeleton-shimmer" style={{ width: "55%", height: 8 }} />
      <div className="skeleton-card-bar skeleton-shimmer" />
    </div>
  );
}

function SkeletonRow({ delay = 0 }: SkeletonItemProps) {
  return (
    <div className="skeleton-row" style={{ animationDelay: `${delay}ms` }}>
      <div className="skeleton-row-icon skeleton-shimmer" />
      <div style={{ flex: 1 }}>
        <div className="skeleton-row-line skeleton-shimmer" style={{ width: "40%" }} />
        <div className="skeleton-row-line skeleton-shimmer" style={{ width: "70%", height: 8, marginTop: 6 }} />
      </div>
    </div>
  );
}

interface Props {
  variant?: "card" | "row";
  count?: number;
}

export default function SkeletonGrid({ variant = "card", count = 8 }: Props) {
  const Item = variant === "row" ? SkeletonRow : SkeletonCard;
  const className = variant === "row" ? "skeleton-row-list" : "skeleton-card-grid";
  return (
    <div className={className} aria-busy="true" aria-live="polite">
      {Array.from({ length: count }).map((_, i) => (
        <Item key={i} delay={i * CARD_PULSE_DELAY} />
      ))}
    </div>
  );
}

interface StatBarProps {
  count?: number;
}

export function SkeletonStatBar({ count = 4 }: StatBarProps) {
  return (
    <div className="skeleton-stat-bar" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-stat-card" style={{ animationDelay: `${i * 80}ms` }}>
          <div className="skeleton-stat-line skeleton-shimmer" style={{ width: "55%" }} />
          <div className="skeleton-stat-line skeleton-shimmer" style={{ width: "35%", height: 24, marginTop: 10 }} />
          <div className="skeleton-stat-line skeleton-shimmer" style={{ width: "100%", height: 6, marginTop: 12, borderRadius: 4 }} />
        </div>
      ))}
    </div>
  );
}
