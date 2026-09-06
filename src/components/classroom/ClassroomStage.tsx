import { getTranslations } from 'next-intl/server'
import React from 'react'

import { leaveVirtualClassroom } from '@/app/(frontend)/[locale]/sanal-sinif/[id]/actions'
import type { Locale } from '@/i18n/locales'
import { optionLabel } from '@/lib/optionLabel'
import { CLASSROOM_PLATFORMS } from '@/fields/options'
import type { ClassroomRole } from '@/lib/virtualClassroom'

/**
 * SANAL SINIF SAHNESİ — ENTEGRASYON YER TUTUCUSU
 * ============================================================================
 * Şartname bu aşamada ÇALIŞAN bir konferans değil, "Jitsi Meet IFrame API veya
 * BigBlueButton katılım formu için yer tutucu bir entegrasyon arayüzü" ister.
 * Bu bileşen tam olarak odur.
 *
 * NEDEN GERÇEK BİR IFRAME GÖMÜLMÜYOR
 * ---------------------------------------------------------------------------
 * Jitsi'nin `external_api.js` dosyası KURUMUN KENDİ Jitsi sunucusundan yüklenir
 * (`https://<kurumun-alan-adi>/external_api.js`). O alan adı henüz belli
 * değildir. Rastgele bir kamu sunucusunu (meet.jit.si) buraya yazmak,
 * kurumun canlı derslerini üçüncü taraf bir sunucuya yönlendirmek olurdu —
 * eğitim oturumları kişisel veri içerir (ses, görüntü, ad). Bu yüzden
 * gömme YAPILMAZ; entegrasyonun bağlanacağı nokta işaretlenir.
 *
 * BigBlueButton'da ayrıca istemciden doğrudan katılım MÜMKÜN DEĞİLDİR:
 * `join` çağrısı, paylaşılan gizli anahtarla üretilen bir checksum ister.
 * O anahtar tarayıcıya verilemez; çağrı sunucu tarafında kurulmalıdır.
 * Bu da bir sunucu eylemi/route handler gerektirir — yer tutucu bunu söyler.
 *
 * ŞU AN NE YAPIYOR
 *   - Odanın kimliğini ve katılımcının ROLÜNÜ gösterir.
 *   - Panelde girilen toplantı adresini AÇILABİLİR bağlantı olarak verir.
 *     (Sayfanın gerçek işlevi budur: doğrulanmış katılımcı odaya ulaşır.)
 *   - Entegrasyonun bağlanacağı DOM düğümünü `data-classroom-mount` ile
 *     işaretler; ileride buraya iframe monte edilecektir.
 * ============================================================================
 */

type Props = {
  locale: Locale
  role: ClassroomRole
  roomId: number
  platform?: string | null
  meetingUrl?: string | null
  meetingId?: string | null
}

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-wrap gap-x-3 gap-y-1 border-b border-line py-3 last:border-b-0">
    <dt className="w-full text-sm text-ink-600 sm:w-48">{label}</dt>
    <dd className="min-w-0 flex-1 break-words text-ink-900">{children}</dd>
  </div>
)

export const ClassroomStage = async ({
  locale,
  role,
  roomId,
  platform,
  meetingUrl,
  meetingId,
}: Props) => {
  const t = await getTranslations('classroom')
  const platformLabel = optionLabel(CLASSROOM_PLATFORMS, platform, locale)

  return (
    <div className="space-y-6">
      {/* --- Rol bildirimi ------------------------------------------------- */}
      <div
        role="status"
        className="flex flex-wrap items-center gap-3 rounded-card border border-success-800 bg-brand-50 p-4"
      >
        <span className="inline-flex items-center rounded-sm bg-brand-800 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
          {role === 'moderator' ? t('roleModerator') : t('roleAttendee')}
        </span>
        <p className="min-w-0 flex-1 text-ink-900">{t('accessGranted')}</p>
      </div>

      {/* --- Entegrasyonun monte edileceği alan ---------------------------- */}
      <div
        data-classroom-mount={platform ?? 'unknown'}
        data-classroom-room={meetingId ?? ''}
        className="flex min-h-64 flex-col items-center justify-center rounded-card border-2 border-dashed border-line-strong bg-surface-alt p-8 text-center"
      >
        <p className="text-sm font-bold uppercase tracking-wider text-ink-600">
          {t('placeholderBadge')}
        </p>
        <p className="mt-3 max-w-xl text-ink-700">
          {platform === 'bigbluebutton' ? t('placeholderBbb') : t('placeholderJitsi')}
        </p>
      </div>

      {/* --- Oturum künyesi ------------------------------------------------ */}
      <dl className="rounded-card border border-line bg-surface p-5">
        {platformLabel ? <Row label={t('platform')}>{platformLabel}</Row> : null}
        {meetingId ? (
          <Row label={t('meetingId')}>
            <code className="rounded bg-surface-alt px-1.5 py-0.5 text-sm">{meetingId}</code>
          </Row>
        ) : null}
        <Row label={t('meetingLink')}>
          {meetingUrl ? (
            <a
              href={meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center font-semibold text-brand-800 underline underline-offset-4"
            >
              {t('openMeeting')}
              <span className="sr-only"> ({t('opensInNewTab')})</span>
            </a>
          ) : (
            <span className="text-ink-600">{t('meetingLinkMissing')}</span>
          )}
        </Row>
      </dl>

      {/* --- Odadan çık ---------------------------------------------------- */}
      <form action={leaveVirtualClassroom}>
        <input type="hidden" name="roomId" value={roomId} />
        <button
          type="submit"
          className="inline-flex min-h-11 items-center rounded border border-line-strong px-5 font-medium text-ink-700 hover:border-brand-700 hover:text-brand-800"
        >
          {t('leaveRoom')}
        </button>
      </form>
    </div>
  )
}

export default ClassroomStage
