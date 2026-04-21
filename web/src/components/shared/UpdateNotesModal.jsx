import { Modal } from "antd";
import { RocketOutlined, StarOutlined, ToolOutlined, BugOutlined } from "@ant-design/icons";
import { useTranslate } from "../../hooks/useTranslate";
import { useAppStore, APP_VERSION } from "../../stores/appStore";

// Category icons & labels
const CAT_META = {
  new: { icon: <StarOutlined style={{ color: "#22c55e" }} />, tr: "Yenilikler", en: "New Features" },
  fix: { icon: <BugOutlined style={{ color: "#ef4444" }} />, tr: "Hata Duzeltmeleri", en: "Bug Fixes" },
  improve: { icon: <ToolOutlined style={{ color: "#3b82f6" }} />, tr: "Iyilestirmeler", en: "Improvements" },
};

const CHANGELOG = [
  {
    version: "2.3.0",
    categories: {
      new: {
        tr: [
          "Mobil icin yeni navigasyon tasarimi — alt barda merkez menu butonuyla tum sayfalara hizli erisim",
          "Warframe temali ozel imlecler — butonlarda altin nisangah, metin alanlarinda altin I-beam ve surukleme sirasinda tutma isareti",
          "Warframe oyununun yazi tipi artik projede — Orbitron ve Exo 2 ile sci-fi bir hava",
        ],
        en: [
          "New mobile navigation design — quick access to all pages via the center menu button on the bottom bar",
          "Warframe-themed custom cursors — gold reticle on buttons, gold I-beam in text fields, and a grab handle while dragging",
          "Warframe game fonts now in the project — sci-fi feel with Orbitron and Exo 2",
        ],
      },
      fix: {
        tr: [
          "Lotus (acik) temada mobil menu gorunurluk sorunu giderildi",
          "Scroll rengi artik secilen tema rengine gore degisiyor",
        ],
        en: [
          "Fixed mobile menu visibility issue in Lotus (light) theme",
          "Scroll color now matches the selected theme color",
        ],
      },
      improve: {
        tr: [
          "Mobilde tema editoru ve arama cekmeceleri tam ekran ve okunakli hale geldi",
          "Filtreler ve aksiyon butonlari mobilde duzgun kaydirilabilir pill tasarimina gecti",
          "Mobil menu asagi surukleyerek kapatilabiliyor",
          "Mobilde tema ve dil secicileri menu icinde kolay erisilebilir hale getirildi",
        ],
        en: [
          "Theme editor and search drawers are now full-screen and readable on mobile",
          "Filters and action buttons switched to smooth scrollable pill design on mobile",
          "Mobile menu can be closed by swiping down",
          "Theme and language switchers are now easily accessible inside the mobile menu",
        ],
      },
    },
  },
  {
    version: "2.2.0",
    categories: {
      new: {
        tr: [
          "Craft ve Vault sayfasina toplu secim eklendi — birden fazla esyayi secip tek seferde silebilirsin",
          "Guncelleme notu sistemi eklendi — yeni versiyonlarda neler degisti gorebilirsin",
        ],
        en: [
          "Multi-select added to Craft and Vault pages — select multiple items and remove them at once",
          "Update notes system added — see what changed in new versions",
        ],
      },
      fix: {
        tr: ["Ustalasma sayfasinda esya secerken sayfa artik yukari atlamiyor"],
        en: ["Mastery page no longer scrolls to top when marking items"],
      },
      improve: {
        tr: ["Sayfa altina telif hakki ve gelistirici bilgisi eklendi"],
        en: ["Copyright and developer info added to page footer"],
      },
    },
  },
  {
    version: "2.1.0",
    categories: {
      new: {
        tr: [
          "Ana Sayfa eklendi — tum takiplerini tek ekranda gor",
          "Ustalasma Takibi — sahip oldugun ve ustalasitigiin tum esyalari takip et",
          "Dunya Zamanlayicilari — Cetus, Fortuna, Deimos dongulerini ve Baro Ki'Teer'i canli izle",
          "Ana Sayfada ilerleme grafigi ve dongu bilgileri eklendi",
        ],
        en: [
          "Home page added — see all your tracking progress on one screen",
          "Mastery Tracker — track all items you own and have mastered",
          "World Timers — watch Cetus, Fortuna, Deimos cycles and Baro Ki'Teer live",
          "Progress chart and cycle info added to home page",
        ],
      },
      improve: {
        tr: [
          "Sayfa gecisleri icin yeni kisayollar eklendi (0-5 tuslari)",
          "Windows ve Mac icin kisayol destegi eklendi",
        ],
        en: [
          "New keyboard shortcuts for page navigation (keys 0-5)",
          "Windows and Mac keyboard shortcut support added",
        ],
      },
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
      closable={false}
      maskClosable={false}
      keyboard={false}
      footer={
        <div style={{ textAlign: "center", padding: "4px 0" }}>
          <button className="update-close-btn" onClick={closeUpdateNotes}>{t("updateNotesClose")}</button>
        </div>
      }
      width={520}
      centered
    >
      <div className="update-notes-body">
        <p className="update-notes-intro">{t("updateNotesIntro")}</p>
        {Object.entries(latest.categories).map(([catKey, texts]) => {
          const items = texts[language] || texts.en;
          if (!items || items.length === 0) return null;
          const meta = CAT_META[catKey];
          return (
            <div key={catKey} className="update-category">
              <div className="update-category-title">{meta.icon} <span>{meta[language] || meta.en}</span></div>
              <ul className="update-notes-list">
                {items.map((item, i) => <li key={i} className="update-note-item">{item}</li>)}
              </ul>
            </div>
          );
        })}
        <div className="update-notes-version">v{APP_VERSION}</div>
      </div>
    </Modal>
  );
}
