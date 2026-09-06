import type { Locale } from '@/i18n/locales'

/**
 * TARİH BİÇİMLENDİRME
 * ============================================================================
 * Tek kaynak: eğitim tarihleri ana sayfada, katalogda ve detay sayfasında
 * AYNI biçimde görünmelidir.
 *
 * Biçimlendirme `Intl` ile ziyaretçinin diline göre yapılır — TR'de
 * "12 Mayıs 2027", EN'de "12 May 2027", RU'da "12 мая 2027 г.". Elle ay adı
 * tablosu tutulmaz.
 *
 * Bozuk/eksik tarihlerde `null` döner; çağıran taraf alanı hiç basmaz.
 * Sunucu ve istemci aynı UTC değerini aynı dille biçimlendirdiği için
 * hidrasyon uyuşmazlığı oluşmaz.
 * ============================================================================
 */

const parse = (value: string | null | undefined): Date | null => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** "12 Mayıs 2027" */
export const formatDate = (locale: Locale, value: string | null | undefined): string | null => {
  const date = parse(value)
  return date ? new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(date) : null
}

/**
 * Takvimde ay gruplaması için sıralanabilir anahtar: "2027-03".
 *
 * DİKKAT — UTC bileşenleri kullanılır. Payload tarihleri UTC olarak saklar;
 * yerel saatle okunsaydı sunucu ile tarayıcının saat dilimi farklı olduğunda
 * ayın ilk/son gününe düşen bir eğitim İKİ FARKLI AYA girer ve React
 * hidrasyon uyuşmazlığı üretirdi.
 */
export const monthKey = (value: string | null | undefined): string | null => {
  const date = parse(value)
  if (!date) return null

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

/** "Mart 2027" — grup başlığı. */
export const formatMonthKey = (locale: Locale, key: string): string => {
  const [year, month] = key.split('-').map(Number)
  // Gün 1 ve UTC: `monthKey` ile aynı takvim kabulü.
  const date = new Date(Date.UTC(year, (month ?? 1) - 1, 1))

  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    date,
  )
}

/** "12–23" gibi yalnızca gün numaraları; takvim satırının sol sütunu için. */
export const formatDayRange = (
  locale: Locale,
  start: string | null | undefined,
  end: string | null | undefined,
): string | null => {
  const startDate = parse(start)
  if (!startDate) return null

  const day = new Intl.DateTimeFormat(locale, { day: 'numeric', timeZone: 'UTC' })
  const endDate = parse(end)

  if (!endDate) return day.format(startDate)

  // Farklı aylara yayılan eğitimde gün numarası tek başına yanıltıcıdır.
  const sameMonth =
    startDate.getUTCFullYear() === endDate.getUTCFullYear() &&
    startDate.getUTCMonth() === endDate.getUTCMonth()

  if (!sameMonth) {
    const dayMonth = new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    })
    return `${dayMonth.format(startDate)} – ${dayMonth.format(endDate)}`
  }

  return `${day.format(startDate)}–${day.format(endDate)}`
}

/**
 * "12 Mayıs – 23 Mayıs 2027" — bitiş yoksa yalnızca başlangıç.
 * Başlangıçta yıl tekrarlanmaz; okunurluğu artırır.
 */
export const formatDateRange = (
  locale: Locale,
  start: string | null | undefined,
  end: string | null | undefined,
): string | null => {
  const startDate = parse(start)
  if (!startDate) return null

  const long = new Intl.DateTimeFormat(locale, { dateStyle: 'long' })
  const endDate = parse(end)
  if (!endDate) return long.format(startDate)

  const short = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' })
  return `${short.format(startDate)} – ${long.format(endDate)}`
}
