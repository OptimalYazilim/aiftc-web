import { getTranslations } from 'next-intl/server'
import React from 'react'

import type { Locale } from '@/i18n/locales'

/**
 * e-DEVLET KUM HAVUZU FORMU
 * ============================================================================
 * NEDEN İSTEMCİ BİLEŞENİ DEĞİL — SAF HTML FORMU
 * ---------------------------------------------------------------------------
 * Bu form, tarayıcının KENDİ gönderimiyle çalışır: `method="post"` ile üst
 * düzey bir gezinme yapar. Bu bilinçli bir tercih:
 *
 *   · Dönüş ucu `Set-Cookie` gönderip yönlendirir. Üst düzey gezinmede
 *     tarayıcı çerezi yazar ve yönlendirmeyi izler — `fetch` kullanılsaydı
 *     yanıtı ayrıca okuyup elle yönlendirmek gerekirdi.
 *   · JavaScript hiç gerekmez. Kum havuzu, uygulamanın en çıplak hâlinde de
 *     çalışmalı: akışı sınarken istemci kodunun bir kusuru sonuca karışmasın.
 *   · Sunucu bileşeni olduğu için istemci paketine tek bayt eklemez; üretimde
 *     sayfa 404 döndüğü için bu kodun oraya hiç gitmemesi doğrudur.
 *
 * ---------------------------------------------------------------------------
 * ERİŞİLEBİLİRLİK — SİTENİN GERİ KALANIYLA AYNI KURALLAR
 * ---------------------------------------------------------------------------
 * Test ekranı da olsa kurallar gevşetilmez; gevşetilirse kalıp olarak
 * kopyalanır. Her alanın görünür `<label>`ı vardır, zorunluluk işareti
 * `aria-hidden`dır ve zorunluluk `required` + `aria-required` ile programatik
 * olarak bildirilir (gerekçe: components/auth/AuthField.tsx).
 * ============================================================================
 */

/**
 * BİÇİM OLARAK GEÇERLİ ÖRNEK KİMLİK NUMARASI.
 *
 * Resmî sağlama algoritmasıyla üretildi (11 hane, 10. ve 11. hane ilk
 * dokuzdan türer) — elde uydurulmuş bir sayı `tcknBicimiGecerli()` denetimini
 * geçemez ve kum havuzu hiç başlamazdı.
 *
 * Kum havuzu HİÇBİR nüfus kaydına bağlanmaz: numara yalnızca biçim denetimine
 * girer ve özetlenir. Yine de alışılmış bir test değeri seçildi; gerçek bir
 * kişinin numarası örnek olarak KULLANILMAMALIDIR.
 */
const ORNEK_TCKN = '10000000078'

const ALAN_SINIFI =
  'mt-2 block min-h-12 w-full border border-line-strong bg-surface px-3 text-base text-ink-900 placeholder:text-ink-500 focus:border-shell-900'

const Alan: React.FC<{
  ad: string
  etiket: string
  zorunluIsaret: string
  tur?: string
  varsayilan?: string
  ipucu?: string
  inputMode?: 'numeric' | 'email' | 'text'
  maxLength?: number
}> = ({ ad, etiket, zorunluIsaret, tur = 'text', varsayilan, ipucu, inputMode, maxLength }) => {
  const id = `edevlet-mock-${ad}`
  const ipucuId = ipucu ? `${id}-ipucu` : undefined

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-shell-900">
        {etiket}
        <span aria-hidden="true" className="ms-1 font-normal text-ink-600">
          {zorunluIsaret}
        </span>
      </label>
      <input
        id={id}
        name={ad}
        type={tur}
        defaultValue={varsayilan}
        required
        aria-required="true"
        aria-describedby={ipucuId}
        inputMode={inputMode}
        maxLength={maxLength}
        className={ALAN_SINIFI}
      />
      {ipucu ? (
        <p id={ipucuId} className="mt-1.5 text-xs leading-relaxed text-ink-500">
          {ipucu}
        </p>
      ) : null}
    </div>
  )
}

export const EdevletMockForm: React.FC<{ locale: Locale; state: string }> = async ({
  locale,
  state,
}) => {
  const t = await getTranslations('edevletMock')
  const ta = await getTranslations('auth')

  return (
    <form action="/api/auth/edevlet/callback" method="post" className="space-y-5">
      {/*
        `state` FORMDA GİZLİ ALAN OLARAK TAŞINIR.
        Değeri doğrulayan taraf sunucudur: dönüş ucu bunu httpOnly çerezdeki
        eşiyle karşılaştırır. İki değerden biri istemcinin JavaScript'ine hiç
        görünmediği için, yalnızca bu tarayıcıda başlamış bir akış
        tamamlanabilir (gerekçe: lib/edevlet.ts).

        Boş gelmesi bir hata DEĞİLDİR: sayfa doğrudan açılmış olabilir. O
        durumda sunucu isteği reddeder ve kullanıcı giriş sayfasına döner —
        karar burada verilmez.
      */}
      <input type="hidden" name="state" value={state} />
      <input type="hidden" name="locale" value={locale} />

      <Alan
        ad="tckn"
        etiket={t('fieldTckn')}
        zorunluIsaret={ta('fieldRequired')}
        varsayilan={ORNEK_TCKN}
        ipucu={t('hintTckn')}
        inputMode="numeric"
        maxLength={11}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Alan ad="ad" etiket={t('fieldFirstName')} zorunluIsaret={ta('fieldRequired')} />
        <Alan ad="soyad" etiket={t('fieldLastName')} zorunluIsaret={ta('fieldRequired')} />
      </div>

      <Alan
        ad="eposta"
        etiket={ta('fieldEmail')}
        zorunluIsaret={ta('fieldRequired')}
        tur="email"
        ipucu={t('hintEmail')}
        inputMode="email"
      />

      <button
        type="submit"
        className="inline-flex min-h-12 w-full items-center justify-center rounded-sm bg-shell-900 px-6 text-sm font-bold text-white hover:bg-shell-800 focus-visible:bg-shell-800"
      >
        {t('submit')}
      </button>
    </form>
  )
}

export default EdevletMockForm
