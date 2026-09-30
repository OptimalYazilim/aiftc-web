/**
 * KONAKLAMA ÖN BAŞVURUSU — HESAP VE DOĞRULAMA (saf fonksiyonlar)
 * ============================================================================
 * Kurum kararı (29.09.2026, onaylı liste):
 *   - Eğitim başvurusunda "konaklamak istiyorum" seçeneği; iki senaryo:
 *     eğitim + konaklama, konaklamasız eğitim. Yalnız konaklama YOK.
 *   - Talep → kurum onayı. ONLINE ÖDEME YOK: admin talebi görüp kişiyi arar.
 *   - Konaklama eğitim tarihlerinin dışına taşabilir; en fazla N gece
 *     (toplantıda 20; 15 de dile geldi — ayarlardan, kurum teyit edecek).
 *   - Eğitim içi ve eğitim dışı gece için ayrı günlük tarife; rakamları kurum
 *     belirler. Başvuran gün sayısını seçerken tahmini ücreti görür.
 *   - Doluluk görülebilir; kurum tarih aralıklarını kapatabilir; kapalı ya da
 *     dolu geceye talep yapılamaz.
 *
 * Form (tahmini ücret, uyarılar) ve sunucu eylemi (bağlayıcı denetim) AYNI
 * fonksiyonları kullanır. Tarihler "YYYY-AA-GG" dizeleridir; saat dilimi
 * kayması olmasın diye Date nesnesine yalnızca UTC gece yarısı olarak çevrilir.
 * ============================================================================
 */

export type KonaklamaAyarlari = {
  enabled: boolean
  maxNights: number
  capacity: number | null
  rateInTraining: number | null
  rateOutsideTraining: number | null
  currency: string
  closedPeriods: { from: string; to: string; note?: string | null }[]
}

const GUN_MS = 86_400_000
const TARIH = /^\d{4}-\d{2}-\d{2}$/

/**
 * "YYYY-AA-GG" ya da saatli ISO değer → "YYYY-AA-GG" (geçersizse null).
 *
 * SAATLİ DEĞER TÜRKİYE SAATİNE GÖRE GÜNE ÇEVRİLİR: Payload tarih alanlarını
 * saatli ISO olarak saklar ve İstanbul'da gece yarısı seçilen bir gün UTC'de
 * ÖNCEKİ güne düşer (…-30T21:00:00Z). İlk 10 karakteri almak kapalı bir
 * dönemi bir gün kaydırırdı.
 */
export const gunOf = (deger: unknown): string | null => {
  if (typeof deger !== 'string' || !deger) return null
  if (TARIH.test(deger)) return Number.isNaN(Date.parse(`${deger}T00:00:00Z`)) ? null : deger
  const t = Date.parse(deger)
  if (Number.isNaN(t)) return null
  return new Date(t).toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' })
}

const ms = (gun: string) => Date.parse(`${gun}T00:00:00Z`)
const gunEkle = (gun: string, n: number) => new Date(ms(gun) + n * GUN_MS).toISOString().slice(0, 10)

/** Giriş ve çıkış arasındaki geceler: giriş günü dahil, çıkış günü hariç. */
export const geceler = (giris: string, cikis: string): string[] => {
  const n = Math.round((ms(cikis) - ms(giris)) / GUN_MS)
  return n > 0 ? Array.from({ length: n }, (_, i) => gunEkle(giris, i)) : []
}

/**
 * Bir gece eğitim içinde mi? Eğitim günleri [başlangıç, bitiş) aralığıdır:
 * 10–14 Haziran eğitiminde 10, 11, 12 ve 13 Haziran geceleri eğitim içidir;
 * 14'ü gecesi eğitim bittikten sonradır.
 */
const egitimIcinde = (gece: string, baslangic: string | null, bitis: string | null) =>
  Boolean(baslangic && bitis && gece >= baslangic && gece < bitis)

export type KonaklamaHesabi = {
  nights: number
  nightsInTraining: number
  nightsOutside: number
  /** Tarifelerden biri bile eksikse null: ücret kurumca bildirilir. */
  estimatedCost: number | null
}

export const konaklamaHesapla = (
  giris: string,
  cikis: string,
  egitim: { start: string | null; end: string | null },
  ayar: Pick<KonaklamaAyarlari, 'rateInTraining' | 'rateOutsideTraining'>,
): KonaklamaHesabi => {
  const liste = geceler(giris, cikis)
  const ic = liste.filter((g) => egitimIcinde(g, egitim.start, egitim.end)).length
  const dis = liste.length - ic
  const tarifeVar =
    (ic === 0 || ayar.rateInTraining != null) && (dis === 0 || ayar.rateOutsideTraining != null)
  return {
    nights: liste.length,
    nightsInTraining: ic,
    nightsOutside: dis,
    estimatedCost: tarifeVar ? ic * (ayar.rateInTraining ?? 0) + dis * (ayar.rateOutsideTraining ?? 0) : null,
  }
}

/** Kapasite doluysa o geceyi döndürür (onaylı talepler sayılır). */
export const doluGeceler = (
  onayliTalepler: { checkIn: string; checkOut: string }[],
  kapasite: number | null,
): Set<string> => {
  const dolu = new Set<string>()
  if (!kapasite || kapasite <= 0) return dolu
  const sayac = new Map<string, number>()
  for (const t of onayliTalepler) {
    for (const g of geceler(t.checkIn, t.checkOut)) sayac.set(g, (sayac.get(g) ?? 0) + 1)
  }
  for (const [g, n] of sayac) if (n >= kapasite) dolu.add(g)
  return dolu
}

export type KonaklamaHatasi =
  | { alan: 'accCheckIn' | 'accCheckOut'; kod: 'zorunlu' | 'gecersiz' | 'gecmis' | 'sira' }
  | { alan: 'accCheckOut'; kod: 'uzun'; max: number }
  | { alan: 'accCheckIn'; kod: 'kapali'; from: string; to: string }
  | { alan: 'accCheckIn'; kod: 'dolu'; gece: string }

/**
 * Bağlayıcı denetim — sunucu eylemi çağırır; form aynı sonucu anında göstermek
 * için de kullanır. İlk hatayı döndürür.
 */
export const konaklamaDogrula = (
  girisHam: unknown,
  cikisHam: unknown,
  ayar: Pick<KonaklamaAyarlari, 'maxNights' | 'closedPeriods'>,
  bugun: string,
  dolu: Set<string>,
): KonaklamaHatasi | null => {
  if (!girisHam) return { alan: 'accCheckIn', kod: 'zorunlu' }
  if (!cikisHam) return { alan: 'accCheckOut', kod: 'zorunlu' }
  const giris = gunOf(girisHam)
  const cikis = gunOf(cikisHam)
  if (!giris) return { alan: 'accCheckIn', kod: 'gecersiz' }
  if (!cikis) return { alan: 'accCheckOut', kod: 'gecersiz' }
  if (giris < bugun) return { alan: 'accCheckIn', kod: 'gecmis' }
  if (cikis <= giris) return { alan: 'accCheckOut', kod: 'sira' }

  const liste = geceler(giris, cikis)
  if (liste.length > ayar.maxNights) return { alan: 'accCheckOut', kod: 'uzun', max: ayar.maxNights }

  for (const donem of ayar.closedPeriods) {
    /* Kapalı dönem [from, to] gün olarak DAHİL; o günlerin gecesi alınamaz. */
    if (liste.some((g) => g >= donem.from && g <= donem.to)) {
      return { alan: 'accCheckIn', kod: 'kapali', from: donem.from, to: donem.to }
    }
  }
  const doluGece = liste.find((g) => dolu.has(g))
  if (doluGece) return { alan: 'accCheckIn', kod: 'dolu', gece: doluGece }
  return null
}

/** Türkiye saatine göre bugünün tarihi ("YYYY-AA-GG"). */
export const bugunIstanbul = (simdi: Date = new Date()): string =>
  simdi.toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' })

/** Ham global kaydını güvenli ayarlara çevirir. */
export const ayarlariCoz = (ham: unknown): KonaklamaAyarlari => {
  const a = (ham ?? {}) as Record<string, unknown>
  const sayi = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null)
  const donemler = Array.isArray(a.closedPeriods) ? a.closedPeriods : []
  return {
    enabled: a.enabled === true,
    maxNights: sayi(a.maxNights) && (a.maxNights as number) >= 1 ? Math.floor(a.maxNights as number) : 20,
    capacity: sayi(a.capacity) ? Math.floor(a.capacity as number) : null,
    rateInTraining: sayi(a.rateInTraining),
    rateOutsideTraining: sayi(a.rateOutsideTraining),
    currency: typeof a.currency === 'string' && a.currency ? a.currency : 'TRY',
    closedPeriods: donemler
      .map((d) => {
        const x = d as { from?: unknown; to?: unknown; note?: unknown }
        const from = gunOf(x.from)
        const to = gunOf(x.to)
        return from && to && to >= from ? { from, to, note: typeof x.note === 'string' ? x.note : null } : null
      })
      .filter((d): d is { from: string; to: string; note: string | null } => d !== null),
  }
}
