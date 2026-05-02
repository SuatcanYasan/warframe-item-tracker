import { useEffect, useState } from "react";

export interface CountdownResult {
  label: string;
  seconds: number;
  expired: boolean;
}

// Returns formatted countdown string "Xh Ym Zs" (or "Expired")
// and the raw seconds remaining. Re-renders once per second.
export function useCountdown(expiry: string | number | Date | null | undefined): CountdownResult {
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  if (!expiry) return { label: "—", seconds: 0, expired: true };
  const diff = new Date(expiry).getTime() - now;
  if (diff <= 0) return { label: "Expired", seconds: 0, expired: true };

  const s = Math.floor(diff / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0 || h > 0) parts.push(`${m}m`);
  parts.push(`${sec}s`);
  return { label: parts.join(" "), seconds: s, expired: false };
}

interface CountdownProps {
  expiry: string | number | Date | null | undefined;
  className?: string;
}

export function Countdown({ expiry, className }: CountdownProps) {
  const { label, expired } = useCountdown(expiry);
  return <span className={`${className || ""} ${expired ? "expired" : ""}`}>{label}</span>;
}
