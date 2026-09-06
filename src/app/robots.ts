import type { MetadataRoute } from 'next'

import { PRIMARY_DOMAIN } from '@/i18n/locales'

/**
 * DOSYA KONUMU — DİKKAT
 * ============================================================================
 * Bu dosya bilerek `app/` KÖKÜNDE durur, `app/(frontend)/` içinde değil.
 *
 * Next.js 15.5'te route grubu içine konan `robots.ts` HİÇ KAYDEDİLMİYOR:
 * /robots.txt sessizce 404 döner — ne hata fırlatır ne de günlüğe düşer.
 * Aynı gruptaki `sitemap.ts` ise sorunsuz çalışır. Bu asimetri fark edilmesi
 * zor olduğu için buraya yazılmıştır: iki dosyayı "düzen olsun" diye aynı
 * klasöre taşımayın, robots.txt sessizce kaybolur.
 *
 * Doğrulama: /robots.txt adresi 200 ve text/plain dönmelidir.
 * ============================================================================
 *
 * Yönetim paneli ve API dizinleri taramaya kapalıdır (Şartname 12.1).
 * Üretim dışı ortamlarda tüm site kapatılır — test kopyasının aranabilir
 * hale gelmesi kurumsal görünürlük açısından risklidir.
 */
export default function robots(): MetadataRoute.Robots {
  const isProduction =
    process.env.NODE_ENV === 'production' && !PRIMARY_DOMAIN.includes('localhost')

  if (!isProduction) {
    return { rules: [{ userAgent: '*', disallow: '/' }] }
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/api/'],
      },
    ],
    sitemap: `${PRIMARY_DOMAIN}/sitemap.xml`,
    host: PRIMARY_DOMAIN,
  }
}
