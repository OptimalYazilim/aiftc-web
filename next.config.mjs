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

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(standaloneDisabled ? {} : { output: 'standalone' }),
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
