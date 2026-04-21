import { useTranslate } from "../../hooks/useTranslate";

export default function AppFooter() {
  const { t } = useTranslate();
  const year = new Date().getFullYear();
  return (
    <footer className="app-footer">
      <span className="footer-text">
        &copy; {year} <a
          href="https://github.com/SuatcanYasan"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
        >Suatcan Yasan</a> — WIT (Warframe Item Tracker)
      </span>
      <span className="footer-divider">|</span>
      <a
        href="https://github.com/SuatcanYasan/warframe-item-tracker"
        target="_blank"
        rel="noopener noreferrer"
        className="footer-link"
      >GitHub</a>
      <span className="footer-divider">|</span>
      <span className="footer-text">{t("footerDisclaimer")}</span>
    </footer>
  );
}
