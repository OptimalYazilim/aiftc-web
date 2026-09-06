/**
 * BASLANGIC VERISI  —  pnpm seed
 * ============================================================================
 * Amac: bos bir veritabanini, ana sayfanin ve egitim bolumlerinin GERCEKCI
 * gorunecegi kadar icerikle doldurmak. Boylece tasarim, erisilebilirlik ve
 * cok dillilik "Henuz icerik eklenmedi" ekraninda degil, gercek veriyle
 * dogrulanabilir.
 *
 * IKI KURAL
 *   1. IDEMPOTENT — birden fazla kez calistirilabilir. Var olan kayitlar
 *      (slug / kod / sembol ile aranir) yeniden olusturulmaz, uzerine
 *      yazilmaz. Kismi calisan bir seed tekrar calistirilarak tamamlanabilir.
 *   2. URETIMDE CALISTIRILMAZ — yalnizca gelistirme ve demo ortamlari icin.
 *      `NODE_ENV=production` ise betik hicbir sey yapmadan durur.
 *
 * COK DILLILIK
 *   Her kayit once TR ile olusturulur, ardindan EN ve RU cevirileri ayri
 *   `update` cagrilariyla yazilir. Slug her dilde AYRIDIR (Sartname 5 —
 *   "URL yapisi cok dilli kullanima uygun olmalidir").
 *
 * REVALIDATION
 *   `next/cache` fonksiyonlari yalnizca bir Next.js istegi icinde calisir.
 *   Bu betik tek basina bir Node islemidir; bu yuzden tum yazma islemleri
 *   `context: { skipRevalidate: true }` ile yapilir (bkz. hooks/revalidate.ts).
 * ============================================================================
 */
import 'dotenv/config'
import { getPayload, type Payload } from 'payload'

import config from '../payload.config.js'
import { CONTACT_FORM_TITLE } from '../lib/contactForm.js'
import { appendMenuRoute, MENU_ADDITIONS } from './menuTools.js'

/** Tum yazma islemlerinde kullanilan ortak baglam. */
const CTX = { context: { skipRevalidate: true } } as const

type Locale = 'tr' | 'en' | 'ru'
const TRANSLATIONS: Locale[] = ['en', 'ru']

/**
 * Lexical richText govdesi uretir. Payload'in editor semasi katidir; en kucuk
 * gecerli bicim budur. `as never`: uretilen JSON tum richText alanlarina
 * uyar, koleksiyon bazli tiplerle ayri ayri ugrasmaya gerek kalmaz.
 */
const richText = (...paragraphs: string[]) =>
  ({
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        textFormat: 0,
        textStyle: '',
        children: [
          { type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text, version: 1 },
        ],
      })),
    },
  }) as never

/** Kaydin TR slug'i ile var olup olmadigina bakar; varsa id'sini doner. */
const findBySlug = async (
  payload: Payload,
  collection: 'training-topics' | 'training-programs' | 'news',
  slug: string,
): Promise<string | number | null> => {
  const found = await payload.find({
    collection,
    locale: 'tr',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })

  return found.docs[0]?.id ?? null
}

// ===========================================================================
// EGITIM KONULARI  (Sartname 6.3)
// ===========================================================================

type TopicContent = {
  slug: string
  title: string
  summary: string
  targetAudience: string
}

type TopicSeed = {
  order: number
  category: string
  level: string[]
  librarySubjectKey: string
  usesSimulation?: boolean
} & Record<Locale, TopicContent>

const TOPICS: TopicSeed[] = [
  {
    order: 10,
    category: 'integrated-fire-management',
    level: ['intermediate', 'advanced', 'tot'],
    librarySubjectKey: 'integrated-fire-management',
    usesSimulation: true,
    tr: {
      slug: 'entegre-orman-yangini-yonetimi',
      title: 'Entegre Orman Yangını Yönetimi',
      summary:
        'Yangın öncesi risk azaltma, müdahale organizasyonu ve yangın sonrası rehabilitasyonu bütüncül biçimde ele alan; saha uygulaması ve simülasyon destekli eğitim alanı.',
      targetAudience:
        'Orman yangınlarıyla mücadele birimlerinde görevli teknik personel, harekât merkezi yöneticileri ve ilgili kurum uzmanları.',
    },
    en: {
      slug: 'integrated-forest-fire-management',
      title: 'Integrated Forest Fire Management',
      summary:
        'A holistic thematic area covering pre-fire risk reduction, response organisation and post-fire rehabilitation, supported by field exercises and simulation.',
      targetAudience:
        'Technical staff of forest fire units, incident command personnel and specialists from partner institutions.',
    },
    ru: {
      slug: 'kompleksnoe-upravlenie-lesnymi-pozharami',
      title: 'Комплексное управление лесными пожарами',
      summary:
        'Целостное направление, охватывающее снижение риска до пожара, организацию реагирования и послепожарное восстановление, с полевыми занятиями и симуляцией.',
      targetAudience:
        'Технический персонал подразделений по борьбе с лесными пожарами, руководители оперативных центров и специалисты партнёрских организаций.',
    },
  },
  {
    order: 20,
    category: 'sfm',
    level: ['basic', 'intermediate'],
    librarySubjectKey: 'sustainable-forest-management',
    tr: {
      slug: 'surdurulebilir-orman-yonetimi',
      title: 'Sürdürülebilir Orman Yönetimi',
      summary:
        'Orman kaynaklarının ekolojik, ekonomik ve sosyal işlevlerini birlikte gözeten planlama yaklaşımları, ulusal orman envanteri ve izleme sistemleri.',
      targetAudience:
        'Orman amenajmanı ve planlama birimleri, envanter ekipleri ve orman politikası uzmanları.',
    },
    en: {
      slug: 'sustainable-forest-management',
      title: 'Sustainable Forest Management',
      summary:
        'Planning approaches that balance the ecological, economic and social functions of forest resources, together with national forest inventory and monitoring systems.',
      targetAudience:
        'Forest management planning units, inventory teams and forest policy specialists.',
    },
    ru: {
      slug: 'ustoychivoe-lesoupravlenie',
      title: 'Устойчивое лесоуправление',
      summary:
        'Подходы к планированию, учитывающие экологические, экономические и социальные функции лесов, а также системы национальной инвентаризации и мониторинга.',
      targetAudience:
        'Подразделения лесоустройства, группы инвентаризации и специалисты по лесной политике.',
    },
  },
  {
    order: 30,
    category: 'flr',
    level: ['intermediate', 'tot'],
    librarySubjectKey: 'forest-landscape-restoration',
    tr: {
      slug: 'orman-peyzaj-restorasyonu',
      title: 'Orman Peyzaj Restorasyonu',
      summary:
        'Bozulmuş orman ekosistemlerinin peyzaj ölçeğinde iyileştirilmesi, tür seçimi, restorasyon planlaması ve yerel toplulukların sürece katılımı.',
      targetAudience:
        'Ağaçlandırma ve erozyon kontrolü birimleri, havza planlaması uzmanları ve proje yürütücüleri.',
    },
    en: {
      slug: 'forest-landscape-restoration',
      title: 'Forest Landscape Restoration',
      summary:
        'Restoring degraded forest ecosystems at landscape scale: species selection, restoration planning and the participation of local communities.',
      targetAudience:
        'Afforestation and erosion control units, watershed planning specialists and project coordinators.',
    },
    ru: {
      slug: 'vosstanovlenie-lesnykh-landshaftov',
      title: 'Восстановление лесных ландшафтов',
      summary:
        'Восстановление деградированных лесных экосистем на ландшафтном уровне: подбор пород, планирование и участие местных сообществ.',
      targetAudience:
        'Подразделения облесения и борьбы с эрозией, специалисты по планированию водосборов и руководители проектов.',
    },
  },
  {
    order: 40,
    category: 'gis-rs',
    level: ['basic', 'intermediate', 'advanced'],
    librarySubjectKey: 'gis-remote-sensing',
    usesSimulation: true,
    tr: {
      slug: 'cbs-ve-uzaktan-algilama',
      title: 'CBS ve Uzaktan Algılama',
      summary:
        'Uydu görüntüleriyle orman örtüsü değişiminin izlenmesi, yangın alanlarının haritalanması ve karar destek sistemleri için coğrafi veri üretimi.',
      targetAudience:
        'CBS birimleri, uzaktan algılama analistleri ve orman izleme sistemlerinde çalışan teknik personel.',
    },
    en: {
      slug: 'gis-and-remote-sensing',
      title: 'GIS and Remote Sensing',
      summary:
        'Monitoring forest cover change with satellite imagery, mapping burnt areas and producing geospatial data for decision support systems.',
      targetAudience:
        'GIS units, remote sensing analysts and technical staff working on forest monitoring systems.',
    },
    ru: {
      slug: 'gis-i-distantsionnoe-zondirovanie',
      title: 'ГИС и дистанционное зондирование',
      summary:
        'Мониторинг изменений лесного покрова по спутниковым снимкам, картирование гарей и подготовка геоданных для систем поддержки решений.',
      targetAudience:
        'Подразделения ГИС, аналитики ДЗЗ и технический персонал систем мониторинга лесов.',
    },
  },
  {
    order: 50,
    category: 'nursery-afforestation',
    level: ['basic', 'intermediate'],
    librarySubjectKey: 'nursery-afforestation',
    tr: {
      slug: 'fidanlik-ve-agaclandirma',
      title: 'Fidanlık ve Ağaçlandırma',
      summary:
        'Kaliteli fidan üretimi, tohum kaynaklarının yönetimi, dikim teknikleri ve kurak alanlarda ağaçlandırma başarısını artıran uygulamalar.',
      targetAudience:
        'Fidanlık müdürlükleri, ağaçlandırma şeflikleri ve tohum ıslahı üzerinde çalışan teknik personel.',
    },
    en: {
      slug: 'nursery-and-afforestation',
      title: 'Nursery Management and Afforestation',
      summary:
        'Quality seedling production, seed source management, planting techniques and practices that improve afforestation success in dry areas.',
      targetAudience:
        'Nursery directorates, afforestation units and technical staff working on seed improvement.',
    },
    ru: {
      slug: 'pitomniki-i-oblesenie',
      title: 'Питомники и облесение',
      summary:
        'Производство качественного посадочного материала, управление семенными источниками, техника посадки и повышение приживаемости в засушливых районах.',
      targetAudience:
        'Управления питомников, подразделения облесения и специалисты по селекции семян.',
    },
  },
  {
    order: 60,
    category: 'climate-change',
    level: ['intermediate', 'advanced'],
    librarySubjectKey: 'climate-change',
    tr: {
      slug: 'iklim-degisikligi-ve-ormancilik',
      title: 'İklim Değişikliği ve Ormancılık',
      summary:
        'Ormanların karbon yutak kapasitesi, iklim değişikliğine uyum stratejileri ve Akdeniz havzasında değişen yangın rejimlerinin yönetime etkileri.',
      targetAudience:
        'Orman politikası ve iklim müzakereleri ile ilgilenen uzmanlar, araştırmacılar ve planlama birimleri.',
    },
    en: {
      slug: 'climate-change-and-forestry',
      title: 'Climate Change and Forestry',
      summary:
        'The carbon sink capacity of forests, adaptation strategies and the management implications of changing fire regimes in the Mediterranean basin.',
      targetAudience:
        'Specialists working on forest policy and climate negotiations, researchers and planning units.',
    },
    ru: {
      slug: 'izmenenie-klimata-i-lesnoe-khozyaystvo',
      title: 'Изменение климата и лесное хозяйство',
      summary:
        'Углеродопоглощающая способность лесов, стратегии адаптации и последствия изменения пожарных режимов Средиземноморья для управления.',
      targetAudience:
        'Специалисты по лесной политике и климатическим переговорам, исследователи и подразделения планирования.',
    },
  },
]

// ===========================================================================
// EGITIM PROGRAMLARI  (Sartname 6.4 / EK-2 2.1-2.4)
// ===========================================================================

type ProgramContent = {
  slug: string
  title: string
  summary: string
  venue: string
  targetAudience: string
  objective: string[]
  outcomes: string[]
}

type ProgramSeed = {
  code: string
  status: string
  featured: boolean
  topics: string[]
  startDate: string
  endDate: string
  durationDays: number
  deliveryMode: string
  level: string
  instructionLanguages: string[]
  participantCountries: string[]
  quota: number
  certificateType: string
  applicationDeadline?: string
  application: { type: string; portalPath?: string; email?: string; contactUnit?: string }
  usesSimulation?: boolean
  hasFieldExercise?: boolean
  libraryCollectionKey: string
  participantCount?: number
} & Record<Locale, ProgramContent>

const PROGRAMS: ProgramSeed[] = [
  {
    code: 'AIFTC-2026-FLR-04',
    status: 'ongoing',
    featured: true,
    topics: ['orman-peyzaj-restorasyonu', 'iklim-degisikligi-ve-ormancilik'],
    startDate: '2026-09-01',
    endDate: '2026-09-11',
    durationDays: 11,
    deliveryMode: 'in-person',
    level: 'tot',
    instructionLanguages: ['en', 'ru'],
    participantCountries: ['TR', 'AZ', 'KZ', 'KG', 'TJ', 'UZ'],
    quota: 24,
    certificateType: 'tot',
    application: { type: 'portal', portalPath: '/basvuru' },
    hasFieldExercise: true,
    libraryCollectionKey: 'flr-tot-2026',
    tr: {
      slug: 'orman-peyzaj-restorasyonu-egitici-egitimi-2026',
      title: 'Orman Peyzaj Restorasyonu Eğitici Eğitimi (ToT)',
      summary:
        'Katılımcıların kendi kurumlarında restorasyon eğitimi verebilmesini hedefleyen, saha uygulamalarıyla desteklenen iki haftalık eğitici eğitimi programı.',
      venue: 'AIFTC Kampüsü ve Düzlerçamı Uygulama Ormanı, Antalya',
      targetAudience:
        'Orta Asya ülkelerinden ağaçlandırma ve restorasyon birimlerinde görevli, kurumunda eğitim verecek teknik personel.',
      objective: [
        'Program, orman peyzaj restorasyonu ilkelerini yalnızca aktarmayı değil, katılımcıların bu bilgiyi kendi kurumlarında yeniden öğretebilmesini hedefler.',
        'Eğitim sonunda her katılımcı, kendi ülkesinin koşullarına uyarlanmış bir restorasyon eğitim modülü tasarlamış olur.',
      ],
      outcomes: [
        'Peyzaj ölçeğinde restorasyon önceliklendirmesi yapabilme',
        'Yetişkin eğitimi yöntemleriyle teknik içerik aktarabilme',
        'Restorasyon izleme göstergelerini tanımlayabilme',
      ],
    },
    en: {
      slug: 'forest-landscape-restoration-tot-2026',
      title: 'Training of Trainers on Forest Landscape Restoration',
      summary:
        'A two-week training of trainers programme, supported by field exercises, enabling participants to deliver restoration training within their own institutions.',
      venue: 'AIFTC Campus and Düzlerçamı Demonstration Forest, Antalya',
      targetAudience:
        'Technical staff from afforestation and restoration units in Central Asian countries who will train colleagues in their own institutions.',
      objective: [
        'The programme aims not only to convey the principles of forest landscape restoration, but to enable participants to teach them again in their own institutions.',
        'By the end of the course each participant has designed a restoration training module adapted to the conditions of their own country.',
      ],
      outcomes: [
        'Prioritising restoration interventions at landscape scale',
        'Delivering technical content using adult learning methods',
        'Defining indicators for restoration monitoring',
      ],
    },
    ru: {
      slug: 'podgotovka-trenerov-po-vosstanovleniyu-lesnykh-landshaftov-2026',
      title: 'Подготовка тренеров по восстановлению лесных ландшафтов',
      summary:
        'Двухнедельная программа подготовки тренеров с полевыми занятиями, позволяющая участникам проводить обучение по восстановлению в своих организациях.',
      venue: 'Кампус AIFTC и демонстрационный лес Дюзлерчамы, Анталья',
      targetAudience:
        'Технический персонал подразделений облесения и восстановления стран Центральной Азии, который будет обучать коллег.',
      objective: [
        'Программа нацелена не только на передачу принципов восстановления лесных ландшафтов, но и на способность участников преподавать их в своих организациях.',
        'К концу курса каждый участник разрабатывает учебный модуль, адаптированный к условиям своей страны.',
      ],
      outcomes: [
        'Определение приоритетов восстановления на ландшафтном уровне',
        'Передача технического содержания методами обучения взрослых',
        'Определение показателей мониторинга восстановления',
      ],
    },
  },
  {
    code: 'AIFTC-2026-GIS-03',
    status: 'applications-open',
    featured: true,
    topics: ['cbs-ve-uzaktan-algilama', 'surdurulebilir-orman-yonetimi'],
    startDate: '2026-10-19',
    endDate: '2026-10-23',
    durationDays: 5,
    deliveryMode: 'hybrid',
    level: 'intermediate',
    instructionLanguages: ['en'],
    participantCountries: ['TR', 'AZ', 'KZ', 'KG', 'TJ', 'TM', 'UZ'],
    quota: 30,
    certificateType: 'certificate',
    applicationDeadline: '2026-10-03',
    application: { type: 'portal', portalPath: '/basvuru' },
    libraryCollectionKey: 'gis-rs-2026',
    tr: {
      slug: 'uzaktan-algilama-ile-orman-izleme-2026',
      title: 'Uzaktan Algılama ile Orman İzleme',
      summary:
        'Açık kaynaklı uydu verileriyle orman örtüsü değişiminin ve yanan alanların haritalanması; karma (hibrit) yürütülen beş günlük uygulamalı eğitim.',
      venue: 'AIFTC Bilişim Laboratuvarı, Antalya (çevrim içi katılım mümkündür)',
      targetAudience:
        'CBS ve uzaktan algılama birimlerinde çalışan, temel düzeyde coğrafi veri deneyimi olan teknik personel.',
      objective: [
        'Eğitim, ücretli yazılım gerektirmeyen bir iş akışı kurar: veri temini, ön işleme, sınıflandırma ve doğruluk değerlendirmesi açık kaynaklı araçlarla yapılır.',
        'Katılımcılar kendi ülkelerine ait bir çalışma alanı üzerinde uygulama yaparak eğitimi tamamlar.',
      ],
      outcomes: [
        'Uydu görüntülerini ön işleme ve mozaikleme',
        'Yanan alan indekslerini hesaplayarak haritalama',
        'Sınıflandırma doğruluğunu hata matrisiyle raporlama',
      ],
    },
    en: {
      slug: 'forest-monitoring-with-remote-sensing-2026',
      title: 'Forest Monitoring with Remote Sensing',
      summary:
        'Mapping forest cover change and burnt areas with open satellite data — a five-day hands-on course delivered in hybrid format.',
      venue: 'AIFTC Computer Laboratory, Antalya (online participation possible)',
      targetAudience:
        'Technical staff in GIS and remote sensing units with basic experience of geospatial data.',
      objective: [
        'The course builds a workflow that requires no commercial software: acquisition, pre-processing, classification and accuracy assessment all use open-source tools.',
        'Participants complete the course by working on a study area in their own country.',
      ],
      outcomes: [
        'Pre-processing and mosaicking satellite imagery',
        'Mapping burnt areas using spectral indices',
        'Reporting classification accuracy with a confusion matrix',
      ],
    },
    ru: {
      slug: 'monitoring-lesov-s-pomoshchyu-dzz-2026',
      title: 'Мониторинг лесов средствами дистанционного зондирования',
      summary:
        'Картирование изменений лесного покрова и гарей по открытым спутниковым данным — пятидневный практический курс в смешанном формате.',
      venue: 'Компьютерная лаборатория AIFTC, Анталья (возможно онлайн-участие)',
      targetAudience:
        'Технический персонал подразделений ГИС и ДЗЗ с базовым опытом работы с геоданными.',
      objective: [
        'Курс строит рабочий процесс, не требующий коммерческого ПО: получение данных, предобработка, классификация и оценка точности выполняются открытыми инструментами.',
        'Участники завершают курс, работая с тестовым участком в своей стране.',
      ],
      outcomes: [
        'Предобработка и мозаика спутниковых снимков',
        'Картирование гарей с помощью спектральных индексов',
        'Отчёт о точности классификации по матрице ошибок',
      ],
    },
  },
  {
    code: 'AIFTC-2026-IFM-01',
    status: 'applications-open',
    featured: true,
    topics: ['entegre-orman-yangini-yonetimi', 'cbs-ve-uzaktan-algilama'],
    startDate: '2026-11-09',
    endDate: '2026-11-20',
    durationDays: 12,
    deliveryMode: 'in-person',
    level: 'advanced',
    instructionLanguages: ['en', 'ru'],
    participantCountries: ['TR', 'AZ', 'KZ', 'KG', 'TJ', 'TM', 'UZ'],
    quota: 20,
    certificateType: 'certificate',
    applicationDeadline: '2026-10-16',
    application: { type: 'portal', portalPath: '/basvuru' },
    usesSimulation: true,
    hasFieldExercise: true,
    libraryCollectionKey: 'ifm-2026',
    tr: {
      slug: 'entegre-orman-yangini-yonetimi-egitimi-2026',
      title: 'Entegre Orman Yangını Yönetimi Eğitimi',
      summary:
        'Yangın öncesi planlamadan harekât yönetimine ve yangın sonrası rehabilitasyona uzanan, simülasyon merkezi ve saha tatbikatıyla desteklenen ileri düzey program.',
      venue: 'AIFTC Kampüsü ve Simülasyon Merkezi, Antalya',
      targetAudience:
        'Orman yangını harekât merkezlerinde karar verici konumdaki teknik personel ve yangın müdahale ekip amirleri.',
      objective: [
        'Program, yangınla mücadeleyi tek bir müdahale anı olarak değil; risk azaltma, hazırlık, müdahale ve iyileştirmeden oluşan bir döngü olarak ele alır.',
        'Simülasyon merkezinde yürütülen senaryolar, gerçek bir harekât merkezinin karar akışını birebir tekrar eder.',
      ],
      outcomes: [
        'Yangın davranışını hava ve yakıt verisine göre öngörebilme',
        'Olay komuta sistemi içinde görev dağılımı yapabilme',
        'Yangın sonrası rehabilitasyon önceliklerini belirleyebilme',
      ],
    },
    en: {
      slug: 'integrated-forest-fire-management-course-2026',
      title: 'Integrated Forest Fire Management Course',
      summary:
        'An advanced programme spanning pre-fire planning, incident command and post-fire rehabilitation, supported by the simulation centre and a field exercise.',
      venue: 'AIFTC Campus and Simulation Centre, Antalya',
      targetAudience:
        'Technical staff in decision-making roles at fire operation centres and fire crew supervisors.',
      objective: [
        'The programme treats fire management not as a single moment of response but as a cycle of risk reduction, preparedness, response and recovery.',
        'Scenarios run in the simulation centre reproduce the decision flow of a real operations room.',
      ],
      outcomes: [
        'Predicting fire behaviour from weather and fuel data',
        'Assigning roles within an incident command system',
        'Setting post-fire rehabilitation priorities',
      ],
    },
    ru: {
      slug: 'kurs-kompleksnogo-upravleniya-lesnymi-pozharami-2026',
      title: 'Курс комплексного управления лесными пожарами',
      summary:
        'Продвинутая программа от допожарного планирования до руководства тушением и послепожарного восстановления, с занятиями в центре симуляции и полевыми учениями.',
      venue: 'Кампус и центр симуляции AIFTC, Анталья',
      targetAudience:
        'Технический персонал оперативных центров, принимающий решения, и руководители групп тушения.',
      objective: [
        'Программа рассматривает борьбу с пожарами не как единичный момент реагирования, а как цикл: снижение риска, готовность, реагирование и восстановление.',
        'Сценарии в центре симуляции воспроизводят процесс принятия решений реального оперативного штаба.',
      ],
      outcomes: [
        'Прогнозирование поведения пожара по данным о погоде и горючих материалах',
        'Распределение ролей в системе управления инцидентом',
        'Определение приоритетов послепожарного восстановления',
      ],
    },
  },
  {
    code: 'AIFTC-2026-EWS-06',
    status: 'applications-open',
    featured: true,
    topics: ['entegre-orman-yangini-yonetimi', 'iklim-degisikligi-ve-ormancilik'],
    startDate: '2026-12-07',
    endDate: '2026-12-09',
    durationDays: 3,
    deliveryMode: 'hybrid',
    level: 'intermediate',
    instructionLanguages: ['en', 'ru'],
    participantCountries: ['TR', 'AZ', 'KZ', 'KG', 'UZ'],
    quota: 40,
    certificateType: 'attendance',
    applicationDeadline: '2026-11-21',
    application: { type: 'contact', contactUnit: 'AIFTC Eğitim Koordinasyon Birimi' },
    libraryCollectionKey: 'ews-2026',
    tr: {
      slug: 'yangin-erken-uyari-sistemleri-calistayi-2026',
      title: 'Yangın Erken Uyarı Sistemleri Çalıştayı',
      summary:
        'Meteorolojik yangın tehlike indekslerinin ulusal erken uyarı sistemlerine entegrasyonunu ele alan, ülke deneyimlerinin paylaşıldığı üç günlük çalıştay.',
      venue: 'AIFTC Konferans Salonu, Antalya (çevrim içi katılım mümkündür)',
      targetAudience:
        'Meteoroloji ve orman teşkilatlarında erken uyarı sistemlerinden sorumlu uzmanlar.',
      objective: [
        'Çalıştay, katılımcı ülkelerin hâlihazırda kullandığı tehlike indekslerini karşılaştırarak ortak bir bölgesel yaklaşımın mümkün olup olmadığını tartışır.',
        'Her ülke kendi sisteminin güçlü ve zayıf yönlerini sunar; oturumlar sunum değil, ortak çalışma biçiminde yürütülür.',
      ],
      outcomes: [
        'Yangın tehlike indekslerini yerel koşullara kalibre edebilme',
        'Erken uyarı çıktılarını saha ekiplerine aktaracak akış tasarlayabilme',
      ],
    },
    en: {
      slug: 'fire-early-warning-systems-workshop-2026',
      title: 'Workshop on Fire Early Warning Systems',
      summary:
        'A three-day workshop on integrating meteorological fire danger indices into national early warning systems, built around the exchange of country experience.',
      venue: 'AIFTC Conference Hall, Antalya (online participation possible)',
      targetAudience:
        'Specialists responsible for early warning systems in meteorological and forest services.',
      objective: [
        'The workshop compares the danger indices already in use by participating countries and asks whether a shared regional approach is feasible.',
        'Each country presents the strengths and weaknesses of its own system; sessions are run as joint work rather than presentations.',
      ],
      outcomes: [
        'Calibrating fire danger indices to local conditions',
        'Designing a flow that carries early warning output to field crews',
      ],
    },
    ru: {
      slug: 'seminar-po-sistemam-rannego-preduprezhdeniya-o-pozharakh-2026',
      title: 'Семинар по системам раннего предупреждения о пожарах',
      summary:
        'Трёхдневный семинар об интеграции метеорологических индексов пожарной опасности в национальные системы раннего предупреждения и обмене опытом стран.',
      venue: 'Конференц-зал AIFTC, Анталья (возможно онлайн-участие)',
      targetAudience:
        'Специалисты метеорологических и лесных служб, отвечающие за системы раннего предупреждения.',
      objective: [
        'Семинар сравнивает индексы опасности, уже применяемые странами-участницами, и обсуждает возможность общего регионального подхода.',
        'Каждая страна представляет сильные и слабые стороны своей системы; занятия проходят в формате совместной работы.',
      ],
      outcomes: [
        'Калибровка индексов пожарной опасности под местные условия',
        'Проектирование передачи данных раннего предупреждения полевым группам',
      ],
    },
  },
  {
    code: 'AIFTC-2027-SFM-02',
    status: 'planned',
    featured: true,
    topics: ['surdurulebilir-orman-yonetimi', 'iklim-degisikligi-ve-ormancilik'],
    startDate: '2027-03-15',
    endDate: '2027-03-26',
    durationDays: 12,
    deliveryMode: 'in-person',
    level: 'intermediate',
    instructionLanguages: ['en', 'ru'],
    participantCountries: ['AZ', 'KZ', 'KG', 'TJ', 'TM', 'UZ'],
    quota: 25,
    certificateType: 'certificate',
    application: { type: 'contact', contactUnit: 'AIFTC Eğitim Koordinasyon Birimi' },
    libraryCollectionKey: 'sfm-2027',
    tr: {
      slug: 'surdurulebilir-orman-yonetimi-ve-ulusal-orman-envanteri-2027',
      title: 'Sürdürülebilir Orman Yönetimi ve Ulusal Orman Envanteri',
      summary:
        'Amenajman planlamasından envanter örnekleme tasarımına uzanan, ulusal orman izleme sistemlerinin kurulmasına odaklanan iki haftalık program.',
      venue: 'AIFTC Kampüsü, Antalya',
      targetAudience:
        'Ulusal orman envanteri ve amenajman planlaması birimlerinde görevli teknik personel.',
      objective: [
        'Program, envanterin bir kez yapılan bir ölçüm değil; tekrarlanabilir ve karşılaştırılabilir bir izleme sistemi olduğu yaklaşımı üzerine kurulur.',
        'Katılımcılar örnekleme tasarımını kendi ülkelerinin orman yapısına göre kurgular.',
      ],
      outcomes: [
        'Ulusal ölçekte örnekleme tasarımı kurabilme',
        'Amenajman planlarını izleme verisiyle güncelleyebilme',
      ],
    },
    en: {
      slug: 'sustainable-forest-management-and-national-forest-inventory-2027',
      title: 'Sustainable Forest Management and National Forest Inventory',
      summary:
        'A two-week programme on establishing national forest monitoring systems, from management planning to inventory sampling design.',
      venue: 'AIFTC Campus, Antalya',
      targetAudience:
        'Technical staff working in national forest inventory and management planning units.',
      objective: [
        'The programme rests on treating inventory not as a one-off measurement but as a repeatable, comparable monitoring system.',
        'Participants design a sampling scheme for the forest structure of their own country.',
      ],
      outcomes: [
        'Designing a sampling scheme at national scale',
        'Updating management plans with monitoring data',
      ],
    },
    ru: {
      slug: 'ustoychivoe-lesoupravlenie-i-natsionalnaya-inventarizatsiya-lesov-2027',
      title: 'Устойчивое лесоуправление и национальная инвентаризация лесов',
      summary:
        'Двухнедельная программа по созданию национальных систем мониторинга лесов — от планирования до проектирования выборки инвентаризации.',
      venue: 'Кампус AIFTC, Анталья',
      targetAudience:
        'Технический персонал подразделений национальной инвентаризации и лесоустройства.',
      objective: [
        'Программа исходит из того, что инвентаризация — это не разовое измерение, а повторяемая и сопоставимая система мониторинга.',
        'Участники проектируют схему выборки под структуру лесов своей страны.',
      ],
      outcomes: [
        'Проектирование схемы выборки национального масштаба',
        'Обновление планов лесоустройства данными мониторинга',
      ],
    },
  },
  {
    /**
     * Tamamlanmis egitim: ana sayfada ONE CIKARILMAZ (`featured: false`),
     * ama arsivde ve takvimde gorunur. Sonuc ozeti alanlarinin (EK-2 2.4)
     * dolu oldugu tek ornek kayittir.
     */
    code: 'AIFTC-2026-NUR-05',
    status: 'completed',
    featured: false,
    topics: ['fidanlik-ve-agaclandirma'],
    startDate: '2026-04-13',
    endDate: '2026-04-24',
    durationDays: 12,
    deliveryMode: 'in-person',
    level: 'basic',
    instructionLanguages: ['tr', 'en'],
    participantCountries: ['TR', 'AZ', 'KG', 'UZ'],
    quota: 22,
    certificateType: 'attendance',
    application: { type: 'none' },
    hasFieldExercise: true,
    libraryCollectionKey: 'nursery-2026',
    participantCount: 21,
    tr: {
      slug: 'fidanlik-yonetimi-ve-agaclandirma-teknikleri-2026',
      title: 'Fidanlık Yönetimi ve Ağaçlandırma Teknikleri',
      summary:
        'Tohum kaynağı seçiminden dikim sonrası bakıma kadar fidan üretim zincirinin tamamını saha uygulamalarıyla ele alan tamamlanmış eğitim programı.',
      venue: 'AIFTC Kampüsü ve Antalya Orman Fidanlık Müdürlüğü',
      targetAudience: 'Fidanlık ve ağaçlandırma birimlerinde görevli teknik personel.',
      objective: [
        'Program, fidan kalitesinin ağaçlandırma başarısını belirleyen ilk ve en ucuz müdahale noktası olduğu yaklaşımıyla kurgulanmıştır.',
      ],
      outcomes: [
        'Tohum kaynağı ve fidan kalite kriterlerini değerlendirebilme',
        'Kurak alanlarda dikim ve bakım tekniklerini uygulayabilme',
      ],
    },
    en: {
      slug: 'nursery-management-and-afforestation-techniques-2026',
      title: 'Nursery Management and Afforestation Techniques',
      summary:
        'A completed programme covering the full seedling production chain, from seed source selection to post-planting care, with field practice throughout.',
      venue: 'AIFTC Campus and Antalya Forest Nursery Directorate',
      targetAudience: 'Technical staff working in nursery and afforestation units.',
      objective: [
        'The programme is built on treating seedling quality as the earliest and cheapest point of intervention in afforestation success.',
      ],
      outcomes: [
        'Assessing seed source and seedling quality criteria',
        'Applying planting and tending techniques in dry areas',
      ],
    },
    ru: {
      slug: 'upravlenie-pitomnikami-i-tekhniki-obleseniya-2026',
      title: 'Управление питомниками и техники облесения',
      summary:
        'Завершённая программа, охватывающая всю цепочку производства посадочного материала — от выбора семенного источника до ухода после посадки.',
      venue: 'Кампус AIFTC и Управление лесных питомников Антальи',
      targetAudience: 'Технический персонал питомников и подразделений облесения.',
      objective: [
        'Программа исходит из того, что качество посадочного материала — самая ранняя и наименее затратная точка влияния на успех облесения.',
      ],
      outcomes: [
        'Оценка семенных источников и критериев качества сеянцев',
        'Применение техник посадки и ухода в засушливых районах',
      ],
    },
  },
]

// ===========================================================================
// HABERLER VE DUYURULAR  (Sartname 6.7)
// ===========================================================================

type NewsContent = {
  slug: string
  title: string
  summary: string
  body: string[]
}

type NewsSeed = {
  kind: string
  category: string
  featured: boolean
  publishedAt: string
  expiresAt?: string
  countries?: string[]
  relatedProgramCodes?: string[]
} & Record<Locale, NewsContent>

const NEWS: NewsSeed[] = [
  {
    kind: 'announcement',
    category: 'announcement',
    featured: true,
    publishedAt: '2026-08-25T09:00:00.000Z',
    expiresAt: '2026-12-31T21:00:00.000Z',
    countries: ['TR', 'AZ', 'KZ', 'KG', 'TJ', 'TM', 'UZ'],
    tr: {
      slug: '2027-egitim-takvimi-yayimlandi',
      title: '2027 Eğitim Takvimi Yayımlandı',
      summary:
        'Merkezimizin 2027 yılı eğitim takvimi yayımlandı. Takvimde on bir program yer alıyor; başvurular her eğitim için ayrı ayrı açılacak.',
      body: [
        'Antalya Uluslararası Ormancılık Eğitim Merkezi’nin 2027 yılı eğitim takvimi yayımlandı. Takvim; entegre yangın yönetimi, sürdürülebilir orman yönetimi, orman peyzaj restorasyonu ve uzaktan algılama başlıklarında toplam on bir programı kapsıyor.',
        'Başvurular her eğitim için ayrı ayrı açılacak ve ilgili eğitim sayfasından duyurulacaktır. Katılımcı kurumların, başvuru dönemlerini takip edebilmesi için eğitim takvimi sayfasını izlemesi önerilir.',
      ],
    },
    en: {
      slug: '2027-training-calendar-published',
      title: '2027 Training Calendar Published',
      summary:
        'The centre’s 2027 training calendar is now available. It covers eleven programmes; applications will open separately for each one.',
      body: [
        'The 2027 training calendar of the Antalya International Forestry Training Centre has been published. It covers eleven programmes across integrated fire management, sustainable forest management, forest landscape restoration and remote sensing.',
        'Applications will open separately for each course and will be announced on the relevant training page. Partner institutions are encouraged to follow the training calendar page.',
      ],
    },
    ru: {
      slug: 'opublikovan-kalendar-obucheniya-na-2027-god',
      title: 'Опубликован календарь обучения на 2027 год',
      summary:
        'Опубликован календарь обучения центра на 2027 год. В него вошли одиннадцать программ; приём заявок открывается отдельно по каждой.',
      body: [
        'Опубликован календарь обучения Антальинского международного центра лесного образования на 2027 год. В него вошли одиннадцать программ по темам комплексного управления пожарами, устойчивого лесоуправления, восстановления лесных ландшафтов и дистанционного зондирования.',
        'Приём заявок открывается отдельно по каждому курсу и объявляется на странице соответствующей программы. Партнёрским организациям рекомендуется следить за страницей календаря обучения.',
      ],
    },
  },
  {
    kind: 'news',
    category: 'training-result',
    featured: true,
    publishedAt: '2026-04-28T11:00:00.000Z',
    countries: ['TR', 'AZ', 'KG', 'UZ'],
    relatedProgramCodes: ['AIFTC-2026-NUR-05'],
    tr: {
      slug: 'fidanlik-yonetimi-egitimi-tamamlandi',
      title: 'Fidanlık Yönetimi Eğitimi Tamamlandı',
      summary:
        'Dört ülkeden 21 katılımcının yer aldığı Fidanlık Yönetimi ve Ağaçlandırma Teknikleri eğitimi, iki haftalık programın ardından tamamlandı.',
      body: [
        'Merkezimizde 13–24 Nisan 2026 tarihlerinde düzenlenen Fidanlık Yönetimi ve Ağaçlandırma Teknikleri eğitimi tamamlandı. Programa Türkiye, Azerbaycan, Kırgızistan ve Özbekistan’dan toplam 21 teknik personel katıldı.',
        'Eğitimin ikinci haftası Antalya Orman Fidanlık Müdürlüğü’nde saha uygulamalarına ayrıldı. Katılımcılar tohum kaynağı değerlendirmesi, kap tipi seçimi ve dikim sonrası bakım uygulamalarını yerinde inceledi.',
        'Program sonunda katılımcılara katılım belgesi verildi.',
      ],
    },
    en: {
      slug: 'nursery-management-course-completed',
      title: 'Nursery Management Course Completed',
      summary:
        'The Nursery Management and Afforestation Techniques course, attended by 21 participants from four countries, concluded after two weeks.',
      body: [
        'The Nursery Management and Afforestation Techniques course, held at the centre from 13 to 24 April 2026, has been completed. Twenty-one technical staff from Türkiye, Azerbaijan, Kyrgyzstan and Uzbekistan took part.',
        'The second week was devoted to field practice at the Antalya Forest Nursery Directorate, where participants examined seed source assessment, container selection and post-planting care on site.',
        'Certificates of attendance were presented at the end of the programme.',
      ],
    },
    ru: {
      slug: 'zavershen-kurs-po-upravleniyu-pitomnikami',
      title: 'Завершён курс по управлению питомниками',
      summary:
        'Курс «Управление питомниками и техники облесения» с участием 21 специалиста из четырёх стран завершился после двух недель занятий.',
      body: [
        'В центре завершился курс «Управление питомниками и техники облесения», проходивший с 13 по 24 апреля 2026 года. В программе приняли участие 21 технический специалист из Турции, Азербайджана, Кыргызстана и Узбекистана.',
        'Вторая неделя была посвящена полевой практике в Управлении лесных питомников Антальи, где участники на месте изучили оценку семенных источников, подбор контейнеров и уход после посадки.',
        'По завершении программы участникам вручены свидетельства об участии.',
      ],
    },
  },
  {
    kind: 'news',
    category: 'technical-visit',
    featured: false,
    publishedAt: '2026-06-12T08:30:00.000Z',
    countries: ['TR'],
    tr: {
      slug: 'fao-heyeti-merkezi-ziyaret-etti',
      title: 'FAO Heyeti Merkezi Ziyaret Etti',
      summary:
        'FAO Orta Asya Alt Bölge Ofisi heyeti, proje kapsamında yürütülen kapasite geliştirme çalışmalarını yerinde değerlendirmek üzere merkezimizi ziyaret etti.',
      body: [
        'FAO Orta Asya Alt Bölge Ofisi’nden bir heyet, GCP/SEC/024/TUR sayılı proje kapsamında yürütülen çalışmaları değerlendirmek üzere merkezimizi ziyaret etti.',
        'Ziyaret programında simülasyon merkezi, eğitim salonları ve uygulama ormanı incelendi. Heyet ayrıca 2027 eğitim takviminin bölgesel ihtiyaçlarla uyumu üzerine düzenlenen değerlendirme toplantısına katıldı.',
      ],
    },
    en: {
      slug: 'fao-delegation-visits-the-centre',
      title: 'FAO Delegation Visits the Centre',
      summary:
        'A delegation from the FAO Subregional Office for Central Asia visited the centre to review the capacity development work carried out under the project.',
      body: [
        'A delegation from the FAO Subregional Office for Central Asia visited the centre to review the work carried out under project GCP/SEC/024/TUR.',
        'The programme included the simulation centre, the training halls and the demonstration forest. The delegation also joined a review meeting on how well the 2027 training calendar matches regional needs.',
      ],
    },
    ru: {
      slug: 'delegatsiya-fao-posetila-tsentr',
      title: 'Делегация ФАО посетила центр',
      summary:
        'Делегация Субрегионального отделения ФАО по Центральной Азии посетила центр, чтобы на месте оценить работу по развитию потенциала в рамках проекта.',
      body: [
        'Делегация Субрегионального отделения ФАО по Центральной Азии посетила центр для оценки работ, выполняемых в рамках проекта GCP/SEC/024/TUR.',
        'В программу визита вошли центр симуляции, учебные залы и демонстрационный лес. Делегация также приняла участие во встрече по соответствию календаря обучения на 2027 год потребностям региона.',
      ],
    },
  },
  {
    kind: 'news',
    category: 'cooperation',
    featured: true,
    publishedAt: '2026-07-03T10:00:00.000Z',
    countries: ['TR', 'AZ', 'KZ', 'KG', 'TJ', 'TM', 'UZ'],
    tr: {
      slug: 'orta-asya-ormancilik-is-birligi-calistayi',
      title: 'Orta Asya Ormancılık İş Birliği Çalıştayı Düzenlendi',
      summary:
        'Yedi ülkenin orman teşkilatı temsilcileri, bölgesel eğitim ihtiyaçlarını ve ortak eğitim programlarının kapsamını belirlemek üzere Antalya’da bir araya geldi.',
      body: [
        'Orta Asya ülkelerinin orman teşkilatı temsilcileri, bölgesel eğitim ihtiyaçlarını değerlendirmek üzere merkezimizde düzenlenen çalıştayda bir araya geldi.',
        'Çalıştayda ülkelerin öncelikli eğitim başlıkları karşılaştırıldı; yangın yönetimi, uzaktan algılama ve arazi bozulumuyla mücadele konularının ortak öncelik olduğu görüldü.',
        'Çalıştay çıktıları 2027 eğitim takviminin oluşturulmasında doğrudan kullanıldı.',
      ],
    },
    en: {
      slug: 'central-asia-forestry-cooperation-workshop',
      title: 'Central Asia Forestry Cooperation Workshop Held',
      summary:
        'Representatives of forest services from seven countries met in Antalya to identify regional training needs and the scope of joint training programmes.',
      body: [
        'Representatives of the forest services of Central Asian countries met at the centre for a workshop on regional training needs.',
        'The workshop compared the priority training topics of each country. Fire management, remote sensing and combating land degradation emerged as shared priorities.',
        'The outputs of the workshop fed directly into the preparation of the 2027 training calendar.',
      ],
    },
    ru: {
      slug: 'seminar-po-lesnomu-sotrudnichestvu-v-tsentralnoy-azii',
      title: 'Проведён семинар по лесному сотрудничеству в Центральной Азии',
      summary:
        'Представители лесных служб семи стран встретились в Анталье, чтобы определить региональные потребности в обучении и содержание совместных программ.',
      body: [
        'Представители лесных служб стран Центральной Азии собрались в центре на семинар, посвящённый региональным потребностям в обучении.',
        'На семинаре сопоставлены приоритетные темы обучения каждой страны. Общими приоритетами оказались управление пожарами, дистанционное зондирование и борьба с деградацией земель.',
        'Итоги семинара напрямую использованы при подготовке календаря обучения на 2027 год.',
      ],
    },
  },
  {
    kind: 'news',
    category: 'project',
    featured: false,
    publishedAt: '2026-08-14T07:45:00.000Z',
    countries: ['TR'],
    tr: {
      slug: 'simulasyon-merkezi-yeni-sistemlerle-guclendi',
      title: 'Simülasyon Merkezi Yeni Sistemlerle Güçlendi',
      summary:
        'Proje kapsamında temin edilen yangın davranışı modelleme ve harekât merkezi simülasyon sistemleri kurularak eğitim programlarına dâhil edildi.',
      body: [
        'Proje kapsamında temin edilen simülasyon sistemlerinin kurulumu tamamlandı. Merkezde artık yangın davranışı modelleme ve harekât merkezi karar simülasyonu birlikte yürütülebiliyor.',
        'Yeni sistemler, Kasım 2026’da başlayacak Entegre Orman Yangını Yönetimi Eğitimi’nden itibaren eğitim programlarında kullanılacak.',
      ],
    },
    en: {
      slug: 'simulation-centre-strengthened-with-new-systems',
      title: 'Simulation Centre Strengthened with New Systems',
      summary:
        'Fire behaviour modelling and operations room simulation systems procured under the project have been installed and integrated into training programmes.',
      body: [
        'Installation of the simulation systems procured under the project is complete. Fire behaviour modelling and operations room decision simulation can now be run together at the centre.',
        'The new systems will be used in training from the Integrated Forest Fire Management Course starting in November 2026 onwards.',
      ],
    },
    ru: {
      slug: 'tsentr-simulyatsii-usilen-novymi-sistemami',
      title: 'Центр симуляции усилен новыми системами',
      summary:
        'Закупленные в рамках проекта системы моделирования поведения пожара и симуляции оперативного штаба установлены и включены в программы обучения.',
      body: [
        'Завершена установка систем симуляции, закупленных в рамках проекта. Теперь в центре можно одновременно проводить моделирование поведения пожара и симуляцию принятия решений оперативным штабом.',
        'Новые системы будут использоваться в обучении начиная с курса комплексного управления лесными пожарами в ноябре 2026 года.',
      ],
    },
  },
]

// ===========================================================================
// ANA SAYFA GLOBAL'I  (Hero + One cikan egitimler)
// ===========================================================================

const HOMEPAGE: Record<Locale, Record<string, unknown>> = {
  tr: {
    hero: {
      eyebrow: 'FAO ve Orman Genel Müdürlüğü iş birliğiyle',
      headline: 'Ormancılıkta uluslararası eğitim ve bölgesel iş birliği merkezi',
      subheadline:
        'Antalya Uluslararası Ormancılık Eğitim Merkezi; orman yangınları, sürdürülebilir orman yönetimi ve peyzaj restorasyonu alanlarında Orta Asya ve komşu ülkelerin teknik personeline uygulamalı eğitim sunar.',
      overlay: { opacity: 72, style: 'gradient' },
      primaryCta: { label: 'Eğitim programları', type: 'route', route: 'training-programs' },
      secondaryCta: { label: 'Eğitim takvimi', type: 'route', route: 'training-calendar' },
      highlights: [
        { title: '14+ Katılımcı Ülke', description: 'Bölgesel ve küresel teknik iş birliği' },
        { title: 'Uygulamalı Simülatör', description: 'Yangın karar destek sistemleri' },
        { title: 'FAO & OGM Ortaklığı', description: 'Uluslararası akredite müfredat' },
      ],
      stats: [
        { value: '14+', label: 'katılımcı ülke' },
        { value: '11', label: '2027 eğitim programı' },
        { value: '3', label: 'eğitim dili' },
        { value: '1994', label: 'kuruluş yılı' },
      ],
    },
    featuredTrainings: {
      title: 'Öne Çıkan Eğitimler',
      intro:
        'Başvuruya açık ve devam eden programlar. Tüm eğitimler ve geçmiş programlar için eğitim takvimine bakabilirsiniz.',
      limit: 5,
      showStatusBadges: true,
    },
  },
  en: {
    hero: {
      eyebrow: 'In cooperation with FAO and the General Directorate of Forestry',
      headline: 'A centre for international forestry training and regional cooperation',
      subheadline:
        'The Antalya International Forestry Training Centre delivers practical training to technical staff from Central Asia and neighbouring countries in forest fires, sustainable forest management and landscape restoration.',
      overlay: { opacity: 72, style: 'gradient' },
      primaryCta: { label: 'Training programmes', type: 'route', route: 'training-programs' },
      secondaryCta: { label: 'Training calendar', type: 'route', route: 'training-calendar' },
      highlights: [
        { title: '14+ participating countries', description: 'Regional and global technical cooperation' },
        { title: 'Hands-on simulator', description: 'Fire decision support systems' },
        { title: 'FAO & OGM partnership', description: 'Internationally accredited curriculum' },
      ],
      stats: [
        { value: '14+', label: 'participating countries' },
        { value: '11', label: 'programmes in 2027' },
        { value: '3', label: 'languages of instruction' },
        { value: '1994', label: 'established' },
      ],
    },
    featuredTrainings: {
      title: 'Featured Training Programmes',
      intro:
        'Programmes open for application and currently running. See the training calendar for all courses, including past ones.',
      limit: 5,
      showStatusBadges: true,
    },
  },
  ru: {
    hero: {
      eyebrow: 'В сотрудничестве с ФАО и Генеральным управлением лесного хозяйства',
      headline: 'Центр международного лесного образования и регионального сотрудничества',
      subheadline:
        'Антальинский международный центр лесного образования проводит практическое обучение технических специалистов Центральной Азии и соседних стран по темам лесных пожаров, устойчивого лесоуправления и восстановления ландшафтов.',
      overlay: { opacity: 72, style: 'gradient' },
      primaryCta: { label: 'Программы обучения', type: 'route', route: 'training-programs' },
      secondaryCta: { label: 'Календарь обучения', type: 'route', route: 'training-calendar' },
      highlights: [
        { title: '14+ стран-участниц', description: 'Региональное и глобальное техническое сотрудничество' },
        { title: 'Практический симулятор', description: 'Системы поддержки решений при пожарах' },
        { title: 'Партнёрство ФАО и OGM', description: 'Международно аккредитованная программа' },
      ],
      stats: [
        { value: '14+', label: 'стран-участниц' },
        { value: '11', label: 'программ в 2027 году' },
        { value: '3', label: 'языка обучения' },
        { value: '1994', label: 'год основания' },
      ],
    },
    featuredTrainings: {
      title: 'Избранные программы обучения',
      intro:
        'Программы с открытым приёмом заявок и текущие курсы. Полный список, включая прошедшие курсы, — в календаре обучения.',
      limit: 5,
      showStatusBadges: true,
    },
  },
}

// ===========================================================================
// ANA MENU  (Navigation global'i)
// ===========================================================================

/**
 * Menu AGACI dile bagli DEGILDIR (bkz. globals/Navigation.ts): ayni ogeler,
 * ayni sirada, her dilde gorunur. Yalnizca `label` localized'dir.
 *
 * Bu nedenle once TR ile olusturulur, ardindan olusan SATIR ID'LERI ile
 * EN/RU etiketleri yazilir. Satir id'si gonderilmezse Payload satirlari
 * yeniden olusturur ve TR etiketleri kaybolur.
 *
 * "Dijital Kutuphane" ogesi `type: 'library'`: adresi ve "yakinda" durumu
 * ExternalServices global'inden gelir, burada sabit URL yoktur.
 */
const MAIN_MENU: { item: Record<string, unknown>; labels: Record<Locale, string> }[] = [
  {
    item: { type: 'route', route: 'home' },
    labels: { tr: 'Ana Sayfa', en: 'Home', ru: 'Главная' },
  },
  {
    item: { type: 'route', route: 'training-programs' },
    labels: { tr: 'Eğitim Programları', en: 'Training Programmes', ru: 'Программы обучения' },
  },
  {
    item: { type: 'route', route: 'training-calendar' },
    labels: { tr: 'Eğitim Takvimi', en: 'Training Calendar', ru: 'Календарь обучения' },
  },
  {
    item: { type: 'route', route: 'simulation-centre' },
    labels: { tr: 'Simülasyon Merkezi', en: 'Simulation Centre', ru: 'Центр симуляции' },
  },
  {
    item: { type: 'library' },
    labels: { tr: 'Dijital Kütüphane', en: 'Digital Library', ru: 'Цифровая библиотека' },
  },
  {
    item: { type: 'route', route: 'news' },
    labels: { tr: 'Haberler', en: 'News', ru: 'Новости' },
  },
  {
    item: { type: 'route', route: 'contact' },
    labels: { tr: 'İletişim', en: 'Contact', ru: 'Контакты' },
  },
]

// ===========================================================================
// HUKUKI SAYFALAR  (Sartname 12.2-12.3, 13)
// ===========================================================================

/**
 * !!! ICERIK YER TUTUCUDUR — YAYINA ALMADAN ONCE DEGISTIRILMELIDIR !!!
 *
 * KVKK aydinlatma metni, gizlilik ilkeleri ve erisilebilirlik bildirimi
 * HUKUKI BELGELERDIR. Kurumun hukuk birimi disinda kimse bu metinleri
 * yazamaz; buraya uydurma bir metin konulmasi kurumu yanlis beyanda
 * birakir.
 *
 * Bu yuzden seed yalnizca SAYFA ISKELETINI olusturur: dogru slug, dogru
 * `pageType: 'legal'`, uc dilde baslik ve icerigin beklendigini soyleyen
 * acik bir not. Boylece footer baglantilari 404 vermez, ama sayfayi acan
 * kimse de yanlis bir metni gecerli sanmaz.
 */
type LegalPageSeed = {
  pageType: string
  slugs: Record<Locale, string>
  titles: Record<Locale, string>
  notice: Record<Locale, string>
}

const LEGAL_PAGES: LegalPageSeed[] = [
  {
    pageType: 'legal',
    slugs: { tr: 'kvkk-aydinlatma-metni', en: 'privacy-notice', ru: 'uvedomlenie-o-konfidentsialnosti' },
    titles: {
      tr: 'KVKK Aydınlatma Metni',
      en: 'Personal Data Protection Notice',
      ru: 'Уведомление об обработке персональных данных',
    },
    notice: {
      tr: 'Bu sayfanın metni henüz yayımlanmamıştır. Kişisel verilerin korunmasına ilişkin aydınlatma metni kurumun hukuk birimi tarafından hazırlanacak ve yönetim panelinden bu sayfaya girilecektir.',
      en: 'The text of this page has not been published yet. The personal data protection notice will be prepared by the institution’s legal unit and entered here through the admin panel.',
      ru: 'Текст этой страницы ещё не опубликован. Уведомление об обработке персональных данных будет подготовлено юридическим подразделением учреждения.',
    },
  },
  {
    pageType: 'legal',
    slugs: { tr: 'gizlilik-ilkeleri', en: 'privacy-policy', ru: 'politika-konfidentsialnosti' },
    titles: {
      tr: 'Gizlilik İlkeleri',
      en: 'Privacy Policy',
      ru: 'Политика конфиденциальности',
    },
    notice: {
      tr: 'Bu sayfanın metni henüz yayımlanmamıştır. Çerez kullanımı ve gizlilik ilkeleri kurumun hukuk birimi tarafından hazırlanacak ve yönetim panelinden bu sayfaya girilecektir.',
      en: 'The text of this page has not been published yet. Cookie usage and privacy principles will be prepared by the institution’s legal unit and entered here through the admin panel.',
      ru: 'Текст этой страницы ещё не опубликован. Правила использования cookie и политика конфиденциальности будут подготовлены юридическим подразделением.',
    },
  },
]

const seedLegalPages = async (payload: Payload) => {
  const created: { id: string | number; slugs: Record<Locale, string>; titles: Record<Locale, string> }[] = []
  let anyCreated = false

  for (const page of LEGAL_PAGES) {
    const existing = await payload.find({
      collection: 'pages',
      locale: 'tr',
      where: { slug: { equals: page.slugs.tr } },
      limit: 1,
      depth: 0,
    })

    if (existing.totalDocs > 0) {
      created.push({ id: existing.docs[0].id, slugs: page.slugs, titles: page.titles })
      continue
    }

    const doc = await payload.create({
      collection: 'pages',
      locale: 'tr',
      ...CTX,
      data: {
        slug: page.slugs.tr,
        pageType: page.pageType,
        title: page.titles.tr,
        layout: [{ blockType: 'richText', content: richText(page.notice.tr) }],
        _status: 'published',
      } as never,
    })

    for (const locale of TRANSLATIONS) {
      await payload.update({
        collection: 'pages',
        id: doc.id,
        locale,
        ...CTX,
        data: {
          slug: page.slugs[locale],
          title: page.titles[locale],
          layout: [{ blockType: 'richText', content: richText(page.notice[locale]) }],
          _status: 'published',
        } as never,
      })
    }

    created.push({ id: doc.id, slugs: page.slugs, titles: page.titles })
    anyCreated = true
  }

  return { pages: created, anyCreated }
}

// ===========================================================================
// ILETISIM FORMU  (form-builder eklentisi)
// ===========================================================================

/**
 * Sartname 6.9 + 12.2: iletisim formu KISISEL VERI toplar. Bu nedenle
 *   - alan kumesi asgaridir (veri asgariligi),
 *   - `consentText` bos birakilmaz: acik riza metni onay kutusunun yaninda
 *     gosterilir ve isaretlenmeden gonderim sunucuda reddedilir,
 *   - `retentionDays` saklama suresini belgeler.
 *
 * Alan ADLARI (`fullName`, `email`, ...) sunucu eylemiyle (iletisim/actions.ts)
 * birebir eslesmek ZORUNDADIR; degistirilirse gonderilen veri eslenemez.
 */
const CONTACT_FORM_FIELDS = [
  { blockType: 'text', name: 'fullName', label: 'Ad Soyad', required: true, width: 50 },
  { blockType: 'text', name: 'organization', label: 'Kurum / Ülke', required: false, width: 50 },
  { blockType: 'email', name: 'email', label: 'E-posta', required: true, width: 100 },
  { blockType: 'text', name: 'subject', label: 'Konu', required: true, width: 100 },
  { blockType: 'textarea', name: 'message', label: 'Mesajınız', required: true, width: 100 },
]

const CONTACT_CONSENT = {
  tr: 'Kişisel verilerimin bu başvurunun değerlendirilmesi amacıyla işlenmesine açık rıza gösteriyorum. Verilerim saklama süresi sonunda silinir.',
  en: 'I consent to the processing of my personal data for the purpose of handling this enquiry. My data is deleted at the end of the retention period.',
  ru: 'Я даю согласие на обработку моих персональных данных для рассмотрения этого обращения. Данные удаляются по окончании срока хранения.',
}

/**
 * `confirmationType: 'message'` secildiginde eklenti `confirmationMessage`
 * alanini ZORUNLU kilar. Site formu kendi basari ekraniyla gosterir; bu metin
 * panelde ve olasi baska kullanimlarda gorunur.
 */
const CONTACT_CONFIRMATION = {
  tr: 'Mesajınız iletildi. En kısa sürede size dönüş yapılacaktır.',
  en: 'Your message has been sent. We will get back to you shortly.',
  ru: 'Ваше сообщение отправлено. Мы свяжемся с вами в ближайшее время.',
}

const seedContactForm = async (payload: Payload) => {
  const existing = await payload.find({
    collection: 'forms',
    where: { title: { equals: CONTACT_FORM_TITLE } },
    limit: 1,
    depth: 0,
  })

  if (existing.totalDocs > 0) return false

  const created = await payload.create({
    collection: 'forms',
    locale: 'tr',
    ...CTX,
    data: {
      title: CONTACT_FORM_TITLE,
      fields: CONTACT_FORM_FIELDS,
      consentText: CONTACT_CONSENT.tr,
      retentionDays: 180,
      confirmationType: 'message',
      confirmationMessage: richText(CONTACT_CONFIRMATION.tr),
    } as never,
  })

  for (const locale of TRANSLATIONS) {
    await payload.update({
      collection: 'forms',
      id: created.id,
      locale,
      ...CTX,
      data: {
        consentText: CONTACT_CONSENT[locale],
        confirmationMessage: richText(CONTACT_CONFIRMATION[locale]),
      } as never,
    })
  }

  return true
}

const seedNavigation = async (payload: Payload) => {
  const existing = await payload.findGlobal({ slug: 'navigation', locale: 'tr', depth: 0 })
  const current = (existing as { mainMenu?: unknown[] }).mainMenu

  // Editor menuyu panelden duzenlemis olabilir; uzerine YAZILMAZ.
  if (Array.isArray(current) && current.length > 0) return false

  const created = await payload.updateGlobal({
    slug: 'navigation',
    locale: 'tr',
    ...CTX,
    data: {
      mainMenu: MAIN_MENU.map(({ item, labels }) => ({ ...item, label: labels.tr })),
    } as never,
  })

  const rows = ((created as { mainMenu?: { id?: string | null }[] }).mainMenu ?? []).map(
    (row) => row.id,
  )

  for (const locale of TRANSLATIONS) {
    await payload.updateGlobal({
      slug: 'navigation',
      locale,
      ...CTX,
      data: {
        mainMenu: MAIN_MENU.map(({ item, labels }, index) => ({
          ...item,
          id: rows[index],
          label: labels[locale],
        })),
      } as never,
    })
  }

  return true
}

// ===========================================================================
// CALISTIRMA
// ===========================================================================

const run = async () => {
  if (process.env.NODE_ENV === 'production') {
    console.error(
      'seed: NODE_ENV=production. Ornek veri uretim ortamina YAZILMAZ. Betik durduruldu.',
    )
    process.exit(1)
  }

  const payload = await getPayload({ config })

  // --- Genel ayarlar --------------------------------------------------------
  await payload.updateGlobal({
    slug: 'site-settings',
    locale: 'tr',
    ...CTX,
    data: {
      siteName: 'Antalya Uluslararası Ormancılık Eğitim Merkezi',
      siteShortName: 'AIFTC',
      tagline: 'Ormancılıkta uluslararası eğitim ve iş birliği',
      contact: {
        organizationName: 'T.C. Tarım ve Orman Bakanlığı — Orman Genel Müdürlüğü',
        address: 'Antalya Uluslararası Ormancılık Eğitim Merkezi, Antalya',
      },
    },
  })

  /**
   * --- Ana sayfa: Hero ve one cikan egitimler seridi -----------------------
   *
   * LOCALIZED DIZILERDE SATIR ID'SI ZORUNLU — bu hata iki kez yasandi.
   *
   * `hero.highlights` ve `hero.stats` dizilerinin ICINDEKI alanlar
   * localized'dir. Uc dil arka arkaya, satir ID'si GONDERILMEDEN yazilirsa
   * Payload her seferinde satirlari YENIDEN OLUSTURUR ve onceki dillerin
   * degerleri silinir. Sonuc: veritabaninda yalnizca EN SON yazilan dilin
   * satirlari kalir (olculdu: `homepage_hero_highlights_locales` tablosunda
   * sadece `ru` satirlari vardi), site TR'de bos panel gosterirdi.
   *
   * Dogru sira: once TR yaz -> olusan satir id'lerini GERI OKU -> EN ve RU'yu
   * ayni id'lerle guncelle. Ayni kural `seedNavigation`/`appendMenuRoute`
   * icinde de gecerlidir.
   */
  const heroAfterTr = await payload.updateGlobal({
    slug: 'homepage',
    locale: 'tr',
    ...CTX,
    data: HOMEPAGE.tr as never,
  })

  /** TR yazimindan sonra olusan satir id'leri, dizi adina gore. */
  const rowIds = (name: 'highlights' | 'stats'): (string | null)[] =>
    (
      ((heroAfterTr as { hero?: Record<string, { id?: string | null }[]> }).hero?.[name] ??
        []) as { id?: string | null }[]
    ).map((row) => row.id ?? null)

  const highlightIds = rowIds('highlights')
  const statIds = rowIds('stats')

  /** Yerel diziye TR'den gelen satir id'lerini bindirir. */
  const withIds = <T,>(rows: T[] | undefined, ids: (string | null)[]): T[] =>
    (rows ?? []).map((row, index) => ({ ...row, id: ids[index] }) as T)

  for (const locale of TRANSLATIONS) {
    const hero = (HOMEPAGE[locale].hero ?? {}) as Record<string, unknown>

    await payload.updateGlobal({
      slug: 'homepage',
      locale,
      ...CTX,
      data: {
        ...HOMEPAGE[locale],
        hero: {
          ...hero,
          highlights: withIds(hero.highlights as unknown[], highlightIds),
          stats: withIds(hero.stats as unknown[], statIds),
        },
      } as never,
    })
  }

  payload.logger.info('Ana sayfa (Hero + one cikan egitimler) ayarlandi.')

  // --- Ana menu -------------------------------------------------------------
  if (await seedNavigation(payload)) {
    payload.logger.info(`Ana menu olusturuldu (${MAIN_MENU.length} oge, 3 dil).`)
  }

  /*
    Menu daha once eksik ogelerle kurulmus olabilir (once 5 ogeydi, Iletisim
    sonradan eklendi; Simulasyon Merkezi de Sartname 9 ile geldi). Bu dongu
    mevcut menuyu EZMEZ, yalnizca eksik olani dogru konuma ekler.
  */
  for (const addition of MENU_ADDITIONS) {
    if (await appendMenuRoute(payload, addition.route, addition.labels, { after: addition.after })) {
      payload.logger.info(`Ana menudeki "${addition.labels.tr}" ogesi guncel (3 dil).`)
    }
  }

  // --- Hukuki sayfalar + footer baglantilari -------------------------------
  const legal = await seedLegalPages(payload)
  if (legal.anyCreated) {
    payload.logger.info(
      `Hukuki sayfa iskeleti olusturuldu (${LEGAL_PAGES.length} sayfa, 3 dil). ` +
        'DIKKAT: icerik YER TUTUCUDUR, hukuk birimi tarafindan degistirilmelidir.',
    )
  }

  /**
   * Footer'daki hukuki baglantilar. Menude oldugu gibi: var olan satirlar
   * EZILMEZ, yalnizca eksik olan eklenir. Sayfa iliskisi `type: 'page'` ile
   * kurulur; adres `pageHref` uzerinden dile gore uretilir.
   */
  const navGlobal = await payload.findGlobal({ slug: 'navigation', locale: 'tr', depth: 0 })
  const currentLegal = ((navGlobal as { footerLegalLinks?: unknown[] }).footerLegalLinks ??
    []) as { id?: string | null; label?: string | null }[]

  if (currentLegal.length === 0 && legal.pages.length > 0) {
    const afterTr = await payload.updateGlobal({
      slug: 'navigation',
      locale: 'tr',
      ...CTX,
      data: {
        footerLegalLinks: legal.pages.map((page) => ({
          type: 'page',
          page: page.id,
          label: page.titles.tr,
        })),
      } as never,
    })

    const rows = ((afterTr as { footerLegalLinks?: { id?: string | null }[] }).footerLegalLinks ??
      []) as { id?: string | null }[]

    for (const locale of TRANSLATIONS) {
      await payload.updateGlobal({
        slug: 'navigation',
        locale,
        ...CTX,
        data: {
          footerLegalLinks: rows.map((row, index) => ({
            id: row.id,
            type: 'page',
            page: legal.pages[index]?.id,
            label: legal.pages[index]?.titles[locale],
          })),
        } as never,
      })
    }

    payload.logger.info('Footer hukuki baglantilari eklendi (3 dil).')
  }

  // --- Iletisim formu -------------------------------------------------------
  if (await seedContactForm(payload)) {
    payload.logger.info('Iletisim formu olusturuldu (acik riza metni 3 dilde).')
  }

  // --- Dis servisler: kutuphane ve portal baslangicta "yakinda" -------------
  await payload.updateGlobal({
    slug: 'external-services',
    locale: 'tr',
    ...CTX,
    data: {
      library: {
        status: 'coming-soon',
        baseUrl: process.env.NEXT_PUBLIC_LIBRARY_URL ?? 'https://kutuphane.aiftc.org',
        label: 'Dijital Kütüphane',
        notice: 'Dijital kütüphane yakında hizmete girecektir.',
      },
      portal: {
        status: 'coming-soon',
        baseUrl: process.env.NEXT_PUBLIC_PORTAL_URL ?? 'https://portal.aiftc.org',
      },
    },
  })

  // --- Ana proje (Sartname 10.1) -------------------------------------------
  const existingProject = await payload.find({
    collection: 'projects',
    where: { symbol: { equals: 'GCP/SEC/024/TUR' } },
    limit: 1,
  })

  if (existingProject.totalDocs === 0) {
    await payload.create({
      collection: 'projects',
      locale: 'tr',
      ...CTX,
      data: {
        title:
          'Uluslararası Ormancılık Eğitim Merkezinin Kapasitesinin Güçlendirilmesi Projesi',
        symbol: 'GCP/SEC/024/TUR',
        slug: 'gcp-sec-024-tur',
        startDate: '2024-03-01',
        endDate: '2027-02-28',
        focusCountries: ['TR', 'AZ', 'KZ', 'KG', 'TJ', 'TM', 'UZ'],
        externalUrl: 'https://www.fao.org',
        isPrimary: true,
        _status: 'published',
      },
    })
    payload.logger.info('Ana proje olusturuldu.')
  }

  // --- Egitim konulari ------------------------------------------------------
  /** TR slug -> id. Egitim programlari konularini buradan cozer. */
  const topicIds = new Map<string, string | number>()

  for (const topic of TOPICS) {
    const existing = await findBySlug(payload, 'training-topics', topic.tr.slug)

    if (existing) {
      topicIds.set(topic.tr.slug, existing)
      continue
    }

    const created = await payload.create({
      collection: 'training-topics',
      locale: 'tr',
      ...CTX,
      data: {
        ...topic.tr,
        order: topic.order,
        featured: true,
        category: topic.category,
        level: topic.level,
        librarySubjectKey: topic.librarySubjectKey,
        usesSimulation: Boolean(topic.usesSimulation),
        _status: 'published',
      } as never,
    })

    for (const locale of TRANSLATIONS) {
      await payload.update({
        collection: 'training-topics',
        id: created.id,
        locale,
        ...CTX,
        data: { ...topic[locale], _status: 'published' } as never,
      })
    }

    topicIds.set(topic.tr.slug, created.id)
    payload.logger.info(`Egitim konusu olusturuldu: ${topic.tr.title}`)
  }

  // --- Egitim programlari ---------------------------------------------------
  /** Egitim kodu -> id. Haberlerin `relatedTrainings` alani buradan beslenir. */
  const programIds = new Map<string, string | number>()

  for (const program of PROGRAMS) {
    const existing = await findBySlug(payload, 'training-programs', program.tr.slug)

    if (existing) {
      programIds.set(program.code, existing)
      continue
    }

    // Konu iliskisi zorunludur; konusu cozulemeyen program atlanir.
    const relatedTopics = program.topics
      .map((slug) => topicIds.get(slug))
      .filter((id): id is string | number => id !== undefined)

    if (relatedTopics.length === 0) {
      payload.logger.warn(`Konusu bulunamadi, atlandi: ${program.code}`)
      continue
    }

    const created = await payload.create({
      collection: 'training-programs',
      locale: 'tr',
      ...CTX,
      data: {
        slug: program.tr.slug,
        title: program.tr.title,
        summary: program.tr.summary,
        venue: program.tr.venue,
        targetAudience: program.tr.targetAudience,
        objective: richText(...program.tr.objective),
        learningOutcomes: program.tr.outcomes.map((text) => ({ text })),
        code: program.code,
        status: program.status,
        featured: program.featured,
        topics: relatedTopics,
        startDate: program.startDate,
        endDate: program.endDate,
        durationDays: program.durationDays,
        deliveryMode: program.deliveryMode,
        level: program.level,
        instructionLanguages: program.instructionLanguages,
        participantCountries: program.participantCountries,
        quota: program.quota,
        certificateType: program.certificateType,
        applicationDeadline: program.applicationDeadline,
        applicationTarget: program.application,
        usesSimulation: Boolean(program.usesSimulation),
        hasFieldExercise: Boolean(program.hasFieldExercise),
        libraryCollectionKey: program.libraryCollectionKey,
        ...(program.status === 'completed' && program.participantCount
          ? { results: { participantCount: program.participantCount } }
          : {}),
        _status: 'published',
      } as never,
    })

    for (const locale of TRANSLATIONS) {
      const content = program[locale]
      await payload.update({
        collection: 'training-programs',
        id: created.id,
        locale,
        ...CTX,
        data: {
          slug: content.slug,
          title: content.title,
          summary: content.summary,
          venue: content.venue,
          targetAudience: content.targetAudience,
          objective: richText(...content.objective),
          learningOutcomes: content.outcomes.map((text) => ({ text })),
          _status: 'published',
        } as never,
      })
    }

    programIds.set(program.code, created.id)
    payload.logger.info(`Egitim programi olusturuldu: ${program.code}`)
  }

  // --- Haberler ve duyurular ------------------------------------------------
  for (const item of NEWS) {
    if (await findBySlug(payload, 'news', item.tr.slug)) continue

    const relatedTrainings = (item.relatedProgramCodes ?? [])
      .map((code) => programIds.get(code))
      .filter((id): id is string | number => id !== undefined)

    const created = await payload.create({
      collection: 'news',
      locale: 'tr',
      ...CTX,
      data: {
        slug: item.tr.slug,
        title: item.tr.title,
        summary: item.tr.summary,
        content: richText(...item.tr.body),
        kind: item.kind,
        category: item.category,
        featured: item.featured,
        publishedAt: item.publishedAt,
        expiresAt: item.expiresAt,
        countries: item.countries,
        ...(relatedTrainings.length > 0 ? { relatedTrainings } : {}),
        _status: 'published',
      } as never,
    })

    for (const locale of TRANSLATIONS) {
      const content = item[locale]
      await payload.update({
        collection: 'news',
        id: created.id,
        locale,
        ...CTX,
        data: {
          slug: content.slug,
          title: content.title,
          summary: content.summary,
          content: richText(...content.body),
          _status: 'published',
        } as never,
      })
    }

    payload.logger.info(`Haber olusturuldu: ${item.tr.title}`)
  }

  payload.logger.info(
    `Seed tamamlandi. ${TOPICS.length} konu, ${PROGRAMS.length} egitim programi, ${NEWS.length} haber hazir.`,
  )
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
