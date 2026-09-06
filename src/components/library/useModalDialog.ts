'use client'

import { useEffect, type RefObject } from 'react'

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
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return

    if (!dialog.open) dialog.showModal()

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
    }
    // `ref` ve `onClose` çağıran tarafta kararlıdır; efekt yalnızca
    // mount/unmount'ta çalışmalıdır (bkz. yukarıdaki not).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
