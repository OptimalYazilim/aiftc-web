import type { CollectionAfterChangeHook } from 'payload'

import { isLocale, type Locale } from '@/i18n/locales'
import { authHref, classroomHref } from '@/i18n/routes'

import en from '../../messages/en.json' with { type: 'json' }
import ru from '../../messages/ru.json' with { type: 'json' }
import tr from '../../messages/tr.json' with { type: 'json' }

/**
 * ONAY E-POSTASI  (kurum kararı, 29.09.2026)
 * ============================================================================
 * Başvuru "Onaylandı" durumuna GEÇTİĞİ anda başvurana e-posta gider. Yalnızca
 * geçişte: onaylı bir kaydın notunu düzenlemek e-postayı yeniden göndermez.
 * Ret ve tamamlanma için e-posta istenmedi; eklenmedi.
 *
 * ---------------------------------------------------------------------------
 * E-POSTA KARARI BOZMAZ
 * ---------------------------------------------------------------------------
 * Gönderim hata verirse durum değişikliği GERİ ALINMAZ: onay bir kurum
 * kararıdır, SMTP sunucusunun o anki hâli ona bağlı olamaz. Bunun yerine
 * sonuç kayda yazılır (`approvalEmail.status`) ki personel paneldeki kayda
 * bakıp "e-posta gitti mi?" sorusunu cevaplayabilsin ve gitmediyse kişiyi
 * arayabilsin.
 *
 * ---------------------------------------------------------------------------
 * "GÖNDERİLDİ" İLE "GÜNLÜĞE YAZILDI" AYRI
 * ---------------------------------------------------------------------------
 * `SMTP_HOST` tanımlı değilse Payload iletiyi yalnızca sunucu günlüğüne basar
 * (konsol adaptörü) ve hata VERMEZ. O durumu "gönderildi" diye damgalamak,
 * kimseye ulaşmamış bir iletiyi ulaşmış gibi gösterirdi. Adaptörün adına
 * bakılır: `console` ise durum `logged` olur.
 *
 * ---------------------------------------------------------------------------
 * METİN
 * ---------------------------------------------------------------------------
 * Nötr bir bildirimdir, söz vermez ("sizinle iletişime geçilecek" gibi bir
 * taahhüt içermez).
 *
 * CANLI OTURUM BAĞLANTISI (2026-10-01): eğitimin henüz bitmemiş sanal sınıf
 * odaları varsa bağlantıları eklenir. Başvuru bir hesaba bağlıysa "oturum
 * açarak şifresiz katılın", değilse "sayfa katılım şifresini ister" denir.
 * Şifrenin KENDİSİ e-postaya yazılmaz; onu koordinatör iletir. Oda henüz
 * tanımlanmadıysa satır eklenmez (bağlantı eğitim sayfasında belirir). Metinler `messages/*.json → registration.approvalEmail*`
 * altındadır; kurum farklı bir ifade isterse orada değiştirilir. Dil,
 * başvurunun yapıldığı dildir (`locale` alanı).
 * ============================================================================
 */

const METINLER = { tr: tr.registration, en: en.registration, ru: ru.registration } as const

const doldur = (sablon: string, degerler: Record<string, string>): string =>
  sablon.replace(/\{(\w+)\}/g, (_, k: string) => degerler[k] ?? '')

type Kayit = {
  id: number | string
  status?: string | null
  email?: string | null
  fullName?: string | null
  locale?: string | null
  user?: number | { id: number } | null
  training?: number | { id: number } | null
}

export const registrationApprovalEmail: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
  context,
}) => {
  if (context?.skipApprovalEmail) return doc
  if (operation !== 'update') return doc

  const kayit = doc as Kayit
  if (kayit.status !== 'approved' || (previousDoc as Kayit | undefined)?.status === 'approved') {
    return doc
  }
  if (!kayit.email) return doc

  const dil: Locale = kayit.locale && isLocale(kayit.locale) ? kayit.locale : 'tr'
  const m = METINLER[dil]

  let egitimAdi = ''
  const egitimId = typeof kayit.training === 'object' ? kayit.training?.id : kayit.training
  try {
    if (egitimId) {
      const egitim = await req.payload.findByID({
        collection: 'training-programs',
        id: egitimId,
        locale: dil,
        depth: 0,
        req,
        overrideAccess: true,
      })
      egitimAdi = (egitim as { title?: string | null }).title ?? ''
    }
  } catch {
    /* Eğitim adı okunamazsa ileti yine gider; ad boş kalır. */
  }

  const taban = (process.env.NEXT_PUBLIC_SERVER_URL ?? '').replace(/\/$/, '')
  const satirlar = [
    doldur(m.approvalEmailGreeting, { name: kayit.fullName ?? '' }),
    '',
    doldur(m.approvalEmailBody, { training: egitimAdi }),
  ]
  if (kayit.user && taban) {
    satirlar.push('', doldur(m.approvalEmailProfileLine, { url: `${taban}${authHref('profile', dil)}` }))
  }

  if (egitimId && taban) {
    try {
      const odalar = await req.payload.find({
        collection: 'virtual-classrooms',
        where: {
          and: [{ training: { equals: egitimId } }, { endsAt: { greater_than_equal: new Date().toISOString() } }],
        },
        sort: 'startsAt',
        limit: 5,
        depth: 0,
        select: { id: true } as never,
        req,
        overrideAccess: true,
      })
      const sablon = kayit.user ? m.approvalEmailClassroomAccount : m.approvalEmailClassroomCode
      for (const oda of odalar.docs as unknown as { id: number }[]) {
        satirlar.push('', doldur(sablon, { url: `${taban}${classroomHref(dil, oda.id)}` }))
      }
    } catch {
      /* Oda okunamazsa ileti yine gider; bağlantı eğitim sayfasında görünür. */
    }
  }
  satirlar.push('', m.approvalEmailFooter)

  const kanal = req.payload.email?.name === 'console' ? 'logged' : 'sent'
  let sonuc: { status: 'sent' | 'logged' | 'failed'; at: string; error?: string }
  try {
    await req.payload.sendEmail({
      to: kayit.email,
      subject: doldur(m.approvalEmailSubject, { training: egitimAdi }),
      text: satirlar.join('\n'),
    })
    sonuc = { status: kanal, at: new Date().toISOString() }
  } catch (err) {
    req.payload.logger.error({ err, registration: kayit.id }, 'Onay e-postası gönderilemedi')
    sonuc = {
      status: 'failed',
      at: new Date().toISOString(),
      error: (err instanceof Error ? err.message : String(err)).slice(0, 300),
    }
  }

  await req.payload.update({
    collection: 'registrations',
    id: kayit.id,
    data: { approvalEmail: sonuc } as never,
    req,
    overrideAccess: true,
    context: { skipApprovalEmail: true, skipRevalidate: true },
  })

  return { ...doc, approvalEmail: sonuc }
}
