import { timingSafeEqual } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'

import { purgeExpiredFormRequests } from '@/lib/kvkkRetention'
import { payloadClient } from '@/lib/queries'

/**
 * KVKK TEMİZLİK UÇ NOKTASI  (Şartname 12.2)
 * ============================================================================
 * Saklama süresi dolmuş form gönderimlerini siler. Silme kararının tamamı
 * `lib/kvkkRetention.ts` içindedir; burada YALNIZCA yetkilendirme ve HTTP
 * sözleşmesi vardır.
 *
 *   GET   → KURU ÇALIŞMA. Ne silineceğini raporlar, HİÇBİR ŞEY SİLMEZ.
 *   POST  → Siler.
 *
 * Neden ayrımı böyle: silme geri alınamaz. Zamanlayıcıyı kurarken önce GET ile
 * ne olacağı görülebilmeli. Ayrıca GET'in yan etkisi olmaması HTTP'nin kendi
 * kuralıdır; bir önizleme aracı veya güvenlik tarayıcısı adresi çektiğinde
 * veri silinmemelidir.
 *
 * ---------------------------------------------------------------------------
 * YETKİLENDİRME — HATA DURUMUNDA KAPALI
 * ---------------------------------------------------------------------------
 * `CRON_SECRET` tanımlı DEĞİLSE uç nokta çalışmaz ve 503 döner. "Sır yoksa
 * herkese açık" davranışı, yanlışlıkla dağıtılmış bir ortamda tüm form
 * kayıtlarını silinebilir hâle getirirdi.
 *
 * Karşılaştırma sabit sürelidir: `===` karakter karakter kısa devre yapar ve
 * yanıt süresinden sırrın ilk baytları çıkarılabilir.
 *
 * ---------------------------------------------------------------------------
 * NASIL ZAMANLANIR — SEÇİM DAĞITIMA BAĞLIDIR, KOD BİLMEZ
 * ---------------------------------------------------------------------------
 * Payload'ın kendi iş kuyruğu (jobs) yerine dışarıdan tetiklenen bir uç nokta
 * tercih edildi: proje Docker ile dağıtılıyor (bkz. docker-compose.yml) ama
 * sunucusuz bir ortama da taşınabilir. Uç nokta her ikisinde de çalışır;
 * süreç içi bir zamanlayıcı sunucusuz ortamda hiç tetiklenmezdi ve bu sessiz
 * bir KVKK ihlali olurdu.
 *
 * Docker / systemd (günlük 03:15):
 *     15 3 * * *  curl -fsS -X POST \
 *       -H "Authorization: Bearer $CRON_SECRET" \
 *       https://aiftc.org/api/kvkk/temizlik
 *
 * Kurulumdan sonra ÖNCE kuru çalışma ile doğrulayın:
 *     curl -H "Authorization: Bearer $CRON_SECRET" \
 *       https://aiftc.org/api/kvkk/temizlik
 *
 * DİKKAT — zamanlayıcı kurulmazsa bu dosya hiçbir işe yaramaz. Temizlik
 * kendiliğinden çalışmaz; dağıtım kontrol listesine EKLENMELİDİR.
 * ============================================================================
 */

/** Önbelleğe alınmamalı: her çağrı gerçek veritabanı durumunu görmeli. */
export const dynamic = 'force-dynamic'

const unauthorized = () =>
  NextResponse.json({ error: 'Yetkisiz istek.' }, { status: 401 })

/**
 * `Authorization: Bearer <sır>` başlığını doğrular.
 * Dönüş: 'ok' | 'unauthorized' | 'not-configured'
 */
const authorize = (request: NextRequest): 'ok' | 'unauthorized' | 'not-configured' => {
  const secret = process.env.CRON_SECRET
  if (!secret || secret.trim().length === 0) return 'not-configured'

  const header = request.headers.get('authorization') ?? ''
  const provided = header.startsWith('Bearer ') ? header.slice(7) : ''

  const a = Buffer.from(provided, 'utf8')
  const b = Buffer.from(secret, 'utf8')

  // Uzunluklar farklıysa da bir karşılaştırma yapılır: erken dönüş de bir
  // zamanlama sinyalidir.
  if (a.length !== b.length) {
    timingSafeEqual(b, b)
    return 'unauthorized'
  }

  return timingSafeEqual(a, b) ? 'ok' : 'unauthorized'
}

const run = async (request: NextRequest, dryRun: boolean) => {
  const auth = authorize(request)

  if (auth === 'not-configured') {
    return NextResponse.json(
      {
        error:
          'CRON_SECRET tanımlı değil. Temizlik ucu yetkilendirme olmadan çalıştırılmaz.',
      },
      { status: 503 },
    )
  }

  if (auth === 'unauthorized') return unauthorized()

  try {
    const payload = await payloadClient()
    const report = await purgeExpiredFormRequests(payload, { dryRun })
    return NextResponse.json(report, { status: 200 })
  } catch {
    // Ayrıntı dışarı verilmez; Payload zaten sunucu günlüğüne yazar.
    return NextResponse.json({ error: 'Temizlik çalıştırılamadı.' }, { status: 500 })
  }
}

/** Kuru çalışma — hiçbir kayıt silinmez. */
export const GET = (request: NextRequest) => run(request, true)

/** Gerçek silme. */
export const POST = (request: NextRequest) => run(request, false)
