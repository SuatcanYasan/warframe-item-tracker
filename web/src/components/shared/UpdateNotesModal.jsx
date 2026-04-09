import { Modal } from "antd";
import { RocketOutlined } from "@ant-design/icons";
import { useTranslate } from "../../hooks/useTranslate";
import { useAppStore, APP_VERSION } from "../../stores/appStore";

const CHANGELOG = [
  {
    version: "2.1.0",
    items: {
      tr: [
        "Ana Sayfa eklendi — tum takiplerini tek ekranda gor",
        "Ustalasma Takibi — sahip oldugun ve ustalasitigiin tum esyalari takip et",
        "Dunya Zamanlayicilari — Cetus, Fortuna, Deimos dongulerini ve Baro Ki'Teer'i canli izle",
        "Ana Sayfada ilerleme grafigi ve dongu bilgileri eklendi",
        "Sayfa gecisleri icin yeni kisayollar eklendi (0-5 tuslari)",
        "Windows ve Mac icin kisayol destegi eklendi",
      ],
      en: [
        "Home page added — see all your tracking progress on one screen",
        "Mastery Tracker — track all items you own and have mastered",
        "World Timers — watch Cetus, Fortuna, Deimos cycles and Baro Ki'Teer live",
        "Progress chart and cycle info added to home page",
        "New keyboard shortcuts for page navigation (keys 0-5)",
        "Windows and Mac keyboard shortcut support added",
      ],
    },
  },
];

export default function UpdateNotesModal() {
  const { t, language } = useTranslate();
  const open = useAppStore((s) => s.updateNotesOpen);
  const closeUpdateNotes = useAppStore((s) => s.closeUpdateNotes);

  const latest = CHANGELOG[0];

  return (
    <Modal
      title={
        <div className="update-modal-title">
          <RocketOutlined style={{ color: "var(--wf-primary)", marginRight: 8 }} />
          {t("updateNotesTitle")} — v{latest.version}
        </div>
      }
      open={open}
      onCancel={closeUpdateNotes}
      footer={null}
      width={520}
      centered
    >
      <div className="update-notes-body">
        <p className="update-notes-intro">{t("updateNotesIntro")}</p>
        <ul className="update-notes-list">
          {(latest.items[language] || latest.items.en).map((item, i) => (
            <li key={i} className="update-note-item">{item}</li>
          ))}
        </ul>
        <div className="update-notes-version">v{APP_VERSION}</div>
      </div>
    </Modal>
  );
}
