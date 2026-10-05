import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { NotFoundContent } from '@/components/layout/NotFoundContent'
import { DEFAULT_LOCALE, isLocale } from '@/i18n/locales'

/**
 * SAYFA BULUNAMADI (404)
 * ============================================================================
 * ÖLÇÜLEN EKSİK (2026-10 denetimi): sitede özel bir 404 sayfası yoktu. Üç
 * dilde de Next.js'in varsayılan sayfası çıkıyordu — İngilizce "This page
 * could not be found.", site menüsü yok, `<html lang>` yok.
 *
 * Bu dosya `[locale]` katmanındadır: `notFound()` çağıran her sayfa (detay
 * sayfaları, kapalı kayıt sayfası…) ve hiçbir rotanın karşılamadığı yollar
 * (`[...rest]/page.tsx`) buraya düşer. Dil katmanının (layout.tsx) İÇİNDE
 * basıldığı için menü, alt bilgi ve `lang` özniteliği sitenin geri kalanıyla
 * aynıdır. HTTP durumu 404 kalır.
 *
 * BAŞLIK `generateMetadata` ile verilir: Next, 404 durumunda bu dosyanın meta
 * verisini okur (next/dist/lib/metadata/resolve-metadata.js → errorConvention).
 * Bileşen içinde `<title>` basmak işe yaramadı; dil katmanının meta verisi
 * başlığı site adına geri yazıyordu.
 *
 * DİL `params`'TAN OKUNUR, `getLocale()` İLE DEĞİL. `getLocale()` istek dilini
 * önbellekte bulamayınca `headers()` okur; statik üretilen rotada bu ÜRETİMDE
 * 500 verdi (ölçüldü). Next bu meta veriyi dil katmanı hata verse bile
 * çözümler (ör. `/documents/x.png` → geçersiz "dil"), bu yüzden geçersiz değer
 * varsayılan dile düşer. Gövde aynı gerekçeyle istemci bileşenidir
 * (components/layout/NotFoundContent.tsx).
 * ============================================================================
 */
export async function generateMetadata({ params }: { params?: Promise<{ locale?: string }> }): Promise<Metadata> {
  const istenen = (await params)?.locale
  const locale = isLocale(istenen) ? istenen : DEFAULT_LOCALE
  const t = await getTranslations({ locale, namespace: 'errors' })
  return { title: t('notFoundTitle'), robots: { index: false, follow: true } }
}

export default function NotFound() {
  return <NotFoundContent />
}
