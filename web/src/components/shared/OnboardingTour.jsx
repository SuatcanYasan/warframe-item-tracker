import { useState, useEffect } from "react";
import { Modal, Button, Progress } from "antd";
import {
  AppstoreAddOutlined,
  GoldOutlined,
  TrophyOutlined,
  BgColorsOutlined,
  ThunderboltFilled,
  CheckCircleOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslate } from "../../hooks/useTranslate";
import { useAppStore } from "../../stores/appStore";

const STORAGE_KEY = "wf-onboarding-tour-seen-v1";

// Feature tour shown once after the WizardModal (which handles
// language/theme). 5 steps highlight what's new and how to use the app.
// Skipped if already seen.
export default function OnboardingTour() {
  const { t } = useTranslate();
  const wizardOpen = useAppStore((s) => s.wizardOpen);
  const updateNotesOpen = useAppStore((s) => s.updateNotesOpen);
  const onboardingDone = useAppStore.getState();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  // Show only after the initial wizard finishes (wizard-driven users)
  // OR for legacy users who completed onboarding earlier but never saw the
  // feature tour. Don't fight the WizardModal/UpdateNotes.
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "true") return;
      if (wizardOpen || updateNotesOpen) return;
      const id = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(id);
    } catch {/* storage blocked */}
  }, [wizardOpen, updateNotesOpen]);

  const steps = [
    {
      icon: <AppstoreAddOutlined />,
      title: t("tourStepCraftTitle"),
      desc: t("tourStepCraftDesc"),
    },
    {
      icon: <GoldOutlined />,
      title: t("tourStepRelicTitle"),
      desc: t("tourStepRelicDesc"),
    },
    {
      icon: <TrophyOutlined />,
      title: t("tourStepMasteryTitle"),
      desc: t("tourStepMasteryDesc"),
    },
    {
      icon: <ThunderboltFilled />,
      title: t("tourStepCommandTitle"),
      desc: t("tourStepCommandDesc"),
    },
    {
      icon: <BgColorsOutlined />,
      title: t("tourStepThemeTitle"),
      desc: t("tourStepThemeDesc"),
    },
  ];

  function finish() {
    try { localStorage.setItem(STORAGE_KEY, "true"); } catch {/* ignore */}
    setOpen(false);
  }

  function next() {
    if (step >= steps.length - 1) finish();
    else setStep((s) => s + 1);
  }

  if (!open) return null;
  const current = steps[step];
  const isLast = step === steps.length - 1;
  const pct = Math.round(((step + 1) / steps.length) * 100);

  return (
    <Modal
      open
      onCancel={finish}
      footer={null}
      width={520}
      classNames={{ content: "onboarding-tour-modal" }}
      closable={false}
      maskClosable={false}
    >
      <div className="onboarding-tour">
        <Progress
          percent={pct}
          showInfo={false}
          size="small"
          strokeColor="var(--wf-primary)"
          trailColor="var(--wf-border)"
        />
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="onboarding-tour-step"
          >
            <div className="onboarding-tour-icon">{current.icon}</div>
            <h2 className="onboarding-tour-title">{current.title}</h2>
            <p className="onboarding-tour-desc">{current.desc}</p>
          </motion.div>
        </AnimatePresence>
        <div className="onboarding-tour-footer">
          <Button type="text" onClick={finish}>{t("tourSkip")}</Button>
          <div className="onboarding-tour-dots">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`onboarding-tour-dot ${i === step ? "active" : ""} ${i < step ? "done" : ""}`}
              />
            ))}
          </div>
          <Button
            type="primary"
            size="large"
            icon={isLast ? <CheckCircleOutlined /> : <ArrowRightOutlined />}
            onClick={next}
          >
            {isLast ? t("tourFinish") : t("tourNext")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
