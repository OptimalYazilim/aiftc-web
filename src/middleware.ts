import createMiddleware from 'next-intl/middleware'
import type { NextRequest } from 'next/server'

import { routing } from '@/i18n/routing'

const intlMiddleware = createMiddleware(routing)

export function middleware(request: NextRequest) {
  return intlMiddleware(request)
}

export const config = {
  /**
   * Payload admin (/admin), Payload API (/api) ve statik dosyalar
   * dil onekinden muaf tutulur.
   */
  matcher: ['/((?!api|admin|_next|_vercel|media|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)'],
}
