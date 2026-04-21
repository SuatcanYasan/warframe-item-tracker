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
    version: "2.5.1",
    categories: {
      new: {
        tr: [
          "Farm Planlayici sayfasi eklendi — kaynak adiyla ara, kart olarak takip listene ekle, hedef miktari belirle, drop'lari info modalda gor",
          "Farm Planlayici: birden fazla kaynak ekledigin zaman ayni anda 2+ kaynak dusuren 'En Iyi Ortak Farm Noktalari' sayfada listelenir",
          "Tema editorune Imleç Rengi eklendi — her tema icin ayri cursor rengi, anlik uygulama",
        ],
        en: [
          "Farm Planner page added — search a resource by name, add it as a card, set target quantity, view its drop locations in an info modal",
          "Farm Planner: when tracking multiple resources, 'Best Shared Farming Spots' panel shows locations that drop 2+ of them at once",
          "Theme editor now includes Cursor Color — set a distinct cursor color per theme, applied instantly",
        ],
        de: [
          "Farm-Planner-Seite hinzugefügt — Ressource nach Namen suchen, als Karte hinzufügen, Zielmenge setzen, Drops in einem Info-Modal ansehen",
          "Farm-Planner: Beim Tracken mehrerer Ressourcen zeigt das Panel 'Beste gemeinsame Farm-Spots' Orte, die 2+ davon gleichzeitig fallen lassen",
          "Theme-Editor enthält jetzt Cursor-Farbe — setze pro Theme eine eigene Cursor-Farbe, sofort angewendet",
        ],
        fr: [
          "Page Farm Planner ajoutée — recherche une ressource par nom, ajoute-la comme carte, définis la quantité cible, consulte ses drops dans une modale",
          "Farm Planner : quand plusieurs ressources sont suivies, le panneau 'Meilleurs spots de farm partagés' liste les lieux qui en drop 2+ en même temps",
          "L'éditeur de thème inclut maintenant la Couleur du Curseur — couleur distincte par thème, appliquée instantanément",
        ],
        es: [
          "Página Farm Planner añadida — busca un recurso por nombre, añádelo como tarjeta, fija cantidad objetivo, revisa sus drops en un modal",
          "Farm Planner: al rastrear varios recursos, el panel 'Mejores zonas de farmeo compartidas' lista ubicaciones que sueltan 2+ a la vez",
          "El editor de tema incluye ahora el Color del Cursor — color distinto por tema, aplicado al instante",
        ],
        it: [
          "Pagina Farm Planner aggiunta — cerca una risorsa per nome, aggiungila come scheda, imposta la quantità obiettivo, visualizza i drop in un modal info",
          "Farm Planner: quando tracci più risorse, il pannello 'Migliori spot di farm condivisi' mostra posizioni che ne rilasciano 2+ contemporaneamente",
          "L'editor del tema ora include il Colore del Cursore — colore distinto per tema, applicato all'istante",
        ],
        pt: [
          "Página Farm Planner adicionada — busca um recurso por nome, adiciona como cartão, define a meta, vê os drops num modal de info",
          "Farm Planner: ao rastrear vários recursos, o painel 'Melhores locais de farm compartilhados' mostra locais que dropam 2+ ao mesmo tempo",
          "Editor de tema agora inclui Cor do Cursor — cor distinta por tema, aplicada instantaneamente",
        ],
        ru: [
          "Добавлена страница Farm Planner — ищи ресурс по названию, добавь как карточку, задай цель, смотри дропы в info-модалке",
          "Farm Planner: при отслеживании нескольких ресурсов панель 'Лучшие общие места фарма' показывает локации, где падают 2+ одновременно",
          "Редактор тем теперь включает Цвет Курсора — отдельный цвет для каждой темы, применяется мгновенно",
        ],
        ja: [
          "Farm Planner ページ追加 — リソースを名前で検索、カードとして追加、目標数を設定、ドロップ場所を info モーダルで確認",
          "Farm Planner: 複数リソースを追跡中、2つ以上同時にドロップする場所を「おすすめの共通ファームスポット」パネルに一覧表示",
          "テーマエディタにカーソルカラー追加 — テーマごとに異なるカーソル色、即時適用",
        ],
        ar: [
          "إضافة صفحة Farm Planner — ابحث عن مورد بالاسم، أضفه كبطاقة، حدد الكمية الهدف، اعرض مواقع الإسقاط في نافذة معلومات",
          "Farm Planner: عند تتبع عدة موارد، تعرض لوحة 'أفضل نقاط الفارم المشتركة' المواقع التي تُسقط 2+ منها في نفس الوقت",
          "محرر السمات يتضمن الآن لون المؤشر — لون مميز لكل سمة، يُطبق فورًا",
        ],
      },
      improve: {
        tr: [
          "Sidebar ve mobil menüdeki Zamanlayicilar, Aktiviteler ve Kontrol Listesi ikonlari Warframe wiki tematik setiyle degistirildi (IconTimer, IconAllyDown, IconQuest)",
          "Farm Planlayici: Cache lokasyonlarini gostermeyi/gizlemeyi secen toggle — cache bulmayi sevmiyorsan kapat, sadece normal drop'lari gor",
          "Img onError davranislari tek paylasilan utility fonksiyonuna tasindi — kod tekrari azaltildi",
        ],
        en: [
          "Sidebar and mobile menu icons for Timers, Activities and Checklist swapped for Warframe wiki themed ones (IconTimer, IconAllyDown, IconQuest)",
          "Farm Planner: toggle to show/hide cache locations — turn it off if you prefer only standard mission drops",
          "Image onError handlers moved to a single shared utility — less duplicated boilerplate across components",
        ],
        de: [
          "Sidebar- und Mobile-Menü-Icons für Timer, Aktivitäten und Checkliste durch Warframe-Wiki-Themen-Icons ersetzt (IconTimer, IconAllyDown, IconQuest)",
          "Farm-Planner: Toggle zum Ein-/Ausblenden von Cache-Orten — deaktiviere ihn, wenn du nur Standard-Mission-Drops sehen willst",
          "Image-onError-Handler wurden in eine einzige geteilte Utility verlegt — weniger duplizierter Boilerplate-Code",
        ],
        fr: [
          "Icônes de la sidebar et du menu mobile pour Timers, Activités et Checklist remplacées par celles du wiki Warframe (IconTimer, IconAllyDown, IconQuest)",
          "Farm Planner : toggle pour afficher/masquer les lieux avec caches — désactive-le si tu préfères uniquement les drops des missions standards",
          "Les handlers onError des images ont été regroupés dans un utilitaire partagé — moins de code dupliqué",
        ],
        es: [
          "Iconos de la barra lateral y el menú móvil para Timers, Actividades y Checklist cambiados por los del wiki de Warframe (IconTimer, IconAllyDown, IconQuest)",
          "Farm Planner: interruptor para mostrar/ocultar ubicaciones de cache — apágalo si prefieres solo los drops de misiones estándar",
          "Los handlers onError de imágenes se movieron a una única utilidad compartida — menos código duplicado",
        ],
        it: [
          "Icone della sidebar e del menu mobile per Timer, Attività e Checklist sostituite con quelle dal wiki di Warframe (IconTimer, IconAllyDown, IconQuest)",
          "Farm Planner: interruttore per mostrare/nascondere le posizioni cache — disattivalo se preferisci solo i drop delle missioni standard",
          "Gli handler onError delle immagini sono stati spostati in una singola utility condivisa — meno codice duplicato",
        ],
        pt: [
          "Ícones da sidebar e do menu móvel para Timers, Atividades e Checklist trocados pelos do wiki do Warframe (IconTimer, IconAllyDown, IconQuest)",
          "Farm Planner: interruptor para mostrar/ocultar locais com cache — desativa-o se preferires apenas drops de missões normais",
          "Os handlers onError de imagens foram movidos para uma única utility partilhada — menos código duplicado",
        ],
        ru: [
          "Иконки боковой панели и мобильного меню для 'Таймеры', 'Активности' и 'Чеклист' заменены на иконки из вики Warframe (IconTimer, IconAllyDown, IconQuest)",
          "Farm Planner: переключатель показа/скрытия локаций с тайниками — отключи, если хочешь видеть только дропы обычных миссий",
          "Обработчики onError изображений перенесены в одну общую утилиту — меньше дублирования кода",
        ],
        ja: [
          "サイドバーとモバイルメニューの「タイマー」「アクティビティ」「チェックリスト」アイコンを Warframe wiki テーマ（IconTimer、IconAllyDown、IconQuest）に置換",
          "Farm Planner: Cache の場所の表示/非表示トグル — 通常のミッションドロップのみ見たい場合はオフに",
          "画像 onError ハンドラを1つの共有ユーティリティに統合 — コード重複を削減",
        ],
        ar: [
          "تم استبدال أيقونات الشريط الجانبي والقائمة للجوال الخاصة بالمؤقتات والأنشطة وقائمة التحقق بأيقونات من ويكي Warframe (IconTimer وIconAllyDown وIconQuest)",
          "Farm Planner: مفتاح إظهار/إخفاء مواقع الكاش — أوقفه إذا كنت تفضل رؤية drops المهام العادية فقط",
          "تم نقل معالجات onError للصور إلى أداة مساعدة مشتركة واحدة — تقليل تكرار الكود",
        ],
      },
      fix: {
        tr: [
          "Farm Planlayici: ayni kaynak ayni lokasyonda birden fazla rarity ile gozuktugunde (Argon Crystal Rot C: Uncommon 19.36% + Rare 3.76%) artik tek girdiye cevriliyor — en yuksek chance'lisi",
          "Farm Planlayici: event ve enemy drop'lari (Hallowed Flame, Corrupted Vor gibi) ortak farm listesinden cikarildi, sadece gercek planet/node mission'lari listelenir",
          "Custom cursor rengi degistirildikten sonra tarayici eski cursor bitmap'ini cache'liyordu — simdi aninda guncelliyor",
        ],
        en: [
          "Farm Planner: when the same resource has multiple rarity entries at the same location (e.g. Argon Crystal Rot C: Uncommon 19.36% + Rare 3.76%), they now collapse to a single entry with the highest chance",
          "Farm Planner: event and enemy drops (like Hallowed Flame, Corrupted Vor) are now filtered out of the shared-farm list — only real planet/node mission locations are shown",
          "After changing the custom cursor color, the browser was still caching the old cursor bitmap — now refreshes instantly",
        ],
        de: [
          "Farm-Planner: Wenn dieselbe Ressource mehrere Rarity-Einträge am selben Ort hat (z.B. Argon Crystal Rot C: Uncommon 19.36% + Rare 3.76%), werden sie jetzt zu einem Eintrag mit der höchsten Chance zusammengefasst",
          "Farm-Planner: Event- und Gegner-Drops (wie Hallowed Flame, Corrupted Vor) werden aus der gemeinsamen Farm-Liste gefiltert — nur echte Planet/Node-Mission-Orte werden angezeigt",
          "Nach Änderung der Custom-Cursor-Farbe cachete der Browser noch die alte Cursor-Bitmap — aktualisiert jetzt sofort",
        ],
        fr: [
          "Farm Planner : quand une ressource a plusieurs entrées de rareté au même endroit (ex. Argon Crystal Rot C : Uncommon 19,36% + Rare 3,76%), elles se regroupent en une seule entrée avec la meilleure chance",
          "Farm Planner : les drops d'événements et d'ennemis (comme Hallowed Flame, Corrupted Vor) sont filtrés de la liste partagée — seules les vraies missions planet/node sont affichées",
          "Après changement de la couleur du curseur personnalisé, le navigateur gardait l'ancienne bitmap en cache — rafraîchit maintenant instantanément",
        ],
        es: [
          "Farm Planner: cuando un recurso tiene varias entradas de rareza en la misma ubicación (ej. Argon Crystal Rot C: Uncommon 19.36% + Rare 3.76%), se colapsan en una única entrada con la mejor chance",
          "Farm Planner: los drops de eventos y enemigos (como Hallowed Flame, Corrupted Vor) se filtran de la lista de farmeo compartido — solo se muestran ubicaciones reales planet/node",
          "Tras cambiar el color del cursor personalizado, el navegador seguía cacheando el bitmap viejo — ahora se actualiza al instante",
        ],
        it: [
          "Farm Planner: quando una risorsa ha più voci di rarità nella stessa posizione (es. Argon Crystal Rot C: Uncommon 19.36% + Rare 3.76%), ora vengono ridotte a una singola voce con la chance migliore",
          "Farm Planner: i drop di eventi e nemici (come Hallowed Flame, Corrupted Vor) vengono filtrati dalla lista di farm condiviso — solo le posizioni reali planet/node sono mostrate",
          "Dopo aver cambiato il colore del cursore personalizzato, il browser stava ancora cachando la vecchia bitmap — ora si aggiorna all'istante",
        ],
        pt: [
          "Farm Planner: quando um recurso tem várias entradas de raridade no mesmo local (ex. Argon Crystal Rot C: Uncommon 19,36% + Rare 3,76%), agora são reduzidas a uma única entrada com a melhor chance",
          "Farm Planner: drops de eventos e inimigos (como Hallowed Flame, Corrupted Vor) são filtrados da lista partilhada — apenas locais reais planet/node são mostrados",
          "Após mudar a cor do cursor personalizado, o browser ainda estava a cachear o bitmap antigo — agora atualiza instantaneamente",
        ],
        ru: [
          "Farm Planner: когда у одного ресурса есть несколько записей редкости в одной локации (напр. Argon Crystal Rot C: Uncommon 19.36% + Rare 3.76%), они теперь схлопываются в одну запись с наибольшим шансом",
          "Farm Planner: event- и enemy-дропы (например Hallowed Flame, Corrupted Vor) отфильтрованы из общего списка фарма — показываются только реальные planet/node локации",
          "После изменения цвета кастомного курсора браузер всё ещё кешировал старый bitmap — теперь обновляется мгновенно",
        ],
        ja: [
          "Farm Planner: 同じリソースが同じ場所で複数のレアリティで出ていた時（例: Argon Crystal Rot C: Uncommon 19.36% + Rare 3.76%）、最高 chance を持つ1件にまとめて表示",
          "Farm Planner: イベントや敵のドロップ（Hallowed Flame、Corrupted Vor 等）を共通ファームリストから除外 — 実際の planet/node ミッションのみ表示",
          "カスタムカーソルの色を変更した後、ブラウザが古いカーソル bitmap をキャッシュしていた問題 — 即時に更新されるように",
        ],
        ar: [
          "Farm Planner: عندما يكون لنفس المورد عدة إدخالات ندرة في نفس الموقع (مثل Argon Crystal Rot C: Uncommon 19.36% + Rare 3.76%)، يتم دمجها الآن في إدخال واحد بأعلى فرصة",
          "Farm Planner: تم تصفية إسقاطات الأحداث والأعداء (مثل Hallowed Flame و Corrupted Vor) من قائمة الفارم المشتركة — تُعرض فقط مواقع planet/node الحقيقية للمهام",
          "بعد تغيير لون المؤشر المخصص، كان المتصفح لا يزال يخزن bitmap المؤشر القديم — الآن يتحدث فورًا",
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
