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

/**
 * ZENGİN METİNDEN KART ÖZETİ ÜRETİR.
 * ---------------------------------------------------------------------------
 * Bazı koleksiyonlarda (örn. `projects`) ayrı bir `summary`/`textarea` alanı
 * YOKTUR; kartta gösterilecek tek metin `richText` gövdesidir. Bu yardımcı o
 * ağaçtan düz metin toplar ve kelime sınırında keser.
 *
 * NEDEN AYRI BİR ALAN AÇILMADI: özet alanı eklemek editöre aynı cümleyi iki
 * kez yazdırır ve zamanla ikisi ayrışır. Gövdeden türetmek her zaman güncel
 * kalır. Ödünü şudur: özet, editörün seçtiği bir cümle değil, gövdenin ilk
 * cümleleridir — kart için yeterlidir, künye için değil.
 *
 * Kesme KELİME SINIRINDA yapılır; ortasından bölünmüş bir sözcük özensiz
 * görünür ve ekran okuyucuda anlamsız bir hece okunur.
 */
export const richTextExcerpt = (data: unknown, maxLength = 220): string | null => {
  if (!hasRichTextContent(data)) return null

  const parcalar: string[] = []

  const gez = (node: unknown): void => {
    const item = node as { text?: unknown; children?: unknown[] }
    if (typeof item?.text === 'string') parcalar.push(item.text)
    if (Array.isArray(item?.children)) item.children.forEach(gez)
  }

  gez((data as { root?: unknown }).root)

  const metin = parcalar.join(' ').replace(/\s+/g, ' ').trim()
  if (!metin) return null
  if (metin.length <= maxLength) return metin

  const kesilmis = metin.slice(0, maxLength)
  const sonBosluk = kesilmis.lastIndexOf(' ')
  return `${(sonBosluk > 40 ? kesilmis.slice(0, sonBosluk) : kesilmis).trimEnd()}…`
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
