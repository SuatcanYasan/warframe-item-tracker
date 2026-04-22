import { useState, useEffect, useMemo } from "react";
import { ClockCircleOutlined, SyncOutlined, ShopOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import { useTranslate } from "../../hooks/useTranslate";
import { requestJson } from "../../utils/helpers";

function useCountdown(expiry) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);
  if (!expiry) return null;
  const diff = new Date(expiry).getTime() - now;
  if (diff <= 0) return "0:00";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

function CycleCard({ title, icon, state, stateLabel, expiry, color, totalMin, accentClass, bgImage }) {
  const countdown = useCountdown(expiry);
  const elapsed = expiry ? Math.max(0, totalMin * 60000 - (new Date(expiry).getTime() - Date.now())) : 0;
  const pct = totalMin > 0 ? Math.min(100, Math.round((elapsed / (totalMin * 60000)) * 100)) : 0;

  return (
    <motion.div className={`timer-card ${accentClass}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={bgImage ? { backgroundImage: `url(${bgImage})` } : undefined}>
      <div className="timer-card-header">
        {icon}
        <span className="timer-card-title">{title}</span>
      </div>
      <div className="timer-state" style={{ color }}>{stateLabel}</div>
      <div className="timer-countdown">{countdown || "—"}</div>
      <div className="timer-progress"><div className="timer-progress-fill" style={{ width: `${pct}%`, background: color }} /></div>
    </motion.div>
  );
}

export default function TimersPage() {
  const { t } = useTranslate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  function fetchTimers() {
    setLoading(true);
    requestJson("/api/timers")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchTimers();
    const iv = setInterval(fetchTimers, 60000);
    return () => clearInterval(iv);
  }, []);

  const cetus = data?.cetus;
  const vallis = data?.vallis;
  const cambion = data?.cambion;
  const baro = data?.voidTrader;

  const baroCountdown = useCountdown(baro?.expiry);
  const baroActive = baro && new Date(baro.activation).getTime() <= Date.now() && new Date(baro.expiry).getTime() > Date.now();
  const baroArrival = useCountdown(baro?.activation);

  return (
    <div className="timers-page">
      <div className="timers-header">
        <ClockCircleOutlined className="timers-header-icon" />
        <div>
          <h2 className="timers-title">{t("timersTitle")}</h2>
          <p className="timers-subtitle">{t("timersSubtitle")}</p>
        </div>
        <button className="timer-refresh" onClick={fetchTimers} title={t("timersRefresh")}>
          <SyncOutlined spin={loading} />
        </button>
      </div>

      {/* World Cycles */}
      <div className="timers-section-title">{t("timersCycles")}</div>
      {!data && loading && (
        <div className="timers-grid">
          {[0,1,2].map((i) => (
            <div key={i} className="timer-card-skeleton">
              <div className="skeleton-line medium" />
              <div className="skeleton-line wide" style={{ height: 20 }} />
              <div className="skeleton-line narrow" style={{ height: 32 }} />
              <div className="skeleton-line wide" style={{ height: 4 }} />
            </div>
          ))}
        </div>
      )}
      <div className="timers-grid">
        {cetus && (
          <CycleCard
            title={t("timersCetus")}
            icon={<span className="timer-emoji">🌍</span>}
            state={cetus.state}
            stateLabel={cetus.isDay ? t("timersDay") : t("timersNight")}
            expiry={cetus.expiry}
            color={cetus.isDay ? "#f59e0b" : "#6366f1"}
            totalMin={cetus.isDay ? 100 : 50}
            accentClass={cetus.isDay ? "accent-day" : "accent-night"}
            bgImage="/Cetus.webp"
          />
        )}
        {vallis && (
          <CycleCard
            title={t("timersFortuna")}
            icon={<span className="timer-emoji">❄️</span>}
            state={vallis.state}
            stateLabel={vallis.isWarm ? t("timersWarm") : t("timersCold")}
            expiry={vallis.expiry}
            color={vallis.isWarm ? "#ef4444" : "#06b6d4"}
            totalMin={vallis.isWarm ? 6.67 : 20}
            accentClass={vallis.isWarm ? "accent-warm" : "accent-cold"}
            bgImage="/Orb_Vallis.webp"
          />
        )}
        {cambion && (
          <CycleCard
            title={t("timersDeimos")}
            icon={<span className="timer-emoji">🔴</span>}
            state={cambion.state}
            stateLabel={cambion.state === "fass" ? "Fass" : "Vome"}
            expiry={cambion.expiry}
            color={cambion.state === "fass" ? "#ef4444" : "#3b82f6"}
            totalMin={cambion.state === "fass" ? 100 : 50}
            accentClass={cambion.state === "fass" ? "accent-fass" : "accent-vome"}
            bgImage="/deimos.webp"
          />
        )}
      </div>

      {/* Baro Ki'Teer */}
      <div className="timers-section-title">{t("timersBaro")}</div>
      <motion.div className="timer-baro-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <img src="/BaroBanner.png" alt="" className="baro-bg-img" loading="lazy" decoding="async" />
        <div className="baro-header">
          <ShopOutlined className="baro-icon" />
          <div className="baro-info">
            <span className="baro-name">Baro Ki'Teer</span>
            <span className="baro-location">{baro?.location || "—"}</span>
          </div>
          <div className="baro-status-wrap">
            {baroActive ? (
              <><span className="baro-status active">{t("timersBaroHere")}</span><span className="baro-countdown">{baroCountdown}</span></>
            ) : (
              <><span className="baro-status away">{t("timersBaroAway")}</span><span className="baro-countdown">{baroArrival}</span></>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
