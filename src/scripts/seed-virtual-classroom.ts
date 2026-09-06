/**
 * SANAL SINIF ÖRNEK ODASI  (Şartname — Entegre Canlı Eğitim)
 * ============================================================================
 * "Uluslararası Entegre Yangın Yönetimi" eğitimine canlı ders odası bağlar.
 *
 * Kullanım:
 *   corepack pnpm exec tsx src/scripts/seed-virtual-classroom.ts
 *   corepack pnpm exec tsx src/scripts/seed-virtual-classroom.ts --temizle
 *
 * ============================================================================
 * BU ODA TEMSİLÎDİR — GERÇEK BİR TOPLANTI DEĞİLDİR
 * ============================================================================
 * `meetingUrl` kurumun HENÜZ KURULMAMIŞ Jitsi sunucusunu işaret eden örnek bir
 * adrestir; çalışan bir odaya açılmaz. Gerçek adres, kurum kendi sunucusunu
 * kurduğunda panelden girilir.
 *
 * PAROLALAR: aşağıdaki değerler DEMO parolalarıdır ve depoda açıkça durur.
 * Üretimde bu betik ÇALIŞTIRILMAZ; odalar panelden kurulur ve parolalar
 * yalnızca orada yaşar. `NODE_ENV=production` altında betik kendini durdurur.
 * ============================================================================
 */
import 'dotenv/config'
import { getPayload } from 'payload'

import config from '../payload.config.js'

if (process.env.NODE_ENV === 'production') {
  console.error('Bu betik üretim ortamında çalıştırılmaz. Odalar panelden kurulur.')
  process.exit(1)
}

const CTX = { context: { skipRevalidate: true } } as const
const TRAINING_SLUG = 'uluslararasi-entegre-yangin-yonetimi'

/** Demo parolalar — bilinçli olarak "gerçek gibi görünmeyen" değerler. */
const DEMO_MODERATOR_PASSWORD = 'demo-egitmen-2026'
const DEMO_ATTENDEE_PASSWORD = 'demo-katilimci-2026'

const payload = await getPayload({ config })

const training = await payload.find({
  collection: 'training-programs',
  locale: 'tr',
  where: { slug: { equals: TRAINING_SLUG } },
  limit: 1,
  depth: 0,
})

const trainingDoc = training.docs[0] as unknown as { id: number; title?: string } | undefined
if (!trainingDoc) {
  console.error(`Eğitim bulunamadı: ${TRAINING_SLUG}. Önce seed-training-demo.ts çalıştırın.`)
  process.exit(1)
}

// --- Aynı eğitimin eski demo odalarını temizle -----------------------------
const existing = await payload.find({
  collection: 'virtual-classrooms',
  where: { training: { equals: trainingDoc.id } },
  limit: 50,
  depth: 0,
})

for (const doc of existing.docs) {
  await payload.delete({ collection: 'virtual-classrooms', id: doc.id, ...CTX })
  console.log('eski oda silindi: id =', doc.id)
}

if (process.argv.includes('--temizle')) {
  console.log('SONUÇ: odalar temizlendi, yeni oda kurulmadı.')
  process.exit(0)
}

/*
  ZAMAN PENCERESİ
  ---------------------------------------------------------------------------
  Pencere ŞU ANI kapsayacak biçimde kurulur: 1 saat önce başlamış görünür,
  bitiş `--gun=N` kadar ileriye atılır. Sabit bir tarih yazılsaydı ertesi gün
  oturum "sona ermiş" görünür ve katılım akışı test edilemezdi.

  Varsayılan 30 GÜN, çünkü bu oda GELİŞTİRME/TEST odasıdır; amacı bir günü
  temsil etmek değil, kapı → doğrulama → sahne akışının her an denenebilmesi.
  GERÇEK bir oturumun penceresi elbette birkaç saattir ve panelden girilir.

  Kullanım:  ... seed-virtual-classroom.ts --gun=3
*/
const DEFAULT_DAYS = 30
const dayArg = process.argv.find((arg) => arg.startsWith('--gun='))
const parsedDays = dayArg ? Number(dayArg.split('=')[1]) : DEFAULT_DAYS
const days = Number.isFinite(parsedDays) && parsedDays > 0 ? parsedDays : DEFAULT_DAYS

const now = Date.now()
const startsAt = new Date(now - 60 * 60 * 1000).toISOString()
const endsAt = new Date(now + days * 24 * 60 * 60 * 1000).toISOString()

const room = await payload.create({
  collection: 'virtual-classrooms',
  locale: 'tr',
  ...CTX,
  data: {
    title: 'Canlı Oturum — Yangın Davranışı ve Sevk Kararı',
    training: trainingDoc.id,
    roomStatus: 'active',
    platform: 'jitsi',
    startsAt,
    endsAt,
    joinWindowMinutes: 15,
    instructions:
      'Oturuma katılmadan önce mikrofonunuzu sessize alın. Katılım şifresi eğitim koordinatörü tarafından e-posta ile iletilmiştir. Bağlantı sorununda koordinatörünüzle iletişime geçin.',
    meetingUrl: 'https://meet.example-aiftc.org/aiftc-yangin-yonetimi-2026',
    meetingId: 'aiftc-yangin-yonetimi-2026',
    moderatorPassword: DEMO_MODERATOR_PASSWORD,
    attendeePassword: DEMO_ATTENDEE_PASSWORD,
  } as never,
})

const created = room as unknown as { id: number }
console.log(`oda oluşturuldu: #${created.id} (eğitim #${trainingDoc.id})`)

// --- EN / RU başlık ve yönerge --------------------------------------------
const localized = {
  en: {
    title: 'Live session — Fire behaviour and dispatch decisions',
    instructions:
      'Please mute your microphone before joining. The access code was sent to you by the training coordinator. Contact them if you have connection problems.',
  },
  ru: {
    title: 'Живое занятие — поведение пожара и решения о направлении сил',
    instructions:
      'Перед входом отключите микрофон. Код доступа был отправлен вам координатором обучения. При проблемах со связью обратитесь к нему.',
  },
} as const

for (const locale of ['en', 'ru'] as const) {
  await payload.update({
    collection: 'virtual-classrooms',
    id: created.id,
    locale,
    ...CTX,
    data: localized[locale] as never,
  })
  console.log(`  ${locale.toUpperCase()} çevirisi yazıldı`)
}

console.log('\nDEMO PAROLALAR (yalnızca geliştirme ortamı):')
console.log('  eğitmen  :', DEMO_MODERATOR_PASSWORD)
console.log('  katılımcı:', DEMO_ATTENDEE_PASSWORD)
console.log(`\nOturum penceresi: ${startsAt} → ${endsAt}  (${days} gün)`)
console.log(`Katılım adresi: /tr/sanal-sinif/${created.id}`)
console.log('SONUÇ: sanal sınıf kuruldu ve eğitime bağlandı.')

process.exit(0)
