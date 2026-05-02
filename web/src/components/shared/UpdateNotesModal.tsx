import type { ReactNode } from "react";
import { Modal } from "antd";
import { RocketOutlined, StarOutlined, ToolOutlined, BugOutlined } from "@ant-design/icons";
import { useTranslate } from "../../hooks/useTranslate";
import { useAppStore, APP_VERSION } from "../../stores/appStore";

type CategoryKey = "new" | "fix" | "improve";

interface CategoryMeta {
  icon: ReactNode;
  // Per-language label, with `en` always required as a fallback.
  [lang: string]: ReactNode | string;
}

// Localized strings keyed by language code (en is the fallback).
type LocalizedStrings = { en: string[]; [lang: string]: string[] };

interface ChangelogEntry {
  version: string;
  categories: Partial<Record<CategoryKey, LocalizedStrings>>;
}

// Category icons & labels
const CAT_META: Record<CategoryKey, CategoryMeta> = {
  new: { icon: <StarOutlined style={{ color: "#22c55e" }} />, tr: "Yenilikler", en: "New Features" },
  fix: { icon: <BugOutlined style={{ color: "#ef4444" }} />, tr: "Hata Duzeltmeleri", en: "Bug Fixes" },
  improve: { icon: <ToolOutlined style={{ color: "#3b82f6" }} />, tr: "Iyilestirmeler", en: "Improvements" },
};

// Only the latest release is shown. Older entries are removed per release.
const CHANGELOG: ChangelogEntry[] = [
  {
    version: "2.6.0",
    categories: {
      new: {
        tr: [
          "Bulut Senkronizasyonu — verilerin artik Supabase uzerinden tum cihazlarinda otomatik senkronize oluyor. Anonim hesap kendiliginden acilir, giris yapma gerekmez",
          "Cihazlar arasi canli guncelleme — bilgisayarinda bir item eklersen telefonunda saniyeler icinde gorunur (Supabase Realtime)",
          "Sekmeler arasi anlik sync — ayni tarayicida 2 sekmede acildiginda degisiklikler anlik yansir (BroadcastChannel)",
        ],
        en: [
          "Cloud Sync — your data now syncs across all your devices automatically via Supabase. Anonymous account is created seamlessly, no login required",
          "Live cross-device updates — add an item on your PC and it appears on your phone within seconds (Supabase Realtime)",
          "Instant multi-tab sync — changes made in one browser tab reflect immediately in other open tabs (BroadcastChannel)",
        ],
        de: [
          "Cloud-Sync — deine Daten werden jetzt automatisch über Supabase auf all deinen Geräten synchronisiert. Anonymer Account wird nahtlos erstellt, kein Login nötig",
          "Live-Updates zwischen Geräten — füge ein Item am PC hinzu und es erscheint innerhalb von Sekunden am Handy (Supabase Realtime)",
          "Sofortiger Multi-Tab-Sync — Änderungen in einem Tab werden in anderen offenen Tabs direkt sichtbar (BroadcastChannel)",
        ],
        fr: [
          "Synchronisation Cloud — tes données se synchronisent maintenant automatiquement sur tous tes appareils via Supabase. Un compte anonyme est créé de façon transparente, aucune connexion requise",
          "Mises à jour live entre appareils — ajoute un item sur ton PC et il apparaît sur ton téléphone en quelques secondes (Supabase Realtime)",
          "Sync multi-onglets instantané — les changements d'un onglet se reflètent immédiatement dans les autres onglets ouverts (BroadcastChannel)",
        ],
        es: [
          "Sincronización en la Nube — tus datos ahora se sincronizan entre todos tus dispositivos vía Supabase. Se crea una cuenta anónima sin fricciones, sin login",
          "Actualizaciones en vivo entre dispositivos — añade un item en tu PC y aparece en tu móvil en segundos (Supabase Realtime)",
          "Sync instantáneo entre pestañas — los cambios en una pestaña se reflejan al instante en otras pestañas abiertas (BroadcastChannel)",
        ],
        it: [
          "Sincronizzazione Cloud — i tuoi dati ora si sincronizzano su tutti i tuoi dispositivi tramite Supabase. Account anonimo creato senza attrito, nessun login richiesto",
          "Aggiornamenti live tra dispositivi — aggiungi un item sul PC e appare sul telefono in pochi secondi (Supabase Realtime)",
          "Sync multi-tab istantaneo — le modifiche in una scheda si riflettono subito nelle altre schede aperte (BroadcastChannel)",
        ],
        pt: [
          "Sincronização na Cloud — os teus dados agora sincronizam em todos os teus dispositivos via Supabase. Conta anónima criada sem fricção, sem login necessário",
          "Atualizações ao vivo entre dispositivos — adiciona um item no PC e aparece no telemóvel em segundos (Supabase Realtime)",
          "Sync instantâneo entre separadores — alterações num separador refletem-se imediatamente em outros separadores abertos (BroadcastChannel)",
        ],
        ru: [
          "Облачная синхронизация — твои данные теперь синхронизируются между всеми устройствами через Supabase. Анонимный аккаунт создаётся автоматически, вход не требуется",
          "Живые обновления между устройствами — добавь предмет на ПК, и он появится на телефоне за секунды (Supabase Realtime)",
          "Мгновенный sync между вкладками — изменения в одной вкладке сразу отображаются в других открытых (BroadcastChannel)",
        ],
        ja: [
          "クラウド同期 — データが Supabase 経由で全デバイスに自動同期されるように。匿名アカウントが自動作成され、ログイン不要",
          "デバイス間ライブ更新 — PC でアイテム追加すると数秒でスマホにも反映（Supabase Realtime）",
          "マルチタブ即時同期 — 1つのタブで行った変更が他の開いているタブに即座に反映（BroadcastChannel）",
        ],
        ar: [
          "مزامنة سحابية — بياناتك الآن تُزامن تلقائيًا بين كل أجهزتك عبر Supabase. حساب مجهول يُنشأ بسلاسة دون الحاجة لتسجيل الدخول",
          "تحديثات حية بين الأجهزة — أضف عنصرًا على الحاسوب ويظهر على الهاتف خلال ثوانٍ (Supabase Realtime)",
          "مزامنة فورية بين التبويبات — التغييرات في تبويب واحد تنعكس فورًا في التبويبات الأخرى المفتوحة (BroadcastChannel)",
        ],
      },
      improve: {
        tr: [
          "Sayfa bazli kod bolme (code splitting) — her sayfa ayri chunk olarak yuklenir, ilk acilista bundle %11 daha kucuk (gzip 367 KB -> 325 KB)",
          "Gorsel lazy loading — ekran disindaki gorseller anında yuklenmiyor, 57 img tag'inde loading='lazy' decoding='async' aktif",
          "HTTP guvenlik baslik'lari (helmet + CSP) — XSS ve clickjacking'e karsi tarayici duzeyinde koruma, Supabase baglantilari whitelist'te",
          "State persistence debounce (300ms) — hizli yazim sirasinda gereksiz localStorage yazimlari engellendi",
        ],
        en: [
          "Route-level code splitting — each page loads as a separate chunk, initial bundle 11% smaller (gzip 367 KB → 325 KB)",
          "Image lazy loading — off-screen images no longer load immediately, 57 img tags with loading='lazy' decoding='async'",
          "HTTP security headers (helmet + CSP) — browser-level XSS and clickjacking defense, Supabase connections whitelisted",
          "State persistence debounce (300ms) — redundant localStorage writes during rapid typing are eliminated",
        ],
        de: [
          "Route-basiertes Code-Splitting — jede Seite lädt als separater Chunk, initiales Bundle 11% kleiner (gzip 367 KB → 325 KB)",
          "Bild-Lazy-Loading — Bilder außerhalb des Sichtfelds werden nicht sofort geladen, 57 img-Tags mit loading='lazy' decoding='async'",
          "HTTP-Sicherheits-Header (helmet + CSP) — Browser-Ebene XSS- und Clickjacking-Schutz, Supabase-Verbindungen auf Whitelist",
          "State-Persistence-Debounce (300ms) — redundante localStorage-Writes bei schnellem Tippen eliminiert",
        ],
        fr: [
          "Code splitting par route — chaque page se charge en chunk séparé, bundle initial 11% plus petit (gzip 367 KB → 325 KB)",
          "Lazy loading des images — les images hors écran ne se chargent plus immédiatement, 57 balises img avec loading='lazy' decoding='async'",
          "En-têtes de sécurité HTTP (helmet + CSP) — défense XSS et clickjacking au niveau du navigateur, connexions Supabase autorisées",
          "Debounce de state persistence (300ms) — écritures localStorage redondantes lors de saisie rapide éliminées",
        ],
        es: [
          "Code splitting por ruta — cada página se carga como chunk separado, bundle inicial 11% más pequeño (gzip 367 KB → 325 KB)",
          "Lazy loading de imágenes — las imágenes fuera de pantalla ya no cargan de inmediato, 57 tags img con loading='lazy' decoding='async'",
          "Cabeceras de seguridad HTTP (helmet + CSP) — defensa XSS y clickjacking a nivel navegador, conexiones Supabase en whitelist",
          "Debounce de persistencia de state (300ms) — escrituras localStorage redundantes durante tipeo rápido eliminadas",
        ],
        it: [
          "Code splitting a livello di route — ogni pagina carica come chunk separato, bundle iniziale 11% più piccolo (gzip 367 KB → 325 KB)",
          "Lazy loading delle immagini — le immagini fuori schermo non caricano subito, 57 tag img con loading='lazy' decoding='async'",
          "Header di sicurezza HTTP (helmet + CSP) — difesa XSS e clickjacking a livello browser, connessioni Supabase in whitelist",
          "Debounce di state persistence (300ms) — scritture localStorage ridondanti durante digitazione rapida eliminate",
        ],
        pt: [
          "Code splitting por rota — cada página carrega como chunk separado, bundle inicial 11% mais pequeno (gzip 367 KB → 325 KB)",
          "Lazy loading de imagens — imagens fora do ecrã já não carregam imediatamente, 57 tags img com loading='lazy' decoding='async'",
          "Cabeçalhos de segurança HTTP (helmet + CSP) — defesa XSS e clickjacking ao nível do browser, ligações Supabase na whitelist",
          "Debounce de state persistence (300ms) — escritas localStorage redundantes durante digitação rápida eliminadas",
        ],
        ru: [
          "Code splitting по маршрутам — каждая страница грузится отдельным chunk'ом, стартовый бандл на 11% меньше (gzip 367 KB → 325 KB)",
          "Lazy loading изображений — изображения вне экрана больше не грузятся сразу, 57 img-тегов с loading='lazy' decoding='async'",
          "HTTP заголовки безопасности (helmet + CSP) — защита от XSS и clickjacking на уровне браузера, соединения Supabase в whitelist",
          "Debounce для state persistence (300ms) — лишние записи в localStorage при быстрой печати устранены",
        ],
        ja: [
          "ルートレベル code splitting — 各ページが独立 chunk としてロードされ、初期バンドル 11% 削減（gzip 367 KB → 325 KB）",
          "画像 lazy loading — 画面外の画像は即ロードされない、57 img タグに loading='lazy' decoding='async'",
          "HTTP セキュリティヘッダ（helmet + CSP）— ブラウザレベルで XSS と clickjacking 防御、Supabase 接続ホワイトリスト化",
          "State persistence debounce（300ms）— 高速入力中の不要な localStorage 書き込みを削減",
        ],
        ar: [
          "تقسيم الكود حسب المسار — كل صفحة تُحمَّل كـ chunk منفصل، حزمة البدء أصغر بنسبة 11% (gzip 367 KB → 325 KB)",
          "التحميل الكسول للصور — الصور خارج الشاشة لا تُحمَّل فورًا، 57 وسم img بـ loading='lazy' decoding='async'",
          "رؤوس أمان HTTP (helmet + CSP) — حماية على مستوى المتصفح من XSS و clickjacking، اتصالات Supabase في القائمة المسموح بها",
          "تقليل كتابات localStorage (300ms) — أثناء الكتابة السريعة، تم إلغاء الكتابات الزائدة",
        ],
      },
      fix: {
        tr: [
          "Cok sekmeli yarış durumu — iki sekmede ayni anda duzenleme yaparken veri kaybi olabiliyordu, artik sekmeler birbirini anlik guncelliyor",
          "Cloud sync self-echo dongusu — kendi yazimini Realtime'dan geri alip push etme ping-pong'u elimine edildi (hash-based diff + bootstrap gate)",
          "Discord Webhook ozelligi kaldirildi — webhook URL'leri localStorage'da acik sekilde tutuluyordu, guvenlik endisesiyle tamamen silindi",
        ],
        en: [
          "Multi-tab race condition — when editing in two tabs simultaneously you could lose data, now tabs sync each other instantly",
          "Cloud sync self-echo loop — the ping-pong of receiving your own Realtime write and re-pushing it was eliminated (hash-based diff + bootstrap gate)",
          "Discord Webhook feature removed — webhook URLs were stored in plaintext localStorage; fully deleted for security reasons",
        ],
        de: [
          "Multi-Tab-Race-Condition — bei gleichzeitigem Bearbeiten in zwei Tabs konnte Daten verloren gehen, jetzt synchronisieren sich Tabs sofort",
          "Cloud-Sync-Self-Echo-Schleife — das Ping-Pong, die eigene Realtime-Schreibaktion zu empfangen und erneut zu pushen, wurde beseitigt (hash-basierter Diff + Bootstrap-Gate)",
          "Discord-Webhook-Feature entfernt — Webhook-URLs wurden im Klartext in localStorage gespeichert; aus Sicherheitsgründen komplett gelöscht",
        ],
        fr: [
          "Race condition multi-onglets — modifier dans deux onglets en même temps pouvait causer une perte de données, les onglets se synchronisent maintenant instantanément",
          "Boucle de self-echo cloud sync — le ping-pong de recevoir sa propre écriture Realtime et de la re-pousser a été éliminé (hash diff + bootstrap gate)",
          "Fonctionnalité Discord Webhook supprimée — les URL de webhook étaient stockées en clair dans localStorage ; supprimée pour raisons de sécurité",
        ],
        es: [
          "Race condition multi-pestañas — al editar en dos pestañas simultáneamente se podía perder datos, ahora las pestañas se sincronizan al instante",
          "Bucle self-echo de cloud sync — el ping-pong de recibir tu propia escritura Realtime y reenviarla fue eliminado (hash diff + bootstrap gate)",
          "Función Discord Webhook eliminada — las URL del webhook se guardaban en texto plano en localStorage; eliminada por motivos de seguridad",
        ],
        it: [
          "Race condition multi-tab — modificando in due tab contemporaneamente si potevano perdere dati, ora le tab si sincronizzano all'istante",
          "Loop self-echo di cloud sync — il ping-pong di ricevere la propria scrittura Realtime e ri-pusharla è stato eliminato (hash diff + bootstrap gate)",
          "Funzione Discord Webhook rimossa — gli URL webhook venivano salvati in chiaro in localStorage; eliminata per motivi di sicurezza",
        ],
        pt: [
          "Race condition multi-separadores — ao editar em dois separadores ao mesmo tempo podias perder dados, agora os separadores sincronizam instantaneamente",
          "Loop self-echo de cloud sync — o ping-pong de receber a própria escrita Realtime e re-enviá-la foi eliminado (hash diff + bootstrap gate)",
          "Funcionalidade Discord Webhook removida — URLs de webhook eram guardadas em texto simples no localStorage; eliminada por motivos de segurança",
        ],
        ru: [
          "Race condition между вкладками — при одновременном редактировании в двух вкладках могли теряться данные, теперь вкладки синхронизируются мгновенно",
          "Self-echo цикл в cloud sync — ping-pong получения собственной Realtime-записи и её повторного отправления был устранён (hash diff + bootstrap gate)",
          "Функция Discord Webhook удалена — webhook URL хранились в localStorage открытым текстом; полностью удалены по соображениям безопасности",
        ],
        ja: [
          "マルチタブ race condition — 2つのタブで同時に編集するとデータを失う可能性があった、今はタブ間で即時同期",
          "Cloud sync self-echo ループ — 自分の Realtime 書き込みを受信して再 push する ping-pong を排除（hash diff + bootstrap gate）",
          "Discord Webhook 機能削除 — webhook URL が localStorage に平文で保存されていた、セキュリティ上の理由で完全削除",
        ],
        ar: [
          "حالة السباق بين التبويبات — عند التعديل في تبويبين في نفس الوقت كان يمكن فقدان البيانات، الآن التبويبات تتزامن فورًا",
          "حلقة الصدى الذاتي في مزامنة السحابة — تم إلغاء التناوب الخاص باستقبال كتابتك في Realtime ثم إعادة إرسالها (hash diff + bootstrap gate)",
          "تمت إزالة ميزة Discord Webhook — كانت روابط webhook تُحفظ نصًا صريحًا في localStorage؛ تم حذفها بالكامل لأسباب أمنية",
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
          if (!texts) return null;
          const items = texts[language] || texts.en;
          if (!items || items.length === 0) return null;
          const meta = CAT_META[catKey as CategoryKey];
          if (!meta) return null;
          const label = (meta[language] as string | undefined) || (meta.en as string);
          return (
            <div key={catKey} className="update-category">
              <div className="update-category-title">{meta.icon} <span>{label}</span></div>
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
