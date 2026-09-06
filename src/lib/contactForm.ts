/**
 * İLETİŞİM FORMUNUN CMS KİMLİĞİ
 * ============================================================================
 * Neden ayrı bir dosya: `'use server'` işaretli modüller YALNIZCA async
 * fonksiyon dışa aktarabilir. Bu sabit sunucu eyleminin içinde durursa
 * derleme şu hatayla düşer:
 *   "Only async functions are allowed to be exported in a use server file."
 *
 * Sabit üç yerde kullanılır ve üçünün de aynı değeri görmesi gerekir:
 *   - `scripts/seed.ts`      → formu bu başlıkla oluşturur
 *   - `iletisim/actions.ts`  → gönderimi bu forma bağlar
 *   - `iletisim/page.tsx`    → açık rıza metnini bu formdan okur
 * ============================================================================
 */
export const CONTACT_FORM_TITLE = 'İletişim Formu'
