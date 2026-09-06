import type { FieldHook } from 'payload'

/** Kiril -> Latin harf cevrimi (ISO 9 / BGN-PCGN karisimi, URL dostu). */
const CYRILLIC_MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh',
  щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
}

/** Turkce karakter cevrimi. */
const TURKISH_MAP: Record<string, string> = {
  ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u',
}

export const slugify = (input: string): string =>
  input
    .toString()
    .toLowerCase()
    .trim()
    .split('')
    .map((char) => CYRILLIC_MAP[char] ?? TURKISH_MAP[char] ?? char)
    .join('')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // kalan aksanlari kaldir
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)

/**
 * Slug alani icin beforeValidate hook'u.
 * Kullanici slug girdiyse ona dokunmaz; bos ise kaynak alandan uretir.
 */
export const formatSlug =
  (fallbackField: string): FieldHook =>
  ({ data, operation, originalDoc, value }) => {
    if (typeof value === 'string' && value.length > 0) {
      return slugify(value)
    }

    const source = data?.[fallbackField] ?? originalDoc?.[fallbackField]

    if (operation === 'create' || operation === 'update') {
      if (typeof source === 'string' && source.length > 0) {
        return slugify(source)
      }
    }

    return value
  }
