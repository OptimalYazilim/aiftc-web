'use client'

import React, { useId } from 'react'

/**
 * KİMLİK FORMLARININ ORTAK PARÇALARI  (Şartname 13 · Kılavuz 5.2)
 * ============================================================================
 * Giriş ve kayıt ekranları aynı alan ve uyarı biçimini kullanır; ikisinde ayrı
 * yazılsaydı bir tanesindeki erişilebilirlik düzeltmesi ötekine geçmezdi.
 *
 * ---------------------------------------------------------------------------
 * TASARIM — KESKİN, GÖLGESİZ
 * ---------------------------------------------------------------------------
 * Alanlar YUVARLATILMAZ. Sitenin iletişim formu `rounded-card` kullanır;
 * kimlik ekranları bilinçli olarak ondan ayrışır ve editoryal çizgiyi izler:
 * tek 1px çizgi, gölge yok, kavis yok. Odaklandığında çerçeve `shell-900`e
 * koyulur — renk değişimi değil, KONTRAST artışı.
 *
 * ---------------------------------------------------------------------------
 * ERİŞİLEBİLİRLİK
 * ---------------------------------------------------------------------------
 *   - Her alanın GÖRÜNÜR bir `<label>`ı vardır; yer tutucu metin etiket
 *     yerine geçmez (WCAG 3.3.2).
 *   - Hata, alana `aria-describedby` ile BAĞLANIR ve `aria-invalid`
 *     işaretlenir (3.3.1).
 *   - Zorunluluk yıldızla DEĞİL, metinle de belirtilir: yıldız tek başına
 *     ekran okuyucuda anlam taşımaz. Görünür metin GÖREN kullanıcı içindir ve
 *     `aria-hidden` taşır (gerekçe etiketin yanında); yardımcı teknolojiye
 *     zorunluluk `required` + `aria-required` ile bildirilir.
 *   - `focus:outline-none` KULLANILMAZ — genel `:focus-visible` halkası
 *     WCAG 2.4.11/2.4.13 gereğidir ve ezilmemelidir.
 *   - Hedefler ≥44px (2.5.8).
 * ============================================================================
 */

export const AuthField: React.FC<{
  label: string
  name: string
  type?: 'text' | 'email' | 'password'
  value: string
  onChange: (value: string) => void
  required?: boolean
  autoComplete?: string
  hint?: string | null
  error?: string | null
  requiredMark: string
  /**
   * Dışarıdan verilen sabit kimlik. Hata özeti (`FormErrorSummary`) alana
   * `#id` ile bağlantı verebilsin diye eklendi (Kontrol Listesi 105/107):
   * `useId()` her render'da tahmin edilemez bir değer üretir ve özet onu
   * hedefleyemezdi.
   */
  id?: string
}> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  required,
  autoComplete,
  hint,
  error,
  requiredMark,
  id: disId,
}) => {
  const otoId = useId()
  const id = disId ?? otoId
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ')

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-shell-900">
        {label}
        {required ? (
          /*
            `aria-hidden` — ÖLÇÜLMÜŞ BİR OKUMA KUSURU.
            İşaret etiketin İÇİNDE durduğu için erişilebilir isme de giriyordu
            ve isim hesaplaması satır içi öğeler arasına boşluk KOYMAZ (CSS
            `ms-1` yalnızca görsel bir boşluktur). Sonuç, E2E anlık
            görüntüsünde şöyle ölçüldü:

                textbox "E-posta adresi(zorunlu)"

            Ekran okuyucu alanın adını "E-posta adresizorunlu" olarak
            birleştiriyordu. Bilgi kaybı YOK: zorunluluk hem `required` hem
            `aria-required` ile yardımcı teknolojiye ZATEN bildiriliyor
            (aşağıya bakınız), yani işaretin görevi yalnızca GÖREN kullanıcıya
            hitap etmektir — Kontrol Listesi 117 bunu ister ve metin ekranda
            aynen kalır.

            Alternatifler neden seçilmedi:
              · araya boşluk koymak  → ismi düzeltir ama etiketi ~4px kaydırır
              · işareti kaldırmak    → Madde 117'yi ihlal eder
          */
          <span aria-hidden="true" className="ms-1 font-normal text-ink-600">
            {requiredMark}
          </span>
        ) : null}
      </label>

      <input
        id={id}
        name={name}
        type={type}
        value={value}
        required={required}
        /*
          Kontrol Listesi 117: zorunluluk METİNLE de belirtilir (yukarıdaki
          `requiredMark`). O metin `aria-hidden` olduğu için — gerekçe
          yukarıda — zorunluluğu yardımcı teknolojiye taşıyan TEK yol burasıdır:
          `aria-required` durumu bildirir, `required` tarayıcı doğrulamasını
          açar. İkisi birbirinin yerine geçmez ve ikisi de KALDIRILMAMALIDIR.
        */
        aria-required={required || undefined}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={`mt-2 block min-h-12 w-full border bg-surface px-3 text-base text-ink-900 transition-colors duration-300 placeholder:text-ink-500 ${
          error ? 'border-danger-700' : 'border-line-strong focus:border-shell-900'
        }`}
      />

      {hint ? (
        <p id={hintId} className="mt-1.5 text-xs leading-relaxed text-ink-500">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} className="mt-1.5 text-sm font-medium text-danger-700">
          {error}
        </p>
      ) : null}
    </div>
  )
}

/**
 * DURUM BİLDİRİMİ — üç ton.
 * ---------------------------------------------------------------------------
 * `ton` yalnızca RENGİ değiştirir; bilgi rengin kendisinde DEĞİL, başlık
 * metnindedir (WCAG 1.4.1 — renk tek taşıyıcı olamaz). Bu yüzden her
 * bildirimin bir başlığı vardır ve "askıya alındı" ile "onay bekliyor"
 * birbirinden metinle ayrılır, kırmızı/sarı farkıyla değil.
 *
 * Kutular KESKİNDİR ve gölgesizdir; sol kenardaki 2px çizgi tek vurgu
 * öğesidir.
 */
export const AuthNotice: React.FC<{
  ton: 'bilgi' | 'uyari' | 'hata' | 'basari'
  baslik: string
  children: React.ReactNode
  /** Ekran okuyucuya anında duyurulsun mu? Gönderim sonucu için `alert`. */
  rol?: 'alert' | 'status'
}> = ({ ton, baslik, children, rol = 'status' }) => {
  const tonlar = {
    bilgi: 'border-s-line-strong bg-surface-alt',
    uyari: 'border-s-warn-800 bg-badge-warn-bg',
    hata: 'border-s-danger-700 bg-badge-danger-bg',
    basari: 'border-s-success-800 bg-badge-open-bg',
  } as const

  return (
    <div role={rol} className={`border border-line border-s-2 p-5 ${tonlar[ton]}`}>
      <p className="text-sm font-bold text-shell-900">{baslik}</p>
      <div className="mt-1.5 text-sm leading-relaxed text-ink-700">{children}</div>
    </div>
  )
}

/** Birincil düğme — kütüphane künyesindeki aksiyonla aynı biçim. */
export const AUTH_BUTTON =
  'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-sm bg-brand-700 px-6 text-sm font-bold text-white transition-colors duration-300 hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-ink-500 focus-visible:bg-brand-800'
