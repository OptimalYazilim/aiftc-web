'use client'

import { useEffect, useRef, type RefObject } from 'react'

/**
 * MODAL <dialog> KANCASI — TEK KAYNAK
 * ============================================================================
 * Video oynatıcı (MediaDialog) ve fotoğraf galerisi (GalleryLightbox) aynı
 * kabuğu kullanır. Kabuk kodu iki dosyada kopyalanmıyor, çünkü içindeki iki
 * düzeltme de (aşağıda) gözden kaçmaya çok müsait ve bir kopyada unutulursa
 * o modal sessizce bozuk çalışır.
 *
 * NEDEN NATIVE `<dialog>`
 * ---------------------------------------------------------------------------
 * `dialog.showModal()` tarayıcıdan ÜCRETSİZ olarak şunları getirir:
 *   - odak tuzağı (Tab pencerenin dışına çıkmaz)  → WCAG 2.2 — 2.1.2
 *   - üst katman (top layer): z-index yarışı yok
 *   - `aria-modal` ve arka planın erişilebilirlik ağacından çıkarılması
 * Elle yazılan modallarda bunlar tek tek uygulanmak zorundadır ve pratikte
 * en az biri unutulur.
 *
 * ---------------------------------------------------------------------------
 * DÜZELTME 1 — ESCAPE'E GÜVENİLMEZ, GARANTİ ALTINA ALINIR
 * ---------------------------------------------------------------------------
 * Şartnamenin beklentisi: Escape ve dışarı tıklama modalı KAPATIR.
 * Doğal beklenti, `<dialog>`'un bunu kendiliğinden yapması ve `close` olayını
 * yayması; React tarafında `onClose` ile durumu güncellemek yeterli olurdu.
 *
 * ÖLÇÜM BUNU YALANLADI. Temiz bir testle (sayfaya yeni bir `<dialog>` eklenip
 * `showModal()` → `close()` çağrılarak) şu görüldü:
 *     dialog.matches(':modal')  → true   (modal gerçekten açıldı)
 *     dialog.open sonrası       → false  (kapandı)
 *     'close' olayı             → HİÇ TETİKLENMEDİ
 *
 * Sonuç şu felakete yol açıyordu: tarayıcı Escape ile pencereyi kapatıyor,
 * React bunu ÖĞRENEMİYOR, bileşen mount kalıyor ve GÖVDE KAYDIRMA KİLİDİ
 * AÇILMIYOR. Ziyaretçi görünmez bir modalın arkasında kaydıramadığı bir
 * sayfayla kalıyor — görünürde hiçbir hata yok.
 *
 * Bu yüzden kapanış TEK BİR OLAYA BAĞLANMAZ, üç yoldan da yakalanır:
 *   1. `cancel`  → Escape'in standart yolu (bazı ortamlarda gelir)
 *   2. `close`   → kapanışın standart yolu (bazı ortamlarda gelmez)
 *   3. `keydown` → Escape doğrudan dinlenir; ilk ikisi gelmezse bu çalışır
 *
 * `onClose` birden fazla kez çağrılabilir; çağıran taraf durumu `false`
 * yaptığı için bu zararsızdır (idempotent).
 *
 * ---------------------------------------------------------------------------
 * DÜZELTME 2 — STRICTMODE GÖVDE KİLİDİ
 * ---------------------------------------------------------------------------
 * Önceki sürüm kilidi `if (open && !dialog.open)` koşulunun İÇİNDE kuruyordu.
 * React StrictMode geliştirmede efektleri iki kez çalıştırır:
 *     1. çalışma → showModal(), overflow = 'hidden'
 *        temizlik → overflow = ''
 *     2. çalışma → `dialog.open` ARTIK TRUE olduğu için koşul atlanıyor,
 *                  overflow bir daha ASLA kurulmuyor
 * Ölçüm: `document.body.style.overflow` → "" (beklenen "hidden").
 * Kilit artık koşuldan BAĞIMSIZ kurulur; `showModal` çağrısı ayrıca korunur
 * (zaten açık bir dialog'a ikinci kez çağrı hata fırlatır).
 *
 * Önceki değer saklanıp geri yazılır — aynı desen HeaderShell'deki mobil menü
 * kilidinde de kullanılıyor; iki kilit üst üste bindiğinde biri diğerinin
 * değerini silmemelidir.
 *
 * `dialog.close()` temizlikte ÇAĞRILMAZ: eleman DOM'dan çıktığında tarayıcı
 * pencereyi zaten kapatır.
 *
 * ---------------------------------------------------------------------------
 * DÜZELTME 3 — ODAK AÇANA GERİ DÖNMÜYORDU  (Kontrol Listesi 57 · 62 · 63)
 * ---------------------------------------------------------------------------
 * `<dialog>` kapanırken odağı KENDİSİ açan öğeye döndürür — ama bunu yalnızca
 * `dialog.close()` çağrıldığında yapar. Bu kurulumda pencere React tarafından
 * DOM'DAN SÖKÜLEREK kapanıyor; söküldüğünde odaklı öğe de yok oluyor ve odak
 * `<body>`ye düşüyor.
 *
 * Kullanıcı için sonucu şudur: videoyu Escape ile kapatan klavye kullanıcısı,
 * Tab'a bastığında kaldığı yere değil SAYFANIN EN BAŞINA döner ve listeyi
 * baştan geçmek zorunda kalır. Uzun bir kütüphane listesinde bu, pencereyi
 * kapatmayı cezalandırır.
 *
 * Bu yüzden açan öğe açılışta saklanır, kapanışta odak ona geri verilir.
 * Öğe bu arada DOM'dan çıkmış olabilir (liste yeniden çizilmişse):
 * `isConnected` ile bakılır, yoksa odak zorlanmaz.
 *
 * ---------------------------------------------------------------------------
 * DÜZELTME 4 — AÇILIŞTA ODAK PENCERENİN İÇİNE ALINIR
 * ---------------------------------------------------------------------------
 * `showModal()` odağı pencerenin ilk odaklanabilir öğesine taşır; o öğe
 * pencerenin SONUNDAKİ bir bağlantıysa (indirme bağlantısı gibi) ekran
 * okuyucu içeriği ortadan okumaya başlar. Odak açıkça pencerenin KENDİSİNE
 * alınır — `tabIndex={-1}` taşıyan kabuk, başlıktan itibaren okunmasını
 * sağlar ve Tab sırası yine baştan işler.
 *
 * KULLANIM
 * ---------------------------------------------------------------------------
 * Bileşen YALNIZCA açıkken DOM'a girmelidir (ebeveyn koşullu render eder);
 * bu yüzden kanca mount = açılış, unmount = kapanış varsayar.
 * ============================================================================
 */
export const useModalDialog = (
  ref: RefObject<HTMLDialogElement | null>,
  onClose: () => void,
): void => {
  /*
    AÇAN ÖĞE EFEKTİN İÇİNDE DEĞİL, REF'TE TUTULUR — ÖLÇÜLMÜŞ BİR GEREKÇE.

    İlk sürüm `document.activeElement`i efektin içinde yerel bir değişkene
    alıyordu. StrictMode geliştirmede efekti iki kez çalıştırır ve sıra şudur:

        efekt1  → dialog.focus()          odak PENCEREDE
        temizlik1 → acan.focus()          odak tetikleyicide (doğru)
        efekt2  → acan = activeElement    ← bu anda yakalanan değer kararsız

    Ölçüm (2026-09-24, kütüphane künye sayfası): `focus` çağrıları izlendi;
    temizlik1'de TETİK'e dönüş görüldü, ama gerçek kapanışta (Escape) HİÇBİR
    `focus` çağrısı yapılmadı — ikinci efektin yakaladığı değer artık
    tetikleyici değildi ve `isConnected` kapısına takıldı. Kullanıcı için
    sonuç: Escape sonrası odak `<body>`ye düşüyordu.

    `useRef` bileşenin ömrü boyunca TEK KEZ doldurulur; StrictMode'un ikinci
    çalıştırması onu değiştiremez.
  */
  const acanRef = useRef<HTMLElement | null>(null)
  if (acanRef.current === null && typeof document !== 'undefined') {
    const aday = document.activeElement as HTMLElement | null
    /* `<body>` bir tetikleyici değildir; onu saklamak odağı hiçbir yere
       döndürmez ve gerçek tetikleyicinin yerini de kapatırdı. */
    if (aday && aday !== document.body) acanRef.current = aday
  }

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return

    if (!dialog.open) dialog.showModal()

    /*
      Odak pencerenin kabuğuna alınır (DÜZELTME 4). `preventScroll`:
      `<dialog>` zaten üst katmanda ve tam ekrandır; kaydırma isteği arka
      plandaki gövdeyi oynatır ve pencere kapanınca kullanıcı başka bir yerde
      bulur kendini.
    */
    dialog.focus({ preventScroll: true })

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    /** Üç yoldan da aynı yere çıkar (bkz. DÜZELTME 1). */
    const requestClose = () => onClose()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      /*
        `preventDefault` YOK: tarayıcı kendi kapatma davranışını yapabiliyorsa
        yapsın. Buradaki çağrı yalnızca React durumunu güvenceye alır.
      */
      requestClose()
    }

    dialog.addEventListener('cancel', requestClose)
    dialog.addEventListener('close', requestClose)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      dialog.removeEventListener('cancel', requestClose)
      dialog.removeEventListener('close', requestClose)
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow

      /*
        ODAK AÇAN ÖĞEYE GERİ (DÜZELTME 3).
        `isConnected`: liste bu arada yeniden çizilmiş olabilir; kopmuş bir
        öğeye odak vermek sessizce başarısız olur ve odak yine `<body>`de
        kalırdı. Bağlıysa geri verilir, değilse zorlanmaz.
      */
      const acanOge = acanRef.current
      if (acanOge?.isConnected) acanOge.focus({ preventScroll: true })
    }
    // `ref` ve `onClose` çağıran tarafta kararlıdır; efekt yalnızca
    // mount/unmount'ta çalışmalıdır (bkz. yukarıdaki not).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
