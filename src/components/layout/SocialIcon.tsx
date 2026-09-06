import React from 'react'

/**
 * SOSYAL MEDYA İKONU
 * ============================================================================
 * Platform adı CMS'te SERBEST METİNDİR (Genel Ayarlar > İletişim > Sosyal
 * Medya). Editör "LinkedIn", "linkedin" veya "Linked In" yazabilir; eşleme
 * bu yüzden küçük harfe indirgenmiş ve harf dışı karakterlerden arındırılmış
 * anahtar üzerinden yapılır.
 *
 * TANINMAYAN PLATFORM İKONSUZ KALMAZ: nötr bir küre işaretine düşer. Bir
 * kurum yarın bambaşka bir platforma hesap açtığında footer'da boşluk
 * oluşmamalıdır.
 *
 * İkonlar TAMAMEN DEKORATİFTİR (`aria-hidden`). Platform adı bağlantının
 * `sr-only` metninde geçer — ekran okuyucu "LinkedIn, yeni sekmede açılır"
 * duyar, ikon ayrıca okunmaz (WCAG 2.2 — 1.1.1).
 * ============================================================================
 */

const normalize = (value: string): string => value.toLowerCase().replace(/[^a-z]/g, '')

const PATHS: Record<string, React.ReactNode> = {
  linkedin: (
    <path
      fill="currentColor"
      d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm6.5 0h3.8v1.7h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.5 4.78 5.76V21h-4v-5.6c0-1.34-.03-3.06-1.9-3.06-1.9 0-2.2 1.45-2.2 2.96V21h-4V9Z"
    />
  ),
  youtube: (
    <path
      fill="currentColor"
      d="M22.5 7.2a2.9 2.9 0 0 0-2-2.05C18.7 4.65 12 4.65 12 4.65s-6.7 0-8.5.5a2.9 2.9 0 0 0-2 2.05C1 9 1 12 1 12s0 3 .5 4.8a2.9 2.9 0 0 0 2 2.05c1.8.5 8.5.5 8.5.5s6.7 0 8.5-.5a2.9 2.9 0 0 0 2-2.05C23 15 23 12 23 12s0-3-.5-4.8ZM9.8 15.3V8.7l5.7 3.3-5.7 3.3Z"
    />
  ),
  facebook: (
    <path
      fill="currentColor"
      d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0 0 22 12Z"
    />
  ),
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.9" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.9" />
      <circle cx="17.4" cy="6.6" r="1.2" fill="currentColor" />
    </>
  ),
  x: (
    <path
      fill="currentColor"
      d="M17.53 3h3.24l-7.08 8.09L22 21h-6.53l-5.11-6.68L4.5 21H1.25l7.57-8.65L1.5 3h6.7l4.62 6.11L17.53 3Zm-1.14 16.06h1.8L7.72 4.84H5.8l10.59 14.22Z"
    />
  ),
  twitter: (
    <path
      fill="currentColor"
      d="M17.53 3h3.24l-7.08 8.09L22 21h-6.53l-5.11-6.68L4.5 21H1.25l7.57-8.65L1.5 3h6.7l4.62 6.11L17.53 3Zm-1.14 16.06h1.8L7.72 4.84H5.8l10.59 14.22Z"
    />
  ),
}

/** Tanınmayan platform: nötr küre. */
const GLOBE = (
  <>
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.9" />
    <path
      d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    />
  </>
)

export const SocialIcon: React.FC<{ platform: string; className?: string }> = ({
  platform,
  className = '',
}) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
    className={`h-5 w-5 ${className}`}
  >
    {PATHS[normalize(platform)] ?? GLOBE}
  </svg>
)

export default SocialIcon
