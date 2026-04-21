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

// Only the latest release is shown. Older entries are removed per release.
const CHANGELOG = [
  {
    version: "2.4.0",
    categories: {
      new: {
        tr: [
          "Amp Sistemi sayfasi eklendi — 5 sekme: Olusturucu, Parca Takibi, MR Takibi, Eidolon Planlayici, Meta Setler",
          "Amp Olusturucu — Prism, Scaffold, Brace sec, kombinasyon kodunu (ornek: 2-7-7) ve toplam malzemeleri gor",
          "Parca Takibi — tracklenen setlerdeki parcalari tek tek isaretle, toplam malzeme listesi ve drop lokasyonlari",
          "Eidolon Planlayici — Teralyst/Gantulyst/Hydrolyst kalkan kirma suresi hesaplamasi",
          "Meta Setler — Warframe toplulugunun onerdigi popüler amp kombinasyonlari",
          "8 yeni arayuz dili eklendi: Almanca, Fransizca, Ispanyolca, Italyanca, Portekizce, Rusca, Japonca, Arapca (toplam 10 dil)",
          "Tarayici dili otomatik algilanir — ilk acilista kullandigin dil varsa secilir",
        ],
        en: [
          "Amp System page added — 5 tabs: Builder, Part Tracker, MR Tracker, Eidolon Planner, Meta Sets",
          "Amp Builder — pick Prism, Scaffold, Brace, view the combination code (e.g. 2-7-7) and total materials",
          "Part Tracker — toggle individual parts in tracked sets, see aggregate materials and drop locations",
          "Eidolon Planner — shield-break time estimates for Teralyst/Gantulyst/Hydrolyst",
          "Meta Sets — popular amp combinations recommended by the Warframe community",
          "8 new UI languages added: German, French, Spanish, Italian, Portuguese, Russian, Japanese, Arabic (10 total)",
          "Browser language is auto-detected on first run",
        ],
        de: [
          "Amp-System-Seite hinzugefügt — 5 Tabs: Builder, Teile-Tracker, MR-Tracker, Eidolon-Planer, Meta-Sets",
          "Amp-Builder — Prism, Scaffold, Brace wählen, Code (z.B. 2-7-7) und Gesamtmaterial sehen",
          "Teile-Tracker — Teile in verfolgten Sets einzeln markieren, Gesamtmaterial und Drop-Orte",
          "Eidolon-Planer — Schild-Brechzeiten für Teralyst/Gantulyst/Hydrolyst",
          "Meta-Sets — beliebte Community-Kombinationen",
          "8 neue Sprachen: Deutsch, Französisch, Spanisch, Italienisch, Portugiesisch, Russisch, Japanisch, Arabisch (insgesamt 10)",
          "Browser-Sprache wird beim ersten Start automatisch erkannt",
        ],
        fr: [
          "Page Système Amp ajoutée — 5 onglets : Builder, Suivi parties, Suivi MR, Planificateur Eidolon, Sets Meta",
          "Amp Builder — choisir Prism, Scaffold, Brace, voir le code (ex. 2-7-7) et les matériaux totaux",
          "Suivi parties — cocher les parties individuellement, matériaux agrégés et lieux de drop",
          "Planificateur Eidolon — estimation du temps pour briser les boucliers Teralyst/Gantulyst/Hydrolyst",
          "Sets Meta — combinaisons populaires de la communauté Warframe",
          "8 nouvelles langues : allemand, français, espagnol, italien, portugais, russe, japonais, arabe (10 au total)",
          "Langue du navigateur détectée automatiquement au premier lancement",
        ],
        es: [
          "Página Sistema Amp añadida — 5 pestañas: Builder, Seguidor de partes, Seguidor MR, Planificador Eidolon, Sets Meta",
          "Amp Builder — elige Prism, Scaffold, Brace, mira el código (ej. 2-7-7) y materiales totales",
          "Seguidor de partes — marca partes una a una, materiales agregados y lugares de drop",
          "Planificador Eidolon — tiempo de rompe-escudo para Teralyst/Gantulyst/Hydrolyst",
          "Sets Meta — combinaciones populares de la comunidad Warframe",
          "8 nuevos idiomas: alemán, francés, español, italiano, portugués, ruso, japonés, árabe (10 en total)",
          "Idioma del navegador detectado automáticamente en el primer inicio",
        ],
        it: [
          "Pagina Sistema Amp aggiunta — 5 tab: Builder, Tracker parti, Tracker MR, Pianificatore Eidolon, Set Meta",
          "Amp Builder — scegli Prism, Scaffold, Brace, vedi codice (es. 2-7-7) e materiali totali",
          "Tracker parti — seleziona parti singolarmente, materiali aggregati e luoghi di drop",
          "Pianificatore Eidolon — tempi rompi-scudo per Teralyst/Gantulyst/Hydrolyst",
          "Set Meta — combinazioni popolari della community Warframe",
          "8 nuove lingue: tedesco, francese, spagnolo, italiano, portoghese, russo, giapponese, arabo (10 totali)",
          "Lingua del browser rilevata automaticamente al primo avvio",
        ],
        pt: [
          "Página do Sistema Amp adicionada — 5 abas: Builder, Rastreador de partes, Rastreador MR, Planejador Eidolon, Sets Meta",
          "Amp Builder — escolha Prism, Scaffold, Brace, veja o código (ex. 2-7-7) e materiais totais",
          "Rastreador de partes — marque partes individualmente, materiais agregados e locais de drop",
          "Planejador Eidolon — tempo de quebra de escudo para Teralyst/Gantulyst/Hydrolyst",
          "Sets Meta — combinações populares da comunidade Warframe",
          "8 novos idiomas: alemão, francês, espanhol, italiano, português, russo, japonês, árabe (10 no total)",
          "Idioma do navegador detectado automaticamente no primeiro início",
        ],
        ru: [
          "Добавлена страница Amp — 5 вкладок: Builder, Трекер частей, Трекер MR, Планировщик Eidolon, Meta-сеты",
          "Amp Builder — выберите Prism, Scaffold, Brace, увидите код (например 2-7-7) и материалы",
          "Трекер частей — отмечайте части по отдельности, общие материалы и места выпадения",
          "Планировщик Eidolon — расчёт времени пробития щита для Teralyst/Gantulyst/Hydrolyst",
          "Meta-сеты — популярные комбинации сообщества Warframe",
          "8 новых языков: немецкий, французский, испанский, итальянский, португальский, русский, японский, арабский (всего 10)",
          "Язык браузера определяется автоматически при первом запуске",
        ],
        ja: [
          "Amp システムページ追加 — 5タブ: Builder、パーツ追跡、MR追跡、Eidolon プランナー、Metaセット",
          "Amp Builder — Prism、Scaffold、Brace を選び、コード (例: 2-7-7) と必要素材を確認",
          "パーツ追跡 — セット内のパーツを個別チェック、素材集計とドロップ場所表示",
          "Eidolon プランナー — Teralyst/Gantulyst/Hydrolyst のシールド破壊時間を計算",
          "Meta セット — Warframe コミュニティ推奨の人気組み合わせ",
          "8つの新しい言語: ドイツ語、フランス語、スペイン語、イタリア語、ポルトガル語、ロシア語、日本語、アラビア語 (計10言語)",
          "初回起動時にブラウザの言語を自動検出",
        ],
        ar: [
          "إضافة صفحة نظام Amp — 5 علامات تبويب: Builder، متتبع الأجزاء، متتبع MR، مخطط Eidolon، مجموعات Meta",
          "Amp Builder — اختر Prism وScaffold وBrace، شاهد الرمز (مثل 2-7-7) وإجمالي المواد",
          "متتبع الأجزاء — حدد الأجزاء واحداً واحداً، المواد المجمعة ومواقع الإسقاط",
          "مخطط Eidolon — حساب وقت كسر الدرع لـ Teralyst/Gantulyst/Hydrolyst",
          "مجموعات Meta — تشكيلات شائعة من مجتمع Warframe",
          "8 لغات جديدة: الألمانية، الفرنسية، الإسبانية، الإيطالية، البرتغالية، الروسية، اليابانية، العربية (10 بالمجموع)",
          "يتم اكتشاف لغة المتصفح تلقائياً عند التشغيل الأول",
        ],
      },
      improve: {
        tr: [
          "Imlec (cursor) artik secili tema rengine gore dinamik olarak degisiyor",
          "Dil secici bayrakli dropdown ile yeniden tasarlandi",
        ],
        en: [
          "Cursor now dynamically matches the selected theme color",
          "Language switcher redesigned as a dropdown with flags",
        ],
        de: [
          "Cursor passt sich jetzt dynamisch der gewählten Theme-Farbe an",
          "Sprachumschalter als Dropdown mit Flaggen neu gestaltet",
        ],
        fr: [
          "Le curseur s'adapte dynamiquement à la couleur du thème",
          "Sélecteur de langue redessiné en dropdown avec drapeaux",
        ],
        es: [
          "El cursor ahora se adapta dinámicamente al color del tema",
          "Selector de idioma rediseñado como dropdown con banderas",
        ],
        it: [
          "Il cursore si adatta dinamicamente al colore del tema",
          "Selettore lingua ridisegnato come dropdown con bandiere",
        ],
        pt: [
          "O cursor agora se adapta dinamicamente à cor do tema",
          "Seletor de idioma redesenhado como dropdown com bandeiras",
        ],
        ru: [
          "Курсор теперь динамически подстраивается под цвет темы",
          "Переключатель языка переработан в дропдаун с флагами",
        ],
        ja: [
          "カーソルがテーマカラーに動的に追従",
          "言語セレクタを旗付きドロップダウンに再設計",
        ],
        ar: [
          "المؤشر يتكيف الآن ديناميكياً مع لون السمة",
          "إعادة تصميم محدد اللغة كقائمة منسدلة مع الأعلام",
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
