import { RichText } from '@payloadcms/richtext-lexical/react'
import React from 'react'

/**
 * LEXICAL RICH TEXT → HTML
 * ============================================================================
 * Payload'in `richText` alanları Lexical'in JSON ağacı olarak saklanır. Bu
 * sarmalayıcı onu React ağacına çevirir ve `rich-text` sınıfıyla (globals.css)
 * biçimlendirir.
 *
 * Neden ayrı bir bileşen: her çağrı yerinde `data` boş mu kontrolü yapmak ve
 * aynı sınıf adını tekrar tekrar yazmak gerekiyordu. Boş bir editör alanı
 * Lexical'de "hiç yok" değil, TEK BOŞ PARAGRAFLI bir ağaçtır; kontrol
 * edilmezse sayfada gereksiz boşluk ve boş bir başlık bölümü oluşur.
 * ============================================================================
 */

type LexicalData = React.ComponentProps<typeof RichText>['data']

/** Ağaçta gerçekten görünür içerik var mı? */
export const hasRichTextContent = (data: unknown): boolean => {
  const children = (data as { root?: { children?: unknown[] } } | null | undefined)?.root?.children
  if (!Array.isArray(children) || children.length === 0) return false

  return children.some((node) => {
    const item = node as { type?: string; text?: string; children?: unknown[] }
    if (item.type === 'horizontalrule' || item.type === 'upload') return true
    if (typeof item.text === 'string' && item.text.trim().length > 0) return true
    return Array.isArray(item.children) && item.children.length > 0
  })
}

export const RichTextBlock: React.FC<{ data: unknown; className?: string }> = ({
  data,
  className = '',
}) => {
  if (!hasRichTextContent(data)) return null

  // `disableContainer` KULLANILMAZ: kapsayıcı kaldırılırsa `className` de
  // uygulanmaz ve `rich-text` biçimlendirmesi kaybolur.
  return <RichText data={data as LexicalData} className={`rich-text ${className}`.trim()} />
}

export default RichTextBlock
