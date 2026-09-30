/**
 * EĞİTİME ÖZEL BAŞVURU SORULARI  (kurum kararı, 29.09.2026)
 * ============================================================================
 * Başvuru formu, OGM'den gelecek kişi bilgilerine EK OLARAK her eğitim için
 * editörün tanımladığı soruları sorar (`TrainingPrograms.applicationQuestions`).
 *
 * GÜVEN SINIRI: Sorular istemciye yalnızca GÖSTERMEK için gider. Hangi
 * soruların sorulduğu ve hangisinin zorunlu olduğu sunucuda, eğitim kaydından
 * YENİDEN okunur (basvuru/actions.ts). İstemcinin gönderdiği alan adları
 * listesine güvenilmez; kayıtta olmayan bir `ek_*` alanı yok sayılır.
 *
 * ANLIK GÖRÜNTÜ: Cevap, sorunun o anki METNİYLE birlikte başvuruya yazılır
 * (`Registrations.extraAnswers`). Editör soruyu sonradan değiştirse ya da
 * silse bile kayıt, kişiye NE SORULDUĞUNU göstermeye devam eder.
 * ============================================================================
 */

export type SoruTuru = 'text' | 'textarea' | 'select' | 'checkbox'

export type BasvuruSorusu = {
  /** Payload dizi satırının kimliği — form alan adı `ek_<id>` bundan türer. */
  id: string
  label: string
  type: SoruTuru
  required: boolean
  help?: string | null
  options?: { id: string; label: string }[]
}

export const EK_ALAN_ONEKI = 'ek_'
export const ekAlanAdi = (soruId: string) => `${EK_ALAN_ONEKI}${soruId}`

const SINIR = { text: 300, textarea: 2000 } as const

/** Payload'dan gelen ham diziyi güvenli bir soru listesine çevirir. */
export const sorulariCoz = (ham: unknown): BasvuruSorusu[] => {
  if (!Array.isArray(ham)) return []
  return ham
    .map((satir): BasvuruSorusu | null => {
      const s = satir as {
        id?: string | null
        label?: string | null
        type?: string | null
        required?: boolean | null
        help?: string | null
        options?: { id?: string | null; label?: string | null }[] | null
      }
      if (!s?.id || !s.label?.trim()) return null
      const tur: SoruTuru = (['text', 'textarea', 'select', 'checkbox'] as const).includes(
        s.type as SoruTuru,
      )
        ? (s.type as SoruTuru)
        : 'text'
      const secenekler = (s.options ?? [])
        .filter((o): o is { id: string; label: string } => Boolean(o?.id && o.label?.trim()))
        .map((o) => ({ id: o.id, label: o.label }))
      /* Seçeneksiz bir seçim listesi cevaplanamaz; soru hiç sorulmaz. */
      if (tur === 'select' && secenekler.length === 0) return null
      return {
        id: s.id,
        label: s.label.trim(),
        type: tur,
        required: Boolean(s.required),
        help: s.help?.trim() || null,
        ...(tur === 'select' ? { options: secenekler } : {}),
      }
    })
    .filter((s): s is BasvuruSorusu => s !== null)
}

export type EkCevap = { question: string; answer: string }

/**
 * Sunucu doğrulaması. Hata anahtarları form alan adıdır (`ek_<id>`), böylece
 * form hatayı ilgili alanın altına ve hata özetine koyabilir.
 */
export const ekCevaplariDogrula = (
  sorular: BasvuruSorusu[],
  formData: FormData,
  mesaj: { zorunlu: string; uzun: (max: number) => string; secim: string; evet: string; hayir: string },
): { cevaplar: EkCevap[]; hatalar: Record<string, string> } => {
  const cevaplar: EkCevap[] = []
  const hatalar: Record<string, string> = {}

  for (const soru of sorular) {
    const ad = ekAlanAdi(soru.id)
    const ham = formData.get(ad)

    if (soru.type === 'checkbox') {
      const isaretli = ham === 'on'
      if (soru.required && !isaretli) hatalar[ad] = mesaj.zorunlu
      cevaplar.push({ question: soru.label, answer: isaretli ? mesaj.evet : mesaj.hayir })
      continue
    }

    const deger = String(ham ?? '').trim()
    if (!deger) {
      if (soru.required) hatalar[ad] = mesaj.zorunlu
      continue
    }

    if (soru.type === 'select') {
      const secilen = soru.options?.find((o) => o.id === deger)
      if (!secilen) {
        hatalar[ad] = mesaj.secim
        continue
      }
      cevaplar.push({ question: soru.label, answer: secilen.label })
      continue
    }

    const max = soru.type === 'textarea' ? SINIR.textarea : SINIR.text
    if (deger.length > max) {
      hatalar[ad] = mesaj.uzun(max)
      continue
    }
    cevaplar.push({ question: soru.label, answer: deger })
  }

  return { cevaplar, hatalar }
}
