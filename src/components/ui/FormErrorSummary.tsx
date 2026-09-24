'use client'

import React, { useEffect, useRef } from 'react'

/**
 * FORM HATA ÖZETİ  (Kontrol Listesi 103 · 104 · 105 · 106 · 107)
 * ============================================================================
 * Alan bazlı hata mesajları tek başına yetmez: uzun bir formda ekran okuyucu
 * kullanıcısı hatanın KAÇ TANE ve NEREDE olduğunu ancak formu baştan sona
 * gezerek öğrenir. Bu bileşen hataları formun BAŞINDA, tek bir listede
 * toplar ve her satırı ilgili alana bağlar.
 *
 * Karşıladığı maddeler:
 *   103  Kullanıcı hatayı HEMEN görür — `role="alert"` ve odak buraya taşınır.
 *   104  Hata bölümü vurgulu ve belirgindir.
 *   105  Bağlantılar sayesinde kullanıcı hatalı alana DOĞRUDAN atlayabilir;
 *        araya giren alanları tek tek gezmek zorunda kalmaz.
 *   106  Sayfa başlık çubuğuna hata sayısı yazılır (aşağıdaki `useEffect`).
 *   107  Form, hata mesajları LİSTESİYLE birlikte yeniden gösterilir.
 *
 * ---------------------------------------------------------------------------
 * RENK TEK TAŞIYICI DEĞİLDİR  (44 · 47 · WCAG 1.4.1)
 * ---------------------------------------------------------------------------
 * Kırmızı kenarlık yalnızca bir vurgudur; bilginin kendisi başlıkta ve liste
 * metnindedir ("2 alan düzeltilmeli"). Renk körü bir kullanıcı ya da renkleri
 * bastıran bir tema, hiçbir bilgi kaybetmez.
 *
 * ---------------------------------------------------------------------------
 * ODAK NEDEN ÖZETE TAŞINIYOR, İLK HATALI ALANA DEĞİL
 * ---------------------------------------------------------------------------
 * Doğrudan alana atlamak, kullanıcıya KAÇ hata olduğunu hiç söylemez ve
 * bağlamı bir anda değiştirir. Özet önce durumu bildirir, sonra kullanıcı
 * kendi seçtiği alana gider — 95. maddedeki "odaklanınca bağlam değişmesin"
 * ilkesiyle aynı yöndedir.
 *
 * `tabIndex={-1}`: yalnızca programla odaklanır, Tab sırasına GİRMEZ.
 * ============================================================================
 */

export type FormHatasi = {
  /** Hatalı alanın `id`'si — bağlantı hedefi. */
  alanId: string
  /** Kullanıcıya gösterilecek mesaj. Alan adını İÇERMELİDİR. */
  mesaj: string
}

export const FormErrorSummary: React.FC<{
  hatalar: FormHatasi[]
  baslik: string
  /** Başlık çubuğuna yazılacak metin; `{sayi}` hata adediyle değiştirilir. */
  belgeBasligiSablonu?: string
}> = ({ hatalar, baslik, belgeBasligiSablonu }) => {
  const kutuRef = useRef<HTMLDivElement | null>(null)
  const sayi = hatalar.length

  useEffect(() => {
    if (sayi > 0) kutuRef.current?.focus()
  }, [sayi])

  /*
    MADDE 106 — hata bildirimi BAŞLIK ÇUBUĞUNA da yazılır.
    Sekmeler arasında gezen ya da sayfayı küçültmüş bir kullanıcı, forma
    bakmadan hata olduğunu görür. Hata temizlendiğinde başlık eski hâline
    döner; temizlik `return` içinde garanti altındadır, yoksa başka bir
    sayfaya geçildiğinde "(2 hata)" öneki orada kalırdı.
  */
  useEffect(() => {
    if (typeof document === 'undefined' || !belgeBasligiSablonu) return
    const onceki = document.title
    if (sayi > 0) {
      document.title = `${belgeBasligiSablonu.replace('{sayi}', String(sayi))} — ${onceki}`
    }
    return () => {
      document.title = onceki
    }
  }, [sayi, belgeBasligiSablonu])

  if (sayi === 0) return null

  return (
    <div
      ref={kutuRef}
      role="alert"
      tabIndex={-1}
      className="border border-line border-s-2 border-s-danger-700 bg-badge-danger-bg p-5 outline-none"
    >
      <p className="text-sm font-bold text-shell-900">{baslik}</p>

      {/* Madde 26: liste, liste etiketiyle işaretlenir. */}
      <ul className="mt-2 space-y-1.5 text-sm text-ink-700">
        {hatalar.map((hata) => (
          <li key={hata.alanId}>
            <a
              href={`#${hata.alanId}`}
              className="font-medium text-shell-900 underline underline-offset-4 hover:text-brand-800 focus-visible:text-brand-800"
            >
              {hata.mesaj}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default FormErrorSummary
