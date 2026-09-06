import type { SelectOption } from '@/fields/options'
import type { Locale } from '@/i18n/locales'

/**
 * SEÇENEK KODU → ZİYARETÇİ DİLİNDEKİ ETİKET
 * ============================================================================
 * `fields/options.ts` içindeki listeler hem Payload panelinin hem de sitenin
 * ORTAK SÖZLÜĞÜDÜR. Panelde `{ tr, en, ru }` biçiminde tanımlı etiketler
 * burada ziyaretçinin diline çözülür.
 *
 * Neden `messages/*.json`'a kopyalanmıyor: kopyalansaydı yeni bir eğitim
 * durumu veya belge türü eklendiğinde iki ayrı yerin güncellenmesi gerekirdi
 * ve biri unutulduğunda site ham kodu ("applications-open") gösterirdi.
 *
 * Veri bozulmasına karşı: sözlükte bulunmayan bir değer için HAM KOD döner.
 * Çirkin görünür ama sayfa çalışmaya devam eder — sessizce boş bırakmaktan
 * iyidir, çünkü hata gözle görülür ve düzeltilebilir.
 * ============================================================================
 */

export const optionLabel = (
  options: SelectOption[],
  value: string | null | undefined,
  locale: Locale,
): string | null => {
  if (!value) return null

  const option = options.find((item) => item.value === value)
  if (!option) return value

  return typeof option.label === 'string' ? option.label : (option.label[locale] ?? value)
}

/** Çok seçimli alanlar (`hasMany: true`) için. Boş/eksik değerler elenir. */
export const optionLabels = (
  options: SelectOption[],
  values: (string | null | undefined)[] | null | undefined,
  locale: Locale,
): string[] =>
  (values ?? [])
    .map((value) => optionLabel(options, value, locale))
    .filter((label): label is string => Boolean(label))
