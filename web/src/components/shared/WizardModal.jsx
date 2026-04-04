import { useState } from "react";
import { Modal, Button } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import {
  RocketOutlined,
  GlobalOutlined,
  BgColorsOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { themeOptions } from "../../constants/themes";
import { useTranslate } from "../../hooks/useTranslate";
import { useAppStore } from "../../stores/appStore";

export default function WizardModal() {
  const { t } = useTranslate();
  const open = useAppStore((s) => s.wizardOpen);
  const closeWizard = useAppStore((s) => s.closeWizard);
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const themeName = useAppStore((s) => s.themeName);
  const setThemeName = useAppStore((s) => s.setThemeName);
  const setCustomThemeTokens = useAppStore((s) => s.setCustomThemeTokens);

  const [step, setStep] = useState(0);

  const steps = [
    {
      id: "welcome",
      icon: <RocketOutlined />,
      title: t("wizardWelcomeTitle"),
      description: t("wizardWelcomeDesc"),
    },
    {
      id: "language",
      icon: <GlobalOutlined />,
      title: t("wizardLanguageTitle"),
      description: t("wizardLanguageDesc"),
    },
    {
      id: "theme",
      icon: <BgColorsOutlined />,
      title: t("wizardThemeTitle"),
      description: t("wizardThemeDesc"),
    },
    {
      id: "ready",
      icon: <CheckCircleOutlined />,
      title: t("wizardReadyTitle"),
      description: t("wizardReadyDesc"),
    },
  ];

  const current = steps[step];
  const isFirst = step === 0;
  const isLast = step === steps.length - 1;

  function handleNext() {
    if (isLast) {
      closeWizard();
    } else {
      setStep(step + 1);
    }
  }

  function handleBack() {
    if (!isFirst) setStep(step - 1);
  }

  function handleSkip() {
    closeWizard();
  }

  function handleThemeSelect(value) {
    setThemeName(value);
    setCustomThemeTokens(themeOptions[value].token);
  }

  return (
    <Modal
      open={open}
      footer={null}
      closable={false}
      maskClosable={false}
      centered
      width={480}
      className="wizard-modal"
    >
      <div className="wizard-container">
        {/* Progress bar */}
        <div className="wizard-progress">
          {steps.map((s, i) => (
            <div
              key={s.id}
              className={`wizard-progress-pill ${i <= step ? "active" : ""}`}
            />
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="wizard-content"
          >
            <div className="wizard-icon-box">{current.icon}</div>

            <h2 className="wizard-title">{current.title}</h2>
            <p className="wizard-description">{current.description}</p>

            {/* Step-specific content */}
            {current.id === "language" && (
              <div className="wizard-options">
                {[
                  { value: "tr", label: "Türkçe", sub: "TR" },
                  { value: "en", label: "English", sub: "EN" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    className={`wizard-option ${language === opt.value ? "selected" : ""}`}
                    onClick={() => setLanguage(opt.value)}
                  >
                    <div className="wizard-option-label">{opt.label}</div>
                    <div className="wizard-option-sub">{opt.sub}</div>
                  </button>
                ))}
              </div>
            )}

            {current.id === "theme" && (
              <div className="wizard-theme-grid">
                {Object.entries(themeOptions).map(([key, opt]) => (
                  <button
                    key={key}
                    className={`wizard-theme-card ${themeName === key ? "selected" : ""}`}
                    onClick={() => handleThemeSelect(key)}
                    style={{
                      "--preview-primary": opt.token.colorPrimary,
                      "--preview-bg": opt.token.colorBgContainer,
                      "--preview-border": opt.token.colorBorder,
                    }}
                  >
                    <div className="wizard-theme-preview">
                      <div className="wizard-theme-swatch primary" />
                      <div className="wizard-theme-swatch bg" />
                      <div className="wizard-theme-swatch border" />
                    </div>
                    <div className="wizard-theme-label">{opt.label}</div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Actions */}
        <div className="wizard-actions">
          {!isFirst && (
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
              className="wizard-btn-back"
            >
              {t("wizardBack")}
            </Button>
          )}
          <Button
            type="primary"
            onClick={handleNext}
            className="wizard-btn-next"
            icon={isLast ? null : <ArrowRightOutlined />}
            iconPosition="end"
          >
            {isLast ? t("wizardStart") : t("wizardNext")}
          </Button>
        </div>

        {/* Skip link (only on welcome step) */}
        {isFirst && (
          <button className="wizard-skip" onClick={handleSkip}>
            {t("wizardSkip")}
          </button>
        )}
      </div>
    </Modal>
  );
}
