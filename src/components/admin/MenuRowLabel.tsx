'use client'

import React from 'react'
import { useRowLabel } from '@payloadcms/ui'

/**
 * Menu ogesi satirlarinda, kapaliyken bile etiketin gorunmesini saglar.
 * Editorun 8 satirlik menuyu tek tek acmasini onler.
 */
type MenuRow = {
  label?: string
  type?: string
  children?: unknown[]
}

const TYPE_LABELS: Record<string, string> = {
  page: 'Sayfa',
  route: 'Bölüm',
  library: 'Kütüphane',
  portal: 'Portal',
  external: 'Harici',
  anchor: 'Başlık',
}

export const MenuRowLabel: React.FC = () => {
  const { data, rowNumber } = useRowLabel<MenuRow>()

  const title = data?.label?.trim() || `Menü öğesi ${String((rowNumber ?? 0) + 1).padStart(2, '0')}`
  const type = data?.type ? TYPE_LABELS[data.type] : undefined
  const childCount = Array.isArray(data?.children) ? data.children.length : 0

  return (
    <span>
      {title}
      {type ? <span style={{ opacity: 0.55 }}> · {type}</span> : null}
      {childCount > 0 ? <span style={{ opacity: 0.55 }}> · {childCount} alt öğe</span> : null}
    </span>
  )
}

export default MenuRowLabel
