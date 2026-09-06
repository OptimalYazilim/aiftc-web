/**
 * ÖRNEK EĞİTİM PROGRAMI — ŞARTNAMEDEKİ TÜM ALANLAR DOLU
 * ============================================================================
 * "Uluslararası Entegre Yangın Yönetimi" kaydını kurar. Amacı bir demo
 * içeriği üretmek DEĞİL, şemadaki her alanın ön yüzde gerçekten render
 * edildiğini gösterebilecek eksiksiz bir kayıt bırakmaktır:
 *
 *   durum (Başvuruya açık) · kontenjan · katılımcı ülkeler · öğrenme çıktıları
 *   günlük program (teorik/uygulamalı/simülasyon/saha/değerlendirme oturumları)
 *   simülasyon kullanımı · saha uygulaması · değerlendirme yöntemi
 *   sertifika koşulları · eğitmenler · başvuru yönlendirmesi
 *
 * Kullanım:
 *   corepack pnpm exec tsx src/scripts/seed-training-demo.ts
 *   corepack pnpm exec tsx src/scripts/seed-training-demo.ts --temizle
 *
 * TEKRAR ÇALIŞTIRILABİLİR: aynı slug varsa kayıt silinip yeniden kurulur.
 *
 * ---------------------------------------------------------------------------
 * İÇERİK HAKKINDA
 * ---------------------------------------------------------------------------
 * Program akışı, oturum başlıkları ve değerlendirme ölçütleri ORMANCILIK
 * EĞİTİMİ PRATİĞİNE UYGUN biçimde yazılmıştır ama merkezin gerçek bir
 * müfredatı değildir. Eğitmen adları UYDURULMAMIŞTIR: gerçek kişi adı
 * yazmak yerine kurum/görev tanımı bırakılmıştır — var olmayan bir kişiyi
 * bir kuruma eğitmen olarak atfetmek yanlış olurdu. Editör panelden gerçek
 * eğitmenleri girmelidir.
 * ============================================================================
 */
import 'dotenv/config'
import { getPayload } from 'payload'

import config from '../payload.config.js'

/** Revalidate hook'ları betik bağlamında `next/cache` bulamaz. */
const CTX = { context: { skipRevalidate: true } }

const SLUG = 'uluslararasi-entegre-yangin-yonetimi'

/** Lexical zengin metin ağacı — düz paragraflardan kurar. */
const richText = (paragraphs: string[]) => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr' as const,
    children: paragraphs.map((text) => ({
      type: 'paragraph',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      children: [
        { type: 'text', text, format: 0, style: '', mode: 'normal', detail: 0, version: 1 },
      ],
    })),
  },
})

const payload = await getPayload({ config })

if (process.argv.includes('--temizle')) {
  const removed = await payload.delete({
    collection: 'training-programs',
    locale: 'tr',
    ...CTX,
    where: { slug: { equals: SLUG } },
  })
  console.log('silinen kayıt:', removed.docs.length)
  process.exit(0)
}

// --- İlgili konuları bul ---------------------------------------------------
const topics = await payload.find({
  collection: 'training-topics',
  locale: 'tr',
  limit: 50,
  depth: 0,
})
const pick = (pattern: RegExp) =>
  topics.docs.find((t) => pattern.test(String((t as { title?: string }).title ?? '')))?.id

const topicIds = [pick(/yang[ıi]n/i), pick(/iklim/i)].filter(
  (id): id is number => typeof id === 'number',
)

// --- Simülasyon sistemleri (varsa bağla) -----------------------------------
const systems = await payload.find({
  collection: 'simulation-systems',
  locale: 'tr',
  limit: 10,
  depth: 0,
})
const systemIds = systems.docs.map((s) => s.id as number).slice(0, 2)

// --- Mevcut kaydı temizle (tekrar çalıştırılabilirlik) ---------------------
const existing = await payload.find({
  collection: 'training-programs',
  locale: 'tr',
  where: { slug: { equals: SLUG } },
  limit: 1,
  depth: 0,
})
for (const doc of existing.docs) {
  await payload.delete({ collection: 'training-programs', id: doc.id, ...CTX })
  console.log('mevcut kayıt silindi (yeniden kurulacak): id =', doc.id)
}

const created = await payload.create({
  collection: 'training-programs',
  locale: 'tr',
  ...CTX,
  data: {
    slug: SLUG,
    title: 'Uluslararası Entegre Yangın Yönetimi',
    code: 'AIFTC-IFM-2027-01',
    summary:
      'Orman yangınlarında önleme, hazırlık, müdahale ve iyileştirme aşamalarını tek bir yönetim döngüsü olarak ele alan; karar destek sistemleri ve simülatör uygulamalarıyla desteklenen iki haftalık uluslararası eğitim.',
    status: 'applications-open',
    featured: true,
    topics: topicIds,

    // --- Tarih, süre, biçim ---
    startDate: '2027-05-10T07:00:00.000Z',
    endDate: '2027-05-21T14:00:00.000Z',
    durationDays: 12,
    durationHours: 84,
    deliveryMode: 'in-person',
    level: 'advanced',
    venue: 'AIFTC Kampüsü, Simülasyon Merkezi ve Düzlerçamı Uygulama Ormanı, Antalya',
    instructionLanguages: ['tr', 'en'],

    targetAudience:
      'Orta Asya ve komşu ülkelerin orman genel müdürlüklerinde yangın müdahale ekiplerini sevk eden orta ve üst kademe teknik personel; yangın harekât merkezi görevlileri.',

    // --- Kontenjan ve katılımcı ülkeler ---
    quota: 28,
    participantCountries: ['TR', 'AZ', 'KZ', 'KG', 'TJ', 'TM', 'UZ'],

    // --- Program detayı ---
    objective: richText([
      'Eğitimin amacı, katılımcıların orman yangınını yalnızca bir müdahale olayı olarak değil; risk azaltma, hazırlık, müdahale ve iyileştirme aşamalarından oluşan bütünleşik bir yönetim döngüsü olarak ele alabilmesidir.',
      'Program sonunda katılımcıların kendi ülkelerindeki yangın harekât merkezlerinde karar destek çıktılarını yorumlayabilmesi ve bölgesel iş birliği protokollerini uygulayabilmesi hedeflenir.',
    ]),

    learningOutcomes: [
      { text: 'Yangın davranışını etkileyen meteorolojik ve topografik etkenleri ayırt eder.' },
      { text: 'Yangın tehlike indekslerini okur ve günlük hazırlık seviyesini belirler.' },
      { text: 'Karar destek sistemi çıktılarını sevk kararına dönüştürür.' },
      { text: 'Hava ve yer ekipleri arasındaki telsiz iletişim protokolünü uygular.' },
      { text: 'Yangın sonrası zarar değerlendirmesi ve restorasyon önceliklendirmesi yapar.' },
      { text: 'Bölgesel karşılıklı yardım mekanizmalarını kendi ülkesi için değerlendirir.' },
    ],

    schedule: [
      {
        dayLabel: '1. Gün — Yangın yönetimi döngüsü',
        sessions: [
          { time: '09:00', title: 'Açılış ve program tanıtımı', type: 'theory' },
          { time: '10:30', title: 'Entegre yangın yönetimi kavramı', type: 'theory' },
          { time: '14:00', title: 'Ülke sunumları ve mevcut durum analizi', type: 'theory' },
        ],
      },
      {
        dayLabel: '3. Gün — Yangın davranışı ve tehlike indeksleri',
        sessions: [
          { time: '09:00', title: 'Meteorolojik yangın tehlike indeksleri', type: 'theory' },
          { time: '13:30', title: 'İndeks hesaplama uygulaması', type: 'practice' },
        ],
      },
      {
        dayLabel: '6. Gün — Karar destek ve simülasyon',
        sessions: [
          { time: '09:00', title: 'Karar destek sistemine giriş', type: 'theory' },
          { time: '11:00', title: 'Simülatörde sevk senaryosu — küçük ölçekli yangın', type: 'simulation' },
          { time: '14:00', title: 'Simülatörde sevk senaryosu — çok bölmeli yangın', type: 'simulation' },
        ],
      },
      {
        dayLabel: '9. Gün — Saha uygulaması',
        sessions: [
          { time: '08:00', title: 'Düzlerçamı Uygulama Ormanı — arazi keşfi', type: 'field' },
          { time: '10:00', title: 'Yer ekibi sevk tatbikatı ve telsiz haberleşmesi', type: 'field' },
          { time: '14:00', title: 'Hava desteği koordinasyon tatbikatı', type: 'field' },
        ],
      },
      {
        dayLabel: '12. Gün — Değerlendirme ve kapanış',
        sessions: [
          { time: '09:00', title: 'Grup projesi sunumları', type: 'assessment' },
          { time: '13:00', title: 'Yazılı değerlendirme', type: 'assessment' },
          { time: '15:00', title: 'Sertifika töreni ve kapanış', type: 'theory' },
        ],
      },
    ],

    /*
      Eğitmen adları UYDURULMAZ (bkz. dosya başındaki not). Kurum ve görev
      tanımı bırakılır; editör gerçek kişileri panelden girer.
    */
    trainers: [
      {
        name: 'Belirlenecek — OGM Yangınla Mücadele Dairesi',
        titleAndRole: 'Yangın harekât uzmanı',
        organization: 'Orman Genel Müdürlüğü',
      },
      {
        name: 'Belirlenecek — FAO bölgesel uzmanı',
        titleAndRole: 'Entegre yangın yönetimi danışmanı',
        organization: 'FAO',
      },
    ],

    // --- Simülasyon ve saha ---
    usesSimulation: true,
    ...(systemIds.length > 0 ? { simulationSystems: systemIds } : {}),
    hasFieldExercise: true,

    assessmentMethod: richText([
      'Değerlendirme üç bileşenden oluşur: derslere ve saha uygulamalarına katılım (%30), grup projesi sunumu (%35) ve yazılı sınav (%35).',
      'Başarı eşiği 100 üzerinden 70’tir. Saha uygulamalarının en az %80’ine katılmayan katılımcılar değerlendirmeye alınmaz.',
    ]),

    // --- Sertifika ---
    certificateType: 'certificate',
    certificateConditions: richText([
      'Katılım Belgesi, programın en az %80’ine katılan tüm katılımcılara verilir.',
      'Başarı Sertifikası için ayrıca değerlendirme ortalamasının 70 ve üzeri olması gerekir. Sertifika, Orman Genel Müdürlüğü ve FAO ortak logolarıyla düzenlenir.',
    ]),

    // --- Başvuru ---
    applicationRequirements: richText([
      'Başvurular katılımcı ülkelerin orman idareleri aracılığıyla yapılır; bireysel başvuru kabul edilmez.',
      'Adayların en az üç yıl saha deneyimi ve İngilizce veya Türkçe çalışma düzeyinde dil yeterliliği bulunmalıdır.',
    ]),
    applicationDeadline: '2027-03-20T21:00:00.000Z',

    _status: 'published',
  } as never,
})

const id = (created as unknown as { id: number }).id

// --- Geri okuyup alanların yazıldığını doğrula ----------------------------
const check = (await payload.findByID({
  collection: 'training-programs',
  id,
  locale: 'tr',
  depth: 1,
})) as unknown as Record<string, unknown>

const rows: [string, unknown][] = [
  ['status', check.status],
  ['quota', check.quota],
  ['participantCountries', (check.participantCountries as string[])?.join(', ')],
  ['learningOutcomes', (check.learningOutcomes as unknown[])?.length + ' madde'],
  ['schedule', (check.schedule as unknown[])?.length + ' gün'],
  [
    'sessions (toplam)',
    (check.schedule as { sessions?: unknown[] }[])?.reduce(
      (n, d) => n + (d.sessions?.length ?? 0),
      0,
    ) + ' oturum',
  ],
  ['usesSimulation', check.usesSimulation],
  ['simulationSystems', (check.simulationSystems as unknown[])?.length ?? 0],
  ['hasFieldExercise', check.hasFieldExercise],
  ['assessmentMethod', check.assessmentMethod ? 'dolu' : 'BOŞ'],
  ['certificateType', check.certificateType],
  ['certificateConditions', check.certificateConditions ? 'dolu' : 'BOŞ'],
  ['trainers', (check.trainers as unknown[])?.length + ' kişi'],
  ['_status', check._status],
]

console.log('\neğitim kaydı oluşturuldu: id =', id, '| slug =', SLUG)
for (const [k, v] of rows) console.log('  ', k.padEnd(22), '=', v)

const ok =
  check.status === 'applications-open' &&
  Number(check.quota) === 28 &&
  (check.participantCountries as string[])?.length === 7 &&
  (check.learningOutcomes as unknown[])?.length === 6 &&
  (check.schedule as unknown[])?.length === 5 &&
  check.usesSimulation === true &&
  check.hasFieldExercise === true &&
  Boolean(check.assessmentMethod) &&
  Boolean(check.certificateConditions)

console.log(ok ? '\nSONUÇ: tüm alanlar yazıldı.' : '\nSONUÇ: EKSİK ALAN VAR.')
process.exit(ok ? 0 : 1)
