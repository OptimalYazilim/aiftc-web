import { withPayload } from '@payloadcms/next/withPayload'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

/**
 * `output: 'standalone'` VE WINDOWS
 * ============================================================================
 * Standalone çıktısı üretimde ZORUNLUDUR: `Dockerfile` doğrudan
 * `.next/standalone` dizinini kopyalar. Varsayılan bu yüzden değiştirilmemiştir.
 *
 * Ancak bu adım (`Collecting build traces`) bağımlılıkları sembolik linklerle
 * kopyalar. Windows'ta sembolik link oluşturmak Geliştirici Modu veya yönetici
 * yetkisi ister; ikisi de yoksa derleme şu hatayla düşer:
 *   EPERM: operation not permitted, symlink ... -> .next\standalone\node_modules\...
 * pnpm'in symlink tabanlı store'u bu adımı çok sayıda link üreterek büyütür.
 * Hata KODLA İLGİLİ DEĞİLDİR; derlemenin geri kalanı (tip kontrolü, statik
 * üretim) o noktada çoktan tamamlanmıştır.
 *
 * Kalıcı çözüm (yerel makinede, bir kez):
 *   Ayarlar > Gizlilik ve güvenlik > Geliştiriciler için > Geliştirici Modu
 *
 * Geçici çözüm — yalnızca YEREL doğrulama için standalone'u atlar:
 *   $env:NEXT_BUILD_NO_STANDALONE='true'; pnpm build
 * Docker derlemesi bu değişkeni SET ETMEZ, dolayısıyla üretim çıktısı aynen
 * standalone üretmeye devam eder.
 * ============================================================================
 */
const standaloneDisabled = process.env.NEXT_BUILD_NO_STANDALONE === 'true'

/**
 * DERLEME DİZİNİ — E2E TESTLERİ İÇİN AYRILABİLİR
 * ============================================================================
 * Değişken SET EDİLMEZSE hiçbir şey değişmez: Next varsayılan `.next`i
 * kullanır. Üretim ve Docker derlemeleri bu değişkeni set etmez.
 *
 * NEDEN VAR
 * ---------------------------------------------------------------------------
 * İKİ ÖLÇÜLMÜŞ SORUN (2026-09-26, Windows):
 *
 *  1. Var olan bir `.next` üzerine yeniden derlemek "Cannot find module for
 *     page" (ENOENT) hatalarıyla çöküyor; temiz dizine derlemek her seferinde
 *     başarılı oluyor. E2E koşusu bu yüzden dizini önce silmek zorundadır.
 *
 *  2. Testler `.next`i silseydi geliştirme sunucusunun derlemesi de her
 *     koşuda yok olur, `pnpm dev` baştan derlemek zorunda kalırdı.
 *
 * Testler `.env.test` ile `NEXT_DIST_DIR=.next-test` verir; `next build` ve
 * `next start` aynı yapılandırmayı okuduğu için ikisi de o dizini kullanır ve
 * `.next` hiç ellenmez.
 * ============================================================================
 */
const distDir = process.env.NEXT_DIST_DIR

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(standaloneDisabled ? {} : { output: 'standalone' }),
  ...(distDir ? { distDir } : {}),
  reactStrictMode: true,
  poweredByHeader: false,

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      ...(process.env.NEXT_PUBLIC_SERVER_URL
        ? [
            {
              protocol: new URL(process.env.NEXT_PUBLIC_SERVER_URL).protocol.replace(':', ''),
              hostname: new URL(process.env.NEXT_PUBLIC_SERVER_URL).hostname,
            },
          ]
        : []),
    ],
  },

  // OWASP temel guvenlik basliklari (Sartname 12.1)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ]
  },
}

export default withPayload(withNextIntl(nextConfig), { devBundleServerPackages: false })
