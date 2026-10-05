import { DEFAULT_LOCALE, type Locale } from '@/i18n/locales'

/**
 * ÇEVRİLMEMİŞ KAYDIN DETAY ADRESİ — slug çözümleme kararı
 * ============================================================================
 * ÖLÇÜLEN HATA (2026-10-01 denetimi): yalnızca Türkçe girilmiş bir kayıt
 * EN/RU liste sayfalarında görünüyor, tıklanınca 404 veriyordu.
 *
 *   Liste  → `fallback: true` ile okunur; o dilde slug yoksa TÜRKÇE slug'ı
 *            basar: /en/training-programmes/uluslararasi-entegre-yangin-yonetimi
 *   Detay  → slug'ı yalnızca İSTENEN dilde arardı. Payload yedek dili
 *            okumada uygular, SORGUDA (where) uygulamaz → kayıt bulunamaz → 404.
 *
 * Bu modül, detay sayfası slug'ı istenen dilde bulamadığında ne yapılacağına
 * karar verir. Kayıt `locale: 'all'` ile, HERHANGİ bir dildeki slug'ıyla
 * bulunmuş olarak gelir (her sayfanın `findInAnyLocale` sorgusu).
 *
 *   yonlendir → kaydın bu dilde KENDİ slug'ı var ama adres başka bir dilin
 *               slug'ını taşıyor: o dildeki doğru adrese git. Bu dilde slug
 *               yoksa hedef, listelerin bastığı varsayılan dil (tr) slug'ıdır;
 *               böylece aynı içerik tek bir adreste kalır.
 *   yedek     → kaydın bu dilde slug'ı YOK (çevrilmemiş) ve adres zaten
 *               listelerin bastığı slug'ı taşıyor: sayfa yedek dilde
 *               (Türkçe) içerikle, çeviri eksiği notuyla basılır.
 *   yok       → 404.
 *
 * Yedek sayfa arama motoruna KAPATILIR (sayfalar `noindex` verir): Türkçe
 * içeriği /en/ altında dizine sokmak aynı metni iki adreste yayınlamak olurdu.
 * Sitemap zaten yalnızca çevrilmiş slug'ları listeler (sitemap.ts).
 * ============================================================================
 */

export type DilSluglari = {
  id: number | string
  slug?: Partial<Record<Locale, string | null>> | null
}

export type SlugKarari =
  | { tur: 'yonlendir'; slug: string }
  | { tur: 'yedek'; id: number | string }
  | { tur: 'yok' }

export const slugKarari = (kayit: DilSluglari | null, locale: Locale, istenenSlug: string): SlugKarari => {
  if (!kayit) return { tur: 'yok' }

  const buDilde = kayit.slug?.[locale] || null
  const hedef = buDilde ?? (kayit.slug?.[DEFAULT_LOCALE] || null)

  if (hedef && hedef !== istenenSlug) return { tur: 'yonlendir', slug: hedef }
  if (!buDilde) return { tur: 'yedek', id: kayit.id }

  /* Slug bu dilde var ve adresle aynı, ama sorgu bulamadı: yayında değil ya da erişim yok. */
  return { tur: 'yok' }
}

/** Yedek gösterimde çeviri eksiği notu kaydın durum alanından bağımsız basılsın diye. */
export const yedekCeviriDurumu = (locale: Locale) => ({ missing: [locale] })
