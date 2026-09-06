/**
 * SİMÜLASYON MERKEZİ — SİSTEMLER VE SAYFA İÇERİĞİ  (Şartname 9)
 * ============================================================================
 * Kurar:
 *   1. "Simülasyon Merkezi Sayfası" global'i (amaç, yangın eğitimindeki rol,
 *      eğitimlerle ilişki, üst görsel, teknik kapasite özeti)
 *   2. İki sistem kaydı — OYMES ve BTES (kapak görselleriyle)
 *   3. "Uluslararası Entegre Yangın Yönetimi" eğitiminin `simulationSystems`
 *      ilişkisini bu iki sisteme bağlar
 *
 * Kullanım:
 *   corepack pnpm exec tsx src/scripts/seed-simulation-centre.ts
 *   corepack pnpm exec tsx src/scripts/seed-simulation-centre.ts --temizle
 *
 * TEKRAR ÇALIŞTIRILABİLİR: aynı slug'lı sistemler silinip yeniden kurulur.
 *
 * ============================================================================
 * İÇERİK TEMSİLİDİR — KURUMUN RESMÎ TEKNİK DOKÜMANI DEĞİLDİR
 * ============================================================================
 * OYMES ve BTES, şartnamenin 9. maddesinde adı geçen iki sistemdir. Ancak
 * bu betikteki teknik kapasiteler (istasyon sayısı, ekran yapılandırması,
 * senaryo sayısı) merkezin GERÇEK envanteri değildir — elimizde o veri yok
 * ve uydurulmuş bir teknik özelliği kurumsal bir sayfada yayımlamak yanlış
 * olur.
 *
 * Bu yüzden:
 *   - Sayısal kapasiteler makul ama TEMSİLİdir; panelden düzeltilmelidir.
 *   - Görseller ücretsiz lisanslı (Unsplash License) stok fotoğraflardır ve
 *     merkezin kendi salonları DEĞİLDİR; `caption` alanı bunu söyler,
 *     `credit` alanı kaynağı kayda geçirir (Şartname 10.2).
 *   - Sayfada da bir uyarı satırı basılır (bkz. simulasyon-merkezi/page.tsx),
 *     ziyaretçi bu değerleri kesin veri sanmasın.
 *
 * Gerçek envanter geldiğinde panelden değiştirilmelidir.
 * ============================================================================
 */
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'

import config from '../payload.config.js'

/** Revalidate hook'ları betik bağlamında `next/cache` bulamaz. */
const CTX = { context: { skipRevalidate: true } }

const TRAINING_SLUG = 'uluslararasi-entegre-yangin-yonetimi'
const SYSTEM_SLUGS = ['oymes', 'btes']
const IMAGE_ALT_PREFIX = 'Simülasyon merkezi temsili görseli'

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

// --- Temizlik modu ---------------------------------------------------------
if (process.argv.includes('--temizle')) {
  const sys = await payload.delete({
    collection: 'simulation-systems',
    locale: 'tr',
    ...CTX,
    where: { slug: { in: SYSTEM_SLUGS } },
  })
  const media = await payload.delete({
    collection: 'media',
    locale: 'tr',
    ...CTX,
    where: { alt: { like: IMAGE_ALT_PREFIX } },
  })
  console.log('silinen sistem:', sys.docs.length, '| silinen görsel:', media.docs.length)
  process.exit(0)
}

// --- Görselleri yükle ------------------------------------------------------
const tmp = process.env.TEMP ?? '.'

type Shot = { file: string; alt: string; caption: string; credit: string }

const SHOTS: Record<'hero' | 'oymes' | 'btes', Shot> = {
  hero: {
    file: 'aiftc-sim-hero.jpg',
    alt: `${IMAGE_ALT_PREFIX} — çok ekranlı bir harekât/kontrol salonu`,
    caption: 'Temsili görsel — simülasyon ve harekât salonu.',
    credit: 'Frantisek Duris / Unsplash (Unsplash License)',
  },
  oymes: {
    file: 'aiftc-sim-oymes.jpg',
    alt: `${IMAGE_ALT_PREFIX} — operatör istasyonları ve duvar ekranlarıyla kontrol salonu`,
    caption: 'Temsili görsel — OYMES sevk ve karar destek istasyonları.',
    credit: 'Igor Saikin / Unsplash (Unsplash License)',
  },
  btes: {
    file: 'aiftc-sim-btes.jpg',
    alt: `${IMAGE_ALT_PREFIX} — sıra sıra bilgisayarların bulunduğu eğitim laboratuvarı`,
    caption: 'Temsili görsel — BTES bilgisayarlı eğitim laboratuvarı.',
    credit: 'RUT MIIT / Unsplash (Unsplash License)',
  },
}

// Kopya birikmesin: bu betiğin daha önce yüklediği görselleri sil.
const stale = await payload.delete({
  collection: 'media',
  locale: 'tr',
  ...CTX,
  where: { alt: { like: IMAGE_ALT_PREFIX } },
})
if (stale.docs.length > 0) console.log('eski görsel silindi:', stale.docs.length)

const uploaded: Partial<Record<keyof typeof SHOTS, number>> = {}

for (const [key, shot] of Object.entries(SHOTS) as [keyof typeof SHOTS, Shot][]) {
  const filePath = path.join(tmp, shot.file)
  if (!fs.existsSync(filePath)) {
    console.warn(`UYARI: ${shot.file} bulunamadı, bu görsel atlandı.`)
    continue
  }

  const doc = await payload.create({
    collection: 'media',
    locale: 'tr',
    ...CTX,
    filePath,
    data: { alt: shot.alt, caption: shot.caption, credit: shot.credit },
  })
  const d = doc as unknown as { id: number; width?: number; height?: number; filename?: string }
  uploaded[key] = d.id
  console.log(`görsel yüklendi: #${d.id} ${d.filename} (${d.width}x${d.height})`)
}

// --- İlgili konuları bul ---------------------------------------------------
const topics = await payload.find({
  collection: 'training-topics',
  locale: 'tr',
  limit: 50,
  depth: 0,
})
const topicId = (pattern: RegExp) =>
  topics.docs.find((t) => pattern.test(String((t as { title?: string }).title ?? '')))?.id

const fireTopics = [topicId(/yang[ıi]n/i), topicId(/uzaktan alg|CBS/i)].filter(
  (id): id is number => typeof id === 'number',
)

// --- Sistemleri kur --------------------------------------------------------
const existingSystems = await payload.find({
  collection: 'simulation-systems',
  locale: 'tr',
  where: { slug: { in: SYSTEM_SLUGS } },
  limit: 10,
  depth: 0,
})
for (const doc of existingSystems.docs) {
  await payload.delete({ collection: 'simulation-systems', id: doc.id, ...CTX })
  console.log('mevcut sistem silindi (yeniden kurulacak): id =', doc.id)
}

const systems = [
  {
    slug: 'oymes',
    order: 10,
    title: 'OYMES — Orman Yangınlarıyla Mücadele Eğitim Simülatörü',
    shortCode: 'OYMES',
    coverImage: uploaded.oymes,
    summary:
      'Yangın harekât merkezi ortamını birebir canlandıran, katılımcıların gerçek zamanlı sevk kararı almasını sağlayan tam ölçekli eğitim simülatörü.',
    description: richText([
      'OYMES, orman yangınına müdahale sürecinin tamamını — ihbarın alınmasından yangının söndürülmesine ve soğutma çalışmalarına kadar — bir harekât merkezi ortamında canlandırır.',
      'Katılımcılar operatör istasyonlarında görev alır; meteorolojik veri, yangın davranışı modeli ve kaynak durumu ekranlarını okuyarak yer ve hava ekiplerini sevk eder. Senaryo, verilen kararlara göre gerçek zamanlı olarak değişir.',
      'Eğitmen, senaryo denetim konsolundan rüzgâr yönü, yangının sıçraması veya bir ekibin devre dışı kalması gibi olayları anlık olarak devreye sokabilir; böylece karar verme baskısı gerçek koşullara yaklaştırılır.',
    ]),
    useCases: [
      { text: 'Yangın harekât merkezi sevk ve koordinasyon tatbikatı' },
      { text: 'Hava ve yer ekipleri arasındaki telsiz iletişim protokolü uygulaması' },
      { text: 'Çok bölmeli, hızlı yayılan yangın senaryolarında önceliklendirme' },
      { text: 'Karar destek sistemi çıktılarının sevk kararına dönüştürülmesi' },
      { text: 'Olay sonrası karar analizi ve ekip değerlendirmesi' },
    ],
    benefitsForInternational: richText([
      'Senaryolar katılımcı ülkelerin orman tipine, topografyasına ve kaynak envanterine göre uyarlanabilir; böylece eğitim, katılımcının kendi ülkesindeki koşullara doğrudan aktarılabilir.',
      'Oturumlar Türkçe ve İngilizce yürütülebilir, senaryo arayüzü katılımcının diline göre yapılandırılabilir.',
    ]),
    technicalSpecs: [
      { label: 'Operatör istasyonu', value: '12 istasyon (temsilî)' },
      { label: 'Eğitmen konsolu', value: '1 senaryo denetim konsolu (temsilî)' },
      { label: 'Görselleştirme', value: 'Çok ekranlı duvar panosu (temsilî)' },
      { label: 'Senaryo kütüphanesi', value: 'Uyarlanabilir yangın senaryoları (temsilî)' },
      { label: 'Kayıt ve tekrar', value: 'Oturum kaydı ve karar analizi desteği' },
    ],
    capacity: 12,
    supportsRemote: false,
    relatedTopics: fireTopics,
    usageInTraining: richText([
      'OYMES, ileri düzey yangın yönetimi programlarının uygulama bölümünde kullanılır. Katılımcılar teorik oturumlarda öğrendikleri tehlike indekslerini ve sevk protokollerini simülatörde uygular.',
    ]),
  },
  {
    slug: 'btes',
    order: 20,
    title: 'BTES — Bilgisayar Tabanlı Eğitim Sistemi',
    shortCode: 'BTES',
    coverImage: uploaded.btes,
    summary:
      'Teorik modüllerin bireysel hızda çalışılmasını, ölçme-değerlendirmenin dijital ortamda yapılmasını ve uzaktan katılımı sağlayan bilgisayarlı eğitim altyapısı.',
    description: richText([
      'BTES, eğitim programlarının teorik bileşenini bilgisayar başında, katılımcının kendi hızında çalışabileceği modüllere ayırır.',
      'Sistem; ders modülleri, ara ölçme soruları, uygulama alıştırmaları ve final değerlendirmesini tek bir arayüzde toplar. Eğitmen, katılımcı ilerlemesini modül bazında izleyebilir.',
      'Salon oturumlarının yanı sıra uzaktan katılıma da açıktır; bu sayede karma (hibrit) programlarda yurt dışındaki katılımcılar teorik modülleri kendi ülkelerinden tamamlayabilir.',
    ]),
    useCases: [
      { text: 'Teorik modüllerin bireysel hızda çalışılması' },
      { text: 'Ara ölçme ve final değerlendirmesinin dijital yürütülmesi' },
      { text: 'Karma (hibrit) programlarda uzaktan teorik katılım' },
      { text: 'Eğitim öncesi hazırlık modülleri ve seviye tespiti' },
      { text: 'Eğitim sonrası tekrar ve kaynak erişimi' },
    ],
    benefitsForInternational: richText([
      'Modüller çok dilli olarak yapılandırılabilir; katılımcı teorik içeriği kendi çalışma dilinde tamamlayabilir.',
      'Uzaktan erişim, seyahat süresi kısıtlı olan katılımcıların programın teorik bölümünü önceden tamamlayarak Antalya’daki süreyi tamamen uygulamaya ayırmasına imkân verir.',
    ]),
    technicalSpecs: [
      { label: 'Çalışma istasyonu', value: '24 istasyon (temsilî)' },
      { label: 'Erişim', value: 'Salon içi ve uzaktan (temsilî)' },
      { label: 'Ölçme-değerlendirme', value: 'Modül sonu ve final sınavı desteği' },
      { label: 'İlerleme takibi', value: 'Katılımcı bazında modül raporu' },
      { label: 'Dil', value: 'Çok dilli modül yapısı (TR / EN / RU)' },
    ],
    capacity: 24,
    supportsRemote: true,
    relatedTopics: fireTopics,
    usageInTraining: richText([
      'BTES, programların teorik bölümünde ve ölçme-değerlendirme aşamasında kullanılır. Karma programlarda katılımcılar teorik modülleri uzaktan tamamlayıp merkeze uygulama için gelir.',
    ]),
  },
]

/*
  ÇOK DİLLİ İÇERİK — NEDEN GEREKLİ
  ----------------------------------------------------------------------------
  `slug` alanı YERELLEŞTİRİLMİŞTİR (src/fields/slug.ts). Yalnızca TR yazıldığında
  EN/RU slug sütunu boş kalır; detay sayfası `where: { slug: { equals } }` ile
  o dilin sütununa baktığı için sayfa 404 döner. Ölçüldü:
      /tr/simulasyon-merkezi/oymes  -> 200
      /en/simulation-centre/oymes   -> 404   (düzeltilmeden önce)
  Okuma tarafındaki `fallback: true` bunu KURTARMAZ; fallback görüntülemede
  çalışır, `where` sorgusunda çalışmaz.

  Bu yüzden her sistem üç dilde de yazılır. Metinler TR temsilî içeriğin
  çevirisidir; teknik kapasiteler yine TEMSİLÎdir (bkz. dosya başı uyarısı).
*/
type LocaleText = {
  title: string
  slug: string
  summary: string
  description: string[]
  useCases: string[]
  benefits: string[]
  specs: { label: string; value: string }[]
  usage: string[]
}

const translations: Record<string, { en: LocaleText; ru: LocaleText }> = {
  oymes: {
    en: {
      title: 'OYMES — Forest Firefighting Training Simulator',
      slug: 'oymes',
      summary:
        'A full-scale training simulator that reproduces a fire operations centre, allowing participants to make real-time dispatch decisions.',
      description: [
        'OYMES reproduces the entire forest fire response cycle — from the moment a report is received through suppression and mop-up — inside an operations centre environment.',
        'Participants work at operator stations, reading meteorological data, fire behaviour models and resource status screens in order to dispatch ground and aerial teams. The scenario changes in real time according to the decisions taken.',
        'From the scenario control console the instructor can inject events at any moment — a change in wind direction, spotting across a barrier, the loss of a team — bringing decision pressure closer to real conditions.',
      ],
      useCases: [
        'Fire operations centre dispatch and coordination exercises',
        'Radio communication protocol practice between aerial and ground teams',
        'Prioritisation in multi-sector, rapidly spreading fire scenarios',
        'Translating decision-support system output into dispatch decisions',
        'Post-incident decision analysis and team debriefing',
      ],
      benefits: [
        'Scenarios can be adapted to the forest type, topography and resource inventory of participating countries, so the training transfers directly to conditions in the participant’s own country.',
        'Sessions can be delivered in Turkish and English, and the scenario interface can be configured in the participant’s language.',
      ],
      specs: [
        { label: 'Operator stations', value: '12 stations (representative)' },
        { label: 'Instructor console', value: '1 scenario control console (representative)' },
        { label: 'Visualisation', value: 'Multi-screen video wall (representative)' },
        { label: 'Scenario library', value: 'Adaptable fire scenarios (representative)' },
        { label: 'Record and replay', value: 'Session recording and decision analysis support' },
      ],
      usage: [
        'OYMES is used in the practical component of advanced fire management programmes. Participants apply the hazard indices and dispatch protocols learned in theory sessions directly in the simulator.',
      ],
    },
    ru: {
      title: 'OYMES — тренажёр по борьбе с лесными пожарами',
      slug: 'oymes',
      summary:
        'Полномасштабный учебный тренажёр, воспроизводящий центр управления тушением пожара и позволяющий участникам принимать решения о направлении сил в реальном времени.',
      description: [
        'OYMES воспроизводит весь цикл реагирования на лесной пожар — от приёма сообщения до тушения и дотушивания — в условиях оперативного центра.',
        'Участники работают на операторских станциях: считывают метеоданные, модель поведения пожара и состояние ресурсов, направляя наземные и авиационные группы. Сценарий меняется в реальном времени в зависимости от принятых решений.',
        'С пульта управления сценарием инструктор может в любой момент ввести событие — смену направления ветра, переброс огня, потерю группы, — приближая нагрузку при принятии решений к реальной.',
      ],
      useCases: [
        'Учения по управлению и координации в центре тушения пожара',
        'Отработка протокола радиосвязи между авиационными и наземными группами',
        'Расстановка приоритетов при многоочаговых быстро развивающихся пожарах',
        'Перевод данных системы поддержки решений в конкретные распоряжения',
        'Разбор принятых решений и оценка работы группы после происшествия',
      ],
      benefits: [
        'Сценарии адаптируются к типу леса, рельефу и составу сил стран-участниц, поэтому обучение напрямую переносится на условия страны участника.',
        'Занятия могут проводиться на турецком и английском языках, интерфейс сценария настраивается на язык участника.',
      ],
      specs: [
        { label: 'Операторские станции', value: '12 станций (ориентировочно)' },
        { label: 'Пульт инструктора', value: '1 пульт управления сценарием (ориентировочно)' },
        { label: 'Визуализация', value: 'Многоэкранная видеостена (ориентировочно)' },
        { label: 'Библиотека сценариев', value: 'Адаптируемые сценарии пожаров (ориентировочно)' },
        { label: 'Запись и повтор', value: 'Запись сессии и поддержка разбора решений' },
      ],
      usage: [
        'OYMES используется в практической части программ повышенного уровня по управлению пожарами. Участники применяют изученные индексы опасности и протоколы направления сил непосредственно на тренажёре.',
      ],
    },
  },
  btes: {
    en: {
      title: 'BTES — Computer-Based Training System',
      slug: 'btes',
      summary:
        'A computer-based training infrastructure for self-paced theory modules, digital assessment and remote participation.',
      description: [
        'BTES breaks the theoretical component of training programmes into modules that participants work through at their own pace at a workstation.',
        'The system brings course modules, interim assessment questions, practice exercises and the final evaluation together in a single interface. Instructors can follow participant progress module by module.',
        'In addition to classroom sessions it is open to remote participation, so in blended programmes participants abroad can complete the theory modules from their own country.',
      ],
      useCases: [
        'Self-paced study of theory modules',
        'Digital delivery of interim and final assessment',
        'Remote theory participation in blended programmes',
        'Pre-course preparation modules and level assessment',
        'Post-course revision and access to resources',
      ],
      benefits: [
        'Modules can be configured multilingually, so participants complete the theoretical content in their own working language.',
        'Remote access allows participants with limited travel time to complete the theory component in advance and devote their time in Antalya entirely to practice.',
      ],
      specs: [
        { label: 'Workstations', value: '24 stations (representative)' },
        { label: 'Access', value: 'On-site and remote (representative)' },
        { label: 'Assessment', value: 'End-of-module and final examination support' },
        { label: 'Progress tracking', value: 'Per-participant module reporting' },
        { label: 'Language', value: 'Multilingual module structure (TR / EN / RU)' },
      ],
      usage: [
        'BTES is used in the theoretical component of programmes and at the assessment stage. In blended programmes participants complete the theory modules remotely and come to the centre for the practical work.',
      ],
    },
    ru: {
      title: 'BTES — компьютерная система обучения',
      slug: 'btes',
      summary:
        'Компьютерная учебная инфраструктура для самостоятельного изучения теоретических модулей, цифрового контроля знаний и дистанционного участия.',
      description: [
        'BTES разделяет теоретическую часть учебных программ на модули, которые участник изучает за компьютером в удобном для себя темпе.',
        'Система объединяет в одном интерфейсе учебные модули, промежуточные контрольные вопросы, практические задания и итоговую аттестацию. Преподаватель отслеживает прогресс участника по каждому модулю.',
        'Помимо аудиторных занятий система открыта для дистанционного участия: в смешанных программах участники из других стран проходят теоретические модули у себя дома.',
      ],
      useCases: [
        'Самостоятельное изучение теоретических модулей',
        'Проведение промежуточной и итоговой аттестации в цифровом виде',
        'Дистанционное освоение теории в смешанных программах',
        'Подготовительные модули и определение уровня перед началом обучения',
        'Повторение материала и доступ к ресурсам после обучения',
      ],
      benefits: [
        'Модули могут быть многоязычными, поэтому участник осваивает теорию на своём рабочем языке.',
        'Дистанционный доступ позволяет участникам с ограниченным временем поездки заранее пройти теоретическую часть и посвятить время в Анталье целиком практике.',
      ],
      specs: [
        { label: 'Рабочие станции', value: '24 станции (ориентировочно)' },
        { label: 'Доступ', value: 'В аудитории и дистанционно (ориентировочно)' },
        { label: 'Контроль знаний', value: 'Поддержка модульных и итогового экзаменов' },
        { label: 'Отслеживание прогресса', value: 'Отчёт по модулям для каждого участника' },
        { label: 'Язык', value: 'Многоязычная структура модулей (TR / EN / RU)' },
      ],
      usage: [
        'BTES используется в теоретической части программ и на этапе аттестации. В смешанных программах участники проходят теорию дистанционно и приезжают в центр для практических занятий.',
      ],
    },
  },
}

const createdIds: number[] = []

for (const system of systems) {
  const doc = await payload.create({
    collection: 'simulation-systems',
    locale: 'tr',
    ...CTX,
    data: { ...system, _status: 'published' } as never,
  })
  const d = doc as unknown as { id: number }
  createdIds.push(d.id)
  console.log(`sistem oluşturuldu: #${d.id} ${system.shortCode}`)

  // Aynı kaydın EN ve RU sürümleri — slug yerelleştirilmiş olduğu için ŞART.
  for (const locale of ['en', 'ru'] as const) {
    const tx = translations[system.slug]?.[locale]
    if (!tx) continue
    await payload.update({
      collection: 'simulation-systems',
      id: d.id,
      locale,
      ...CTX,
      data: {
        title: tx.title,
        slug: tx.slug,
        summary: tx.summary,
        description: richText(tx.description),
        useCases: tx.useCases.map((text) => ({ text })),
        benefitsForInternational: richText(tx.benefits),
        technicalSpecs: tx.specs,
        usageInTraining: richText(tx.usage),
        _status: 'published',
      } as never,
    })
    console.log(`  ${locale.toUpperCase()} çevirisi yazıldı -> /${locale}/.../${tx.slug}`)
  }
}

// --- Sayfa global'i --------------------------------------------------------
await payload.updateGlobal({
  slug: 'simulation-center',
  locale: 'tr',
  ...CTX,
  data: {
    title: 'Simülasyon Merkezi',
    purpose: richText([
      'Simülasyon Merkezi, orman yangınlarıyla mücadelede karar verme yetkinliğinin yalnızca teorik eğitimle kazanılamayacağı gerçeğinden hareketle kurulmuştur.',
      'Merkez, katılımcıların gerçek bir yangında karşılaşacakları zaman baskısını, eksik bilgiyi ve hızla değişen koşulları risksiz bir ortamda deneyimlemesini sağlar. Böylece sahada yapılacak hatalar, önce simülatörde yapılır ve tartışılır.',
    ]),
    roleInFireTraining: richText([
      'Yangın eğitimlerinde simülasyon, teorik oturumla saha tatbikatı arasındaki köprüdür. Katılımcı, öğrendiği tehlike indeksini ve sevk protokolünü önce simülatörde uygular; sahaya çıktığında karar mekanizması hazırdır.',
      'Simülatör ayrıca sahada tekrarlanması güç veya tehlikeli olan senaryoların (gece müdahalesi, çok bölmeli yangın, ekip kaybı) güvenle çalışılmasına imkân verir.',
    ]),
    relationToTraining: richText([
      'Merkez bağımsız bir birim değildir; eğitim programlarının uygulama bileşenidir. Hangi programda hangi sistemin kullanıldığı, ilgili eğitimin detay sayfasında ve bu sayfadaki sistem kartlarında çapraz olarak gösterilir.',
    ]),
    ...(uploaded.hero ? { heroImage: uploaded.hero } : {}),
    /*
      `capacityHighlights` bir "değer + etiket" çiftidir ({ value, label }),
      düz metin listesi değil — sayfada büyük rakam + altında açıklama olarak
      basılır. İlk denemede `{ text }` gönderilip doğrulama hatası alındı.
      Rakamlar TEMSİLİDİR (bkz. dosya başındaki uyarı).
    */
    capacityHighlights: [
      { value: '2', label: 'ana simülasyon sistemi (OYMES ve BTES)' },
      { value: '36', label: 'toplam çalışma istasyonu (temsilî)' },
      { value: 'TR / EN / RU', label: 'oturum dili' },
      { value: 'Hibrit', label: 'uzaktan katılıma açık program desteği' },
    ],
  } as never,
})
console.log('sayfa global’i güncellendi (simulation-center)')

/*
  Global de yerelleştirilmiş alanlar taşır. TR yazılıp bırakılırsa EN/RU
  ziyaretçisi `fallback: true` sayesinde Türkçe metni görür — sayfa açılır ama
  dili yanlıştır. Üç dil de açıkça yazılır.
*/
const globalLocales = {
  en: {
    title: 'Simulation Centre',
    purpose: [
      'The Simulation Centre was established on the premise that decision-making competence in forest firefighting cannot be acquired through theoretical training alone.',
      'It lets participants experience the time pressure, incomplete information and rapidly changing conditions of a real fire in a risk-free environment. Mistakes that would otherwise be made in the field are made — and discussed — in the simulator first.',
    ],
    role: [
      'In fire training, simulation is the bridge between the theory session and the field exercise. Participants first apply the hazard index and dispatch protocol they have learned in the simulator, so that their decision-making is ready when they reach the field.',
      'The simulator also makes it possible to work safely through scenarios that are difficult or dangerous to repeat in the field — night operations, multi-sector fires, the loss of a team.',
    ],
    relation: [
      'The centre is not a stand-alone unit; it is the practical component of the training programmes. Which system is used in which programme is shown as a cross-reference both on the training detail page and on the system cards on this page.',
    ],
    highlights: [
      { value: '2', label: 'main simulation systems (OYMES and BTES)' },
      { value: '36', label: 'workstations in total (representative)' },
      { value: 'TR / EN / RU', label: 'session languages' },
      { value: 'Blended', label: 'programmes open to remote participation' },
    ],
  },
  ru: {
    title: 'Центр симуляции',
    purpose: [
      'Центр симуляции создан исходя из того, что умение принимать решения при борьбе с лесными пожарами невозможно приобрести только теоретическим обучением.',
      'Центр позволяет участникам в безопасных условиях пережить дефицит времени, нехватку информации и быстро меняющуюся обстановку реального пожара. Ошибки, которые были бы допущены на местности, сначала совершаются и разбираются на тренажёре.',
    ],
    role: [
      'В обучении по пожарам симуляция — это мост между теоретическим занятием и полевыми учениями. Участник сначала применяет изученный индекс опасности и порядок направления сил на тренажёре, и к выходу на местность механизм принятия решений уже отработан.',
      'Тренажёр также позволяет безопасно отрабатывать сценарии, которые трудно или опасно повторить в полевых условиях: ночное тушение, многоочаговый пожар, потеря группы.',
    ],
    relation: [
      'Центр не является самостоятельным подразделением — это практическая составляющая учебных программ. Какая система используется в какой программе, показано перекрёстно на странице обучения и на карточках систем на этой странице.',
    ],
    highlights: [
      { value: '2', label: 'основные системы симуляции (OYMES и BTES)' },
      { value: '36', label: 'рабочих станций всего (ориентировочно)' },
      { value: 'TR / EN / RU', label: 'языки занятий' },
      { value: 'Смешанный', label: 'программы с возможностью дистанционного участия' },
    ],
  },
} as const

for (const locale of ['en', 'ru'] as const) {
  const g = globalLocales[locale]
  await payload.updateGlobal({
    slug: 'simulation-center',
    locale,
    ...CTX,
    data: {
      title: g.title,
      purpose: richText([...g.purpose]),
      roleInFireTraining: richText([...g.role]),
      relationToTraining: richText([...g.relation]),
      capacityHighlights: g.highlights.map((h) => ({ value: h.value, label: h.label })),
    } as never,
  })
  console.log(`sayfa global'i güncellendi (${locale})`)
}


// --- Eğitim ilişkisini kur -------------------------------------------------
const training = await payload.find({
  collection: 'training-programs',
  locale: 'tr',
  where: { slug: { equals: TRAINING_SLUG } },
  limit: 1,
  depth: 0,
})

if (training.docs.length === 0) {
  console.warn(`UYARI: "${TRAINING_SLUG}" eğitimi bulunamadı, ilişki kurulamadı.`)
  console.warn('Önce: corepack pnpm exec tsx src/scripts/seed-training-demo.ts')
} else {
  const id = training.docs[0].id
  await payload.update({
    collection: 'training-programs',
    id,
    locale: 'tr',
    ...CTX,
    data: { usesSimulation: true, simulationSystems: createdIds } as never,
  })
  console.log(`eğitim #${id} → simulationSystems = [${createdIds.join(', ')}]`)
}

// --- Doğrulama -------------------------------------------------------------
const check = await payload.find({
  collection: 'simulation-systems',
  locale: 'tr',
  where: { slug: { in: SYSTEM_SLUGS } },
  limit: 10,
  depth: 1,
})

console.log('\nkurulan sistemler:')
for (const doc of check.docs) {
  const x = doc as unknown as Record<string, any>
  console.log(
    `  ${String(x.shortCode).padEnd(6)} #${x.id}`,
    '| kapak:', x.coverImage?.filename ?? '(yok)',
    '| kapasite:', x.capacity,
    '| uzaktan:', x.supportsRemote,
    '| özellik:', (x.technicalSpecs ?? []).length,
    '| kullanım:', (x.useCases ?? []).length,
    '|', x._status,
  )
}

const linked = await payload.find({
  collection: 'training-programs',
  locale: 'tr',
  where: { slug: { equals: TRAINING_SLUG } },
  limit: 1,
  depth: 1,
})
const linkedSystems = (linked.docs[0] as unknown as { simulationSystems?: { shortCode?: string }[] })
  ?.simulationSystems

console.log(
  '\neğitim ilişkisi:',
  (linkedSystems ?? []).map((s) => s.shortCode).join(', ') || '(bağlanmadı)',
)

const ok =
  check.totalDocs === 2 &&
  check.docs.every((d) => Boolean((d as unknown as { coverImage?: unknown }).coverImage)) &&
  (linkedSystems ?? []).length === 2

console.log(ok ? '\nSONUÇ: sistemler kuruldu ve eğitime bağlandı.' : '\nSONUÇ: EKSİK VAR.')
process.exit(ok ? 0 : 1)
