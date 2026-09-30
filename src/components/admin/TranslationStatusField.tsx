'use client'

import { FieldDescription, FieldLabel, useField } from '@payloadcms/ui'
import type { JSONFieldClientComponent } from 'payload'
import React from 'react'

import { LOCALES } from '@/i18n/locales'

/**
 * ÇEVİRİ DURUMU — DÜZENLEME EKRANINDAKİ GÖSTERİM
 * ============================================================================
 * `translationStatus` salt okunur bir JSON alanıdır ve `syncTranslationStatus`
 * kancası doldurur (fields/publishing.ts). Varsayılan hâliyle panel onu bir
 * KOD EDİTÖRÜ olarak basıyordu: editör `{"missing": ["en", "ru"], …}` okumak
 * zorundaydı. Bu bileşen aynı veriyi dil dil rozet olarak gösterir.
 *
 * Değer DEĞİŞTİRİLMEZ; bileşen yalnızca okur. Rozetin metni durumu söyler
 * ("Tamam" / "Eksik"), renk ek işarettir (WCAG 1.4.1).
 * Biçim: admin-theme.css → `.aiftc-ceviri`.
 * ============================================================================
 */
type Durum = { missing?: string[]; complete?: string[]; updatedAt?: string | null }

export const TranslationStatusField: JSONFieldClientComponent = ({ field, path }) => {
  const { value } = useField<Durum | null>({ path: path ?? field.name })
  const eksik = new Set(value?.missing ?? [])
  const hesaplandi = Boolean(value && (value.missing || value.complete))

  return (
    <div className="field-type aiftc-ceviri">
      <FieldLabel label={field.label} path={path} />
      {hesaplandi ? (
        <ul className="aiftc-ceviri__liste">
          {LOCALES.map((dil) => {
            const tamam = !eksik.has(dil.code)
            return (
              <li
                key={dil.code}
                className={`aiftc-ceviri__dil ${tamam ? 'aiftc-ceviri__dil--tamam' : 'aiftc-ceviri__dil--eksik'}`}
              >
                <span className="aiftc-ceviri__kod">{dil.code.toUpperCase()}</span>
                {tamam ? '✓ Tamam' : '⚠ Eksik'}
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="aiftc-ceviri__bos">Kayıt kaydedildiğinde hesaplanır.</p>
      )}
      <FieldDescription description={field.admin?.description} path={path ?? field.name} />
    </div>
  )
}

export default TranslationStatusField
